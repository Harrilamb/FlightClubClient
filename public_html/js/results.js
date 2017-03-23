/* global Plotly, Cesium */

angular.module('FlightClub').controller('ResultsCtrl', function ($scope, $cookies, $interval, $http, $location, $mdDialog, $timeout) {

    $scope.$emit('viewBroadcast', 'results');

    $scope.$parent.toolbarTitle = 'Flight Club | Results';
    $scope.$parent.toolbarClass = "";
    $scope.loadMessage = "Building plots...";   
    $scope.selectedIndex = 0;
    
    $scope.export_icon = 'content_copy';
    $scope.exportStyle = false;
    $scope.padViews = {};
    $scope.initialised = false;

    $scope.messageArray = [
        // p is probability of update being skipped until next interval
        { p: 0.2, message: 'Engine Chill'},
        { p: 0.2, message: 'Terminal Count'},
        { p: 0.2, message: 'Main Engine Start'},
        { p: 0.5, message: 'Liftoff!'},
        { p: 0.3, message: 'Vehicle is supersonic'},
        { p: 0.3, message: 'Vehicle is passing through Max Q'},
        { p: 0.6, message: 'MECO!'},
        { p: 0.3, message: 'Stage separation. Good luck Stage 1...'},
        { p: 0.5, message: 'Upper stage ignition'},
        { p: 0.5, message: 'Boostback looks good'},
        { p: 0.4, message: 'Entry burn is complete'},
        { p: 0.3, message: 'Landing burn has begun'},
        { p: 0.6, message: 'LZ-1, The Falcon has landed'},
        { p: 0.5, message: 'We have SECO!'},
        { p: 0.95, message: 'A huge thank you to my GEO Patrons for supporting Flight Club!<ul>'+$scope.$parent.getGEOPatronList()+'</ul><a href="https://www.patreon.com/flightclub" target="_blank">Click here to support me on Patreon!</a>'},
        { p: 0.0, message: 'Follow me on Twitter: <a href="https://www.twitter.com/flightclubio" target="_blank">@flightclubio</a>'}        
    ];
    
    var i = 0, offset, fileData = [];
    $scope.missionLoadingMessage = $scope.messageArray[i++].message;
    var roller = $interval(function() {
        if (i === $scope.messageArray.length || $scope.loadSuccess)
            $interval.cancel(roller);
        else if (Math.random() > $scope.messageArray[i-1].p)
            $scope.loadMessageSecondary = $scope.messageArray[i++].message;
    }, 350);
    
    $scope.animate_rocket = function () {

        var windowWidth = window.innerWidth 
                || document.documentElement.clientWidth 
                || document.getElementsByTagName('body')[0].clientWidth;
        var loadPos = 0;

        var elem = document.getElementById("rocket");
        var id = setInterval(frame, 5);
        function frame() {
            if ($scope.loadSuccess || loadPos > 99.9) {
                clearInterval(id);
            } else {
                loadPos += 0.002 * (100 - loadPos);
                var margin = 0.01 * loadPos * windowWidth + 'px';
                elem.style.marginLeft = margin;
            }
        }

    };

    $scope.load = function (queryString) {
        
        $scope.queryString = queryString;
        $scope.queryParams = $scope.$parent.parseQueryString(queryString);
        
        if($scope.queryParams.view !== undefined && $scope.queryParams.view.length > 0) {
            switch ($scope.queryParams.view[0]) {
                case 'space':
                    offset = $scope.COLS.xAbs - $scope.COLS.x;
                    break;
                case 'earth':
                default:
                    offset = 0;
                    break;
            }
        } else {
            offset = 0;
        }
        
        if($scope.queryParams.tab !== undefined && $scope.queryParams.tab.length>0) {
            $timeout(function() {
               $scope.selectedIndex = parseInt($scope.queryParams.tab[0]);
            });
        }
        
        $scope.httpRequest('/simulator/results?' + queryString, 'GET', null,
                function (data) {
                    
                    var json = data.data;
                    
                    var fileMap = new Object();
                    var files = json.Mission.Output.Files;
                    files.forEach(function (key) {
                        fileMap[key.desc] = $scope.$parent.client + key.url;
                    });

                    var warningsFile = fileMap['warnings'];
                    if (warningsFile !== undefined) {
                        $http.get(warningsFile).then(function (txt) {
                            var warnings = txt.data.split(";");

                            $scope.warnings = [];
                            warnings.forEach(function(warning) {
                                if (warning.length > 0)
                                    $scope.warnings.push(warning);
                            });

                        });
                    }

                    var telemetryFile = fileMap['telemetry'];
                    if (telemetryFile !== undefined) {
                        $http.get(telemetryFile).then(function (txt) {

                            var lines = txt.data.split("\n");
                            $scope.landing = [];
                            lines.forEach(function(line, i) {
                                // time-event map
                                if (i === 0) {
                                    $scope.events = [];
                                    var event = line.split(';');
                                    event.forEach(function(keyVal) {
                                        var pair = keyVal.split(':');
                                        if (pair[0] !== undefined && pair[1] !== undefined) {
                                            $scope.events.push({when: pair[0], what: pair[1]});
                                        }
                                    });
                                } else {
                                    var map = line.split(':');
                                    if(map.length>1) {
                                        var infoMap = map[1].split(';');

                                        switch (map[0]) {
                                            case 'Landing':
                                                infoMap.forEach(function (keyVal) {
                                                    var pair = keyVal.split('=');
                                                    if (pair[0] !== undefined && pair[1] !== undefined) {
                                                        $scope.landing.push({when: pair[0], what: pair[1]});
                                                    }
                                                });
                                                break;
                                            case 'Orbit':
                                                $scope.orbit = [];
                                                infoMap.forEach(function (keyVal) {
                                                    var pair = keyVal.split('=');
                                                    if (pair[0] !== undefined && pair[1] !== undefined) {
                                                        $scope.orbit.push({when: pair[0], what: pair[1]});
                                                    }
                                                });
                                                break;
                                        }
                                    }
                                }
                            });
                        });
                    }
                }, function (data) {
                    $scope.isLoading = false;
                }
        );

        $scope.requireLiveIDs = false;
        if ($scope.queryParams.id === undefined) {
            $scope.queryParams.id = [];
            $scope.requireLiveIDs = true;
        }

        $scope.queryParams.code.forEach(function (code, key) {
            $scope.httpRequest('/missions/' + code, 'GET', null,
                    function (data) {
                        var json = data.data;
                        if (json.Mission !== undefined) {
                            if ($scope.requireLiveIDs) {
                                $scope.queryParams.id[key] = json.Mission.livelaunch;
                            }
                        }

                        if ($scope.queryParams.id.length >= $scope.queryParams.code.length) {
                            $scope.httpRequest('/launchsites/' + json.Mission.launchsite, 'GET', null,
                                    function (data) {
                                        var json = data.data;
                                        $scope.launchSite = json.data[0];
                                    }
                            );
                    
                            var tempDate = json.Mission.date.replace(/-/g, "/") + ' ' + json.Mission.time + ' UTC';
                            $scope.launchTime = Date.parse(tempDate);
                            $scope.missionName = json.Mission.description;
                            $scope.stageMap = [];
                            $scope.getEventsFile(0, 0);
                        }

                    }, function (data) {
                        $scope.isLoading = false;
                    }
            );
        });
    };

    $scope.animate_rocket();
    var formHash = window.location.hash.substring(1);
    var queryString = window.location.search.substring(1);

    if (formHash) {
        $scope.loadMessage = "Calculating trajectory...";    
        var formData = window.atob(formHash);

        $scope.httpRequest('/simulator/new', 'POST', formData,
                function (data) {
                    var json = data.data;
                    if (json.Mission.success === true) {
                        var queryString = json.Mission.output.split('?')[1];
                        $scope.failureMode = json.Mission.failureMode;
                        $scope.loadMessage = "Building plots...";
                        $scope.redirect('/results/?' + queryString);
                        $scope.load(queryString);
                    } else {
                        var errorsHash = window.btoa(JSON.stringify(json));
                        $scope.redirect('/error/#' + errorsHash);
                    }
                },
                function (data) {
                    var json = data.data;
                    var errors, errorsHash = '';
                    if (json.responseJSON !== undefined) {
                        errors = json.responseJSON.Mission.errors;
                        errorsHash = window.btoa(errors);
                    }
                    $scope.redirect('/error/#' + errorsHash);
                });    
    } else if (queryString) {
        $scope.load(queryString);
    }

    var PLOTS = ['altitude1', 'profile1', 'inclination', 
        'velocity1', 'prop', 'phase1',
         'throttle', 'accel1', 'q',
        'aoa', 'aov', 'total-dv', 
        'aop', 'heading', 'drag'
        ];
    $scope.plotTiles = (function () {
        var tiles = [];
        PLOTS.forEach(function(PLOT) {
            tiles.push({title: PLOT});
        });
        return tiles;
    })();

    $scope.loadSuccess = false;
    $scope.isLoading = true;
    $scope.fullData = [];
    $scope.eventsData = [];
    $scope.focusPoints = [];
    $scope.stageMap = [];
    $scope.overrideAttempted = false;
    $scope.overrideInProgress = false;

    //////////////////////////////////////

    $scope.overrideLive = function () {
        if ($cookies.get($scope.$parent.cookies.AUTHTOKEN) === undefined)
            return;

        $scope.overrideInProgress = true;
        $scope.overrideAttempted = true;

        var queryString = window.location.search.substring(1);
        queryString += '&auth=' + $cookies.get($scope.$parent.cookies.AUTHTOKEN);
        $scope.httpRequest('/live/init?' + queryString, 'GET', null,
                function (data) {
                    var json = data.data;
                    $scope.overrideStatus = json.Success ? "check" : "close";
                    $scope.overrideStatusColor = json.Success ? '#82CA9D' : '#F7977A';
                    $scope.overrideInProgress = false;
                },
                function () {
                    $scope.overrideStatus = "close";
                    $scope.overrideStatusColor = '#F7977A';
                    $scope.overrideInProgress = false;
                });
    };

    $scope.getHazardMap = function () {

        w.entities = [];
        w.viewer.entities.removeAll();

        $http.get($scope.$parent.server + '/resource/' + $scope.queryParams.code[0] + '.hazard.txt')
                .then(successfn, errorfn);

        function successfn(res) {

            var lines = res.data.split("\n");
            var array = [];
            for (var i = 0; i < lines.length; i++) {

                if (lines[i].indexOf(";") === -1) {
                    if (array.length > 0) {
                        w.viewer.entities.add({
                            polygon: {
                                hierarchy: Cesium.Cartesian3.fromDegreesArrayHeights(array),
                                extrudedHeight: 0,
                                material: Cesium.Color.RED.withAlpha(0.3),
                                outline: true,
                                outlineColor: Cesium.Color.RED
                            }
                        });
                        array = [];
                    }
                }

                if (lines[i].indexOf(";") > -1) {
                    var data = lines[i].split(";");
                    array.push(data[0], data[1], 1);
                }
            }

            $scope.queryParams.id.forEach(function(id, key) {
                $scope.stageMap[0].forEach(function(stage) {
                    $scope.buildEntitiesFromResponse(key, stage.id);
                });
            });
            $scope.initialised = true;
        }

        function errorfn(res) {
            $scope.queryParams.id.forEach(function(id, key) {
                $scope.stageMap[0].forEach(function(stage) {
                    $scope.buildEntitiesFromResponse(key, stage.id);
                });
            });
        }
    };

    $scope.getDataFile = function (key, stage) {
        
        $http.get($scope.$parent.client + '/output/' + $scope.queryParams.id[key] + '_' + stage + '.dat')
                .then(successfn, errorfn);
        
        function successfn(data) {
            
            if(fileData[key] === undefined)
                fileData[key] = [];
            fileData[key][stage] = data;
            
            var lines = data.data.split("\n");
            if($scope.fullData[key] === undefined)
                $scope.fullData[key] = [];
            $scope.fullData[key][stage] = [];
            if($scope.stageMap[key] === undefined)
                $scope.stageMap[key] = [];
            $scope.stageMap[key].push({id: stage, name: lines[0].split("#")[1]});

            Object.keys($scope.COLS).forEach(function (label, i) {
                $scope.fullData[key][stage][i] = [];
                lines.forEach(function (line, j) {
                    line = line.split(";");
                    $scope.fullData[key][stage][i][j] = parseFloat(line[i]);
                });
            });

            $scope.getEventsFile(key, ++stage);
        }

        function errorfn(data) {
            console.log(data);
        }
    };

    $scope.getEventsFile = function (key, stage) {
        
        $http.get($scope.$parent.client + '/output/' + $scope.queryParams.id[key] + '_' + stage + '_events.dat')
                .then(successfn, errorfn);

        function successfn(data) {
            
            if(data.data.indexOf("html") !== -1) {
                if(key !== $scope.queryParams.id.length-1) {
                    $scope.getEventsFile(++key, 0);
                }
                else if(!$scope.initialised) {
                    $scope.initialisePlots();
                    $scope.loadCesium();
                } else {
                    $scope.getHazardMap();                    
                }
            } else {

                var lines = data.data.split("\n");
                if($scope.eventsData[key] === undefined) {
                    $scope.eventsData[key] = [];
                    $scope.focusPoints[key] = [];
                }
                $scope.eventsData[key][stage] = [];
                $scope.focusPoints[key][stage] = [];

                Object.keys($scope.COLS).forEach(function (label, i) {
                    $scope.eventsData[key][stage][i] = [];
                    lines.forEach(function (line, j) {
                        line = line.split(";");
                        $scope.eventsData[key][stage][i][j] = parseFloat(line[i]);
                        
                    if (line.length === 1)
                        return;

                        if (i === 0)
                            $scope.focusPoints[key][stage].push([parseFloat(line[$scope.COLS.time]), parseFloat(line[$scope.COLS.throttle])]);
                    });
                });

                $scope.getDataFile(key, stage);
            }
        }

        function errorfn(data) {
            console.log(data);
        }
    };

    $scope.plotMap = [];
    $scope.initialisePlots = function () {
        
        var allStages = [], lowerStages = [];
        $scope.queryParams.id.forEach(function (id, key) {
            allStages[key] = [];
            lowerStages[key] = [];
            $scope.stageMap[key].forEach(function (el, i) {
                allStages[key].push(i);
                if ($scope.stageMap[key].length === 1 || i !== $scope.stageMap[key].length - 1)
                    lowerStages[key].push(i);
            });
        });

        $scope.plotMap.push({id: 'altitude1', stages: allStages, title: "Altitude", events: true,
            x: {axis: $scope.COLS.time, label: "Time (s)", type: "linear"},
            y: {axis: $scope.COLS.alt, label: "Altitude (km)", type: "linear"}});
        $scope.plotMap.push({id: 'profile1', stages: allStages, title: "Profile", events: true,
            x: {axis: $scope.COLS.range, label: "Downrange (km)", type: "linear", range: [0, 300]},
            y: {axis: $scope.COLS.alt, label: "Altitude (km)", type: "linear", range: [0, 300]}});
        $scope.plotMap.push({id: 'inclination', stages: allStages, title: "Inclination", events: false,
            x: {axis: $scope.COLS.time, label: "Time (s)", type: "linear"},
            y: {axis: $scope.COLS.incl, label: "Incl (°)", type: "linear", range: [-180, 180]}});
        
        $scope.plotMap.push({id: 'velocity1', stages: allStages, title: "Velocity", events: true,
            x: {axis: $scope.COLS.time, label: "Time (s)", type: "linear"},
            y: {axis: $scope.COLS.vel, label: "Velocity (m/s)", type: "linear"}});
        $scope.plotMap.push({id: 'prop', stages: allStages, title: "Propellant Mass", events: false,
            x: {axis: $scope.COLS.time, label: "Time (s)", type: "log"},
            y: {axis: $scope.COLS.fuel, label: "Mass (t)", type: "log"}});
        $scope.plotMap.push({id: 'phase1', stages: lowerStages, title: "Booster Phasespace", events: true,
            x: {axis: $scope.COLS.alt, label: "Altitude (km)", type: "linear"},
            y: {axis: $scope.COLS.vel, label: "Velocity (m/s)", type: "linear"}});
        
        $scope.plotMap.push({id: 'throttle', stages: allStages, title: "Throttle", events: false,
            x: {axis: $scope.COLS.time, label: "Time (s)", type: "linear", range: [0, 1000]},
            y: {axis: $scope.COLS.throttle, label: "Throttle", type: "linear"}});
        $scope.plotMap.push({id: 'accel1', stages: allStages, title: "Acceleration", events: true,
            x: {axis: $scope.COLS.time, label: "Time (s)", type: "linear", range: [0, 1000]},
            y: {axis: $scope.COLS.accel, label: "Acceleration (g)", type: "linear"}});
        $scope.plotMap.push({id: 'q', stages: lowerStages, title: "Aerodynamic Pressure", events: true,
            x: {axis: $scope.COLS.time, label: "Time (s)", type: "linear"},
            y: {axis: $scope.COLS.q, label: "Pressure (kN/m^2)", type: "linear"}});
        
        $scope.plotMap.push({id: 'aoa', stages: allStages, title: "Angle of Attack", events: true,
            x: {axis: $scope.COLS.time, label: "Time (s)", type: "linear", range: [0, 1000]},
            y: {axis: $scope.COLS.aoa, label: "Angle (°)", type: "linear", range: [-180, 180]}});
        $scope.plotMap.push({id: 'aov', stages: allStages, title: "Velocity Angle", events: true,
            x: {axis: $scope.COLS.time, label: "Time (s)", type: "linear", range: [0, 1000]},
            y: {axis: $scope.COLS.aov, label: "Angle (° rel. to surface)", type: "linear", range: [-180, 180]}});
        $scope.plotMap.push({id: 'total-dv', stages: allStages, title: "Total dV Expended", events: false,
            x: {axis: $scope.COLS.time, label: "Time (s)", type: "log"},
            y: {axis: $scope.COLS.dV_tot, label: "dV (m/s)", type: "log"}});
        
        $scope.plotMap.push({id: 'aop', stages: allStages, title: "Pitch", events: true,
            x: {axis: $scope.COLS.time, label: "Time (s)", type: "linear", range: [0, 1000]},
            y: {axis: $scope.COLS.pitch, label: "Angle (°)", type: "linear", range: [-90, 90]}});
        $scope.plotMap.push({id: 'heading', stages: allStages, title: "Heading", events: true,
            x: {axis: $scope.COLS.time, label: "Time (s)", type: "linear", range: [0, 1000]},
            y: {axis: $scope.COLS.yaw, label: "Angle (° cc from East)", type: "linear", range: [-180, 180]}});
        $scope.plotMap.push({id: 'drag', stages: lowerStages, title: "Drag Coefficient", events: true,
            x: {axis: $scope.COLS.time, label: "Time (s)", type: "linear", range: [0, 1000]},
            y: {axis: $scope.COLS.cd, label: "Cd", type: "linear"}});
        /*$scope.plotMap.push({id: 'thrust-coeff', stages: lowerStages, title: "Thrust Coefficient", events: true,
            x: {axis: $scope.COLS.time, label: "Time (s)", type: "linear", range: [0, 1000]},
            y: {axis: 22, label: "Ct", type: "linear"}});*/

        $timeout(function () {
            
            $scope.isLoading = false;
            $scope.loadSuccess = true;
            $scope.$apply();
            
            $scope.plotMap.forEach(function(plot) {
                $scope.initialisePlot2(plot);
            });

            if (!$scope.failureMode)
                setTimeout(askForSupport, 1000);
            else {
                $scope.openThemedDialog(
                        'Mission Failure!',
                        $scope.failureMode,
                        null, null,
                        'Ok', null
                        );
            }
        });
        
    };

    $scope.initialisePlot2 = function (plot) {

        var data = [];
        $scope.queryParams.id.forEach(function (id, key) {
            plot.stages[key].forEach(function (s) {
                if ($scope.fullData[key][s] !== undefined) {
                    data.push({
                        x: $scope.fullData[key][s][plot.x.axis],
                        y: $scope.fullData[key][s][plot.y.axis],
                        mode: 'lines',
                        name: $scope.stageMap[key][s].name
                    });
                }
            });
            if (plot.events) {
                plot.stages[key].forEach(function (s) {
                    if ($scope.fullData[key][s] !== undefined) {
                        data.push({
                            x: $scope.eventsData[key][s][plot.x.axis],
                            y: $scope.eventsData[key][s][plot.y.axis],
                            mode: 'markers',
                            showlegend: false,
                            name: $scope.stageMap[key][s].name + ' Event'
                        });
                    }
                });
            }
        });

        var fontColor = $scope.$parent.theme==='fc_dark' ? '#fafafa' : '#181c1f';
        var bgColor = $scope.$parent.theme==='fc_dark' ? '#303030' : '#fafafa';
        var layout = {
            title: plot.title,
            showlegend: false,
            font: {
                family: 'Brandon Grotesque',
                size: 15,
                color: fontColor
            },
            xaxis: {
                color: fontColor,
                type: plot.x.type, 
                title: plot.x.label, 
                range: plot.x.range
            },
            yaxis: {
                color: fontColor,
                type: plot.y.type, 
                title: plot.y.label,
                range: plot.y.range
            },
            paper_bgcolor: bgColor,
            plot_bgcolor: bgColor
        };
        
        Plotly.newPlot(plot.id, data, layout);

    };
    
    $scope.$parent.$watch('theme', function() {
        
        if($scope.plotMap) {
            $scope.plotMap.forEach(function(plot) {
                $scope.initialisePlot2(plot);
            });
        }
        
    });
    
    var askForSupport = function() {
         
        if ($scope.supports_html5_storage()) {
            var donateRequest = window['localStorage']['fc_donateRequest'];
            if (donateRequest === undefined && $cookies.get($scope.$parent.cookies.SIMCOUNT) >= 3) {
                
                $scope.openThemedDialog('Support me on Patreon!', 
                        'Hi, I\'m really sorry and I hate myself for annoying you with popups, but if you like Flight Club, I\'d really appreciate it if you considered supporting me on Patreon! I promise you\'ll never see this message again either way :)',
                        'This site sucks', function () {window['localStorage']['fc_donateRequest'] = 1;},
                        'I love this site!', function () {window['localStorage']['fc_donateRequest'] = 1;window.open('https://www.patreon.com/flightclub', '_blank');}
                    );
            }
        }
    };
    
    var w;
    $scope.worldLoading = true;
    $scope.loadCesium = function () {
        
        window.CESIUM_BASE_URL = '//cesiumjs.org/releases/1.29/Build/Cesium/';
        $scope.getScript(CESIUM_BASE_URL + "Cesium.js", function ()
        {
            cesiumLoaded = true;
            Cesium.BingMapsApi.defaultKey = 'Atr1lJvbFdMUnJ6fw4qGKDcZuEjzVRh-6WLmrRZDcCggpZIPH9sdEyUWGWXO1kPc';

            w = new world();

            var launchDate = new Date($scope.launchTime);
            var end = new Date($scope.launchTime + 600e3);
            var now = new Date($scope.launchTime - 30e3);

            w.entities = [];
            w.viewer = new Cesium.Viewer('cesiumContainer', {
                timeline: true,
                animation: true,
                fullscreenButton: false,
                homeButton: false,
                geocoder: false,
                baseLayerPicker: false,
                skyAtmosphere: false,
                creditContainer: document.getElementById("creditContainer"),
                clock: new Cesium.Clock({
                    startTime: Cesium.JulianDate.fromDate(launchDate),
                    currentTime: Cesium.JulianDate.fromDate(now),
                    stopTime: Cesium.JulianDate.fromDate(end),
                    clockRange: Cesium.ClockRange.UNBOUNDED,
                    clockStep: Cesium.ClockStep.SYSTEM_CLOCK_MULTIPLIER
                }),
                terrainProvider: new Cesium.CesiumTerrainProvider({
                    url: '//assets.agi.com/stk-terrain/world' // makes the landscape 3D
                })

            });

            /* add to revert to old (include sun) */
            w.viewer.scene.globe.enableLighting = true;
            /**/

            w.viewer.timeline.updateFromClock();
            w.viewer.timeline.zoomTo(w.viewer.clock.startTime, w.viewer.clock.stopTime);

            $scope.worldLoading = false;

            var animation = document.getElementsByClassName("cesium-viewer-animationContainer")[0];
            animation.className += " hide";
            var timeline = document.getElementsByClassName("cesium-viewer-timelineContainer")[0];
            timeline.className += " hide";

            w.setCameraLookingAt($scope.launchSite.code);
            $scope.getHazardMap();

        });
    };
    
    $scope.buildEntitiesFromResponse = function (key, stage) {
        
        var data = fileData[key][stage];
        var lines = data.data.split("\n");

        var p_stage = new Cesium.SampledPositionProperty();
        var o_stage = new Cesium.SampledProperty(Cesium.Quaternion);
        var trajectory = new Cesium.SampledPositionProperty();

        var launchDate = new Date($scope.launchTime);

        var start = Cesium.JulianDate.fromDate(launchDate);
        var stop = Cesium.JulianDate.addSeconds(start, 600000, new Cesium.JulianDate());

        var t = 0;
        for (var i = 2; i < lines.length; i++) {

            if (lines[i] === "")
                continue;

            var line = lines[i].split(";");
            if (line.length === 1)
                line = lines[i].split("\t");

            var focus = false;
            var ign = false;
            for (var j = 1; j < $scope.focusPoints[key][stage].length; j++) {
                if (Math.abs(line[$scope.COLS.time] - $scope.focusPoints[key][stage][j][0]) <= 0.5) {
                    focus = true;
                    ign = $scope.focusPoints[key][stage][j - 1][1] > 0.1;
                    break;
                }
            }

            if (!focus && line[$scope.COLS.time] > 1000 && i % 100 !== 0)
                continue;

            t = parseInt(line[$scope.COLS.time]);
            var x = parseFloat(line[$scope.COLS.x + offset]);
            var y = parseFloat(line[$scope.COLS.y + offset]);
            var z = parseFloat(line[$scope.COLS.z + offset]);
            var h = parseFloat(line[$scope.COLS.alt]) * 1e3;

            var lat = 180 * Math.atan(z / Math.sqrt(x * x + y * y)) / Math.PI;
            var lon = 180 * Math.atan2(y, x) / Math.PI;

            var time = Cesium.JulianDate.addSeconds(start, t, new Cesium.JulianDate());
            var position = Cesium.Cartesian3.fromDegrees(lon, lat, h);
            trajectory.addSample(time, position);
            p_stage.addSample(time, position);
            o_stage.addSample(time, Cesium.Transforms.headingPitchRollQuaternion(position, new Cesium.HeadingPitchRoll(-1 * line[$scope.COLS.yaw] * Math.PI / 180.0, line[$scope.COLS.pitch] * Math.PI / 180.0, 0)));

            if (focus) {
                var e = w.viewer.entities.add({
                    availability: new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({start: start, stop: stop})]),
                    position: trajectory,
                    path: {resolution: 1, material: new Cesium.PolylineGlowMaterialProperty({glowPower: 0.1, color: ign ? Cesium.Color.RED : Cesium.Color.DARKCYAN}), width: 8}
                });
                e.position.setInterpolationOptions({
                    interpolationDegree: 5,
                    interpolationAlgorithm: Cesium.LagrangePolynomialApproximation
                });

                trajectory = new Cesium.SampledPositionProperty();
                trajectory.addSample(time, position);
            }
        }

        var ign = $scope.focusPoints[key][stage][$scope.focusPoints[key][stage].length - 1][1] > 0.1;
        var e = w.viewer.entities.add({
            availability: new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({start: start, stop: stop})]),
            position: trajectory,
            path: {resolution: 1, material: new Cesium.PolylineGlowMaterialProperty({glowPower: 0.1, color: ign ? Cesium.Color.RED : Cesium.Color.DARKCYAN}), width: 8}
        });
        e.position.setInterpolationOptions({
            interpolationDegree: 5,
            interpolationAlgorithm: Cesium.LagrangePolynomialApproximation
        });

        return [p_stage, o_stage];

    };
    
    function world() {

        this.setCameraLookingAt = function (site) {
            w.viewer.camera.flyTo(launchPadViews[site]);
        };

        this.setCameraLookingAtCoordinates = function (longitude, latitude) {
            
            // can probably use this logic to remove launchPadViews altogether and have dynamic calcs based on pad coords
            var lat1 = $scope.launchSite.latitude*Math.PI/180.0;
            var lon1 = $scope.launchSite.longitude*Math.PI/180.0;
            var lat2 = latitude*Math.PI/180.0;
            var lon2 = longitude*Math.PI/180.0;
            
            var y = Math.sin(lon1-lon2)*Math.cos(lat1);
            var x = Math.cos(lat2)*Math.sin(lat1) - Math.sin(lat2)*Math.cos(lat1)*Math.cos(lon1-lon2);
            var brng = Math.atan2(y, x)*180/Math.PI;
            
            //$scope.httpRequest('/apikeys/google', 'GET', null, // need to design+build the endpoint
            //        function (data) {
/*
                        //var json = data.data;
                        var googleApiKey = "AIzaSyCPznSBxS5RLlWx9eFZv9Cn_L8JkA7kKDA";//json.key;

                        var URL = 'https://maps.googleapis.com/maps/api/elevation/json';
                        URL += '?locations=' + encodeURIComponent(latitude) + ',' + encodeURIComponent(longitude); // is encode() a real fn?
                        URL += '&key=' + encodeURIComponent(googleApiKey);

                        $http.get(URL).then(function (txt) { // what if this request fails? need contingency
                            var json = JSON.parse(txt); // don't think this will work
                            w.viewer.camera.flyTo({
                                destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, 5.0 + parseFloat(json.results[0].elevation)),
                                orientation: {
                                    heading: Cesium.Math.toRadians(brng),
                                    pitch: Cesium.Math.toRadians(0),
                                    roll: Cesium.Math.toRadians(0)
                                }
                            });
                        });
                    },
                    function (data) {
                    */
                        w.viewer.camera.flyTo({
                            destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, 5.0), // fall back to 1.0? what's the default?
                            orientation: {
                                heading: Cesium.Math.toRadians(brng),
                                pitch: Cesium.Math.toRadians(0),
                                roll: Cesium.Math.toRadians(0)
                            }
                        });
                    //});            
        };

        var w = this, entities, viewer, launchPadViews = {};

        launchPadViews['LC4E'] = {
            destination: Cesium.Cartesian3.fromDegrees(-128.654, 27.955, 772000.0),
            orientation: {
                heading: Cesium.Math.toRadians(67.776),
                pitch: Cesium.Math.toRadians(-36.982),
                roll: Cesium.Math.toRadians(359.873)
            }
        };
        launchPadViews['LC40'] = {
            destination: Cesium.Cartesian3.fromDegrees(-76.162, 19.863, 480000.0),
            orientation: {
                heading: Cesium.Math.toRadians(356.939),
                pitch: Cesium.Math.toRadians(-26.816),
                roll: Cesium.Math.toRadians(359.795)
            }
        };
        launchPadViews['K39A'] = launchPadViews['LC40'];
        launchPadViews['BOCA'] = {
            destination: Cesium.Cartesian3.fromDegrees(-94.706, 15.725, 1108500.0),
            orientation: {
                heading: Cesium.Math.toRadians(355.6),
                pitch: Cesium.Math.toRadians(-43.032),
                roll: Cesium.Math.toRadians(359.8)
            }
        };
        launchPadViews['BOWT'] = {
            destination: Cesium.Cartesian3.fromDegrees(-103.824, 21.348, 450395.0),
            orientation: {
                heading: Cesium.Math.toRadians(357.51),
                pitch: Cesium.Math.toRadians(-21.66),
                roll: Cesium.Math.toRadians(359.93)
            }
        };

    }

    $scope.changeView = function () {

        switch ($scope.queryParams.view[0]) {
            case 'space':
                $location.search('view', 'earth');
                offset = 0;
                break;
            case 'earth':
            default:
                $location.search('view', 'space');
                offset = $scope.COLS.xAbs -$scope.COLS.x;
                break;
        }
        $scope.queryParams = $location.search();
        w.viewer.entities.removeAll();
        $scope.getEventsFile(0, true);

    };

    $scope.openPadViewPointEditDialog = function ($trigger) {

        $mdDialog.show({
            controller: function ($scope, lW, lPadViews, lSite, $mdDialog) {

                $scope.padViews = JSON.parse(JSON.stringify(lPadViews));
                $scope.site = lSite;
                
                $scope.cancel = function () {
                    $mdDialog.cancel();
                };
                $scope.finish = function () {
                    $mdDialog.hide();
                };
                $scope.save = function () {
                    lPadViews.longitude = $scope.padViews.longitude;
                    lPadViews.latitude = $scope.padViews.latitude;
                    lW.setCameraLookingAtCoordinates($scope.padViews.longitude, $scope.padViews.latitude);
                    $mdDialog.hide();
                };
            },
            templateUrl: '/pages/editPadViewPointDlg.tmpl.html',
            parent: angular.element(document.body),
            targetEvent: $trigger,
            clickOutsideToClose: true,
            locals: {
                lParent: $scope,
                lPadViews: $scope.padViews,
                lSite: $scope.launchSite,
                lW: w
            }
        });
    };
    
    $scope.openCesiumCreditsDialog = function ($event) {
        $mdDialog.show({
            controller: function () {
                $scope.hide = function () {
                    $mdDialog.hide();
                };

                $scope.cancel = function () {
                    $mdDialog.cancel();
                };

                $scope.answer = function (answer) {
                    $mdDialog.hide(answer);
                };
            },
            contentElement: '#myDialog',
            parent: angular.element(document.body),
            targetEvent: $event,
            clickOutsideToClose: true
        });
    };    

});
