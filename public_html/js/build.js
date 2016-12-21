angular.module('FlightClub').controller('BuildCtrl', function ($scope, $mdDialog, $mdSidenav, $cookies, $interval, $timeout, $location, $mdPanel, $mdMedia) {

    $scope.$parent.toolbarClass = "";
    $scope.$parent.toolbarTitle = "";
    $scope.$emit('viewBroadcast', 'build');

    $scope.missionLoading = true;
    $scope.loadSuccess = false;
    
    $scope.export_icon = 'content_copy';
    $scope.exportStyle = false;
    $scope.import_icon = 'content_paste';
    $scope.importStyle = false;
    
    $scope.save_icon = 'save';
    $scope.saveStyle = false;
    $scope.saving = false;
    $scope.saveSim_icon = 'backup';
    $scope.saveSimStyle = false;
    $scope.savingSim = false;
    $scope.loadingMission = false;
    
    $scope.serverErrorMessage = 'The flightclub.io server has undergone a rapid unscheduled disassembly :/\n'
            + 'You\'ll need to wait until I wake up and see this...\n\n';
    $scope.messageArray = [
        // p is probability of update being skipped until next interval
        { p: 0.7, message: 'Getting data from /r/SpaceX...' },
        { p: 0.5, message: 'Killing Church...' },
        { p: 0.7, message: 'Rebuilding Amos-6...' },
        { p: 0.2, message: 'Turtling FoxhoundBat...' },
        { p: 0.2, message: 'YVAN EHT NIOJ' },
        { p: 0.2, message: 'Impersonating Benjamin Klein...' },
        { p: 0.9, message: '<a href="https://www.patreon.com/flightclub">Click here to support me on Patreon!</a>'},
        { p: 0.6, message: 'Wake up, John...' },
        { p: 0.1, message: 'SUBLIMINAL MESSAGES' },
        { p: 0.8, message: 'In the beginning the Universe was created. This has made a lot of people very angry and been widely regarded as a bad move.' },
        { p: 0.8, message: '☠☠☠ Give it up jiggy make it feel like foreplay / Yo my cardio is infinite / Ha ha / Big willie style\'s all in it / Gettin jiggy wit it / Na na na na na na na nana ☠☠☠'}
    ];
    
    var i = Math.floor(Math.random()*$scope.messageArray.length);
    var roller = $interval(function() {
        $scope.missionLoadingMessage = $scope.messageArray[i].message;
        if (Math.random() > $scope.messageArray[i].p) {
            i = (i+1)%$scope.messageArray.length;
        }
        if(!$scope.missionLoading) {
            $interval.cancel(roller);
        }
    }, 350);
    
    $scope.queryParams = $scope.$parent.parseQueryString(window.location.search.substring(1));
    $scope.runTutorial = $scope.queryParams.runTutorial!==undefined;
    
    $scope.httpRequest('/missions', 'GET', null, function (data) {
        var json = data.data;
        fillMissions(json);
        
        var blankCanvas = false;
        if($location.hash()) {
            var formData = window.atob($location.hash());
            $scope.form = JSON.parse(formData);
            setNewMission($scope.form.Mission.code);
        } else {
            blankCanvas = true;
            $scope.selectMission($scope.past[$scope.past.length-1]);
        }
        
        $scope.loadSuccess = true;
        $scope.missionLoading = false;
        
        if ($scope.runTutorial) {
            $scope.tutorialStep = $scope.queryParams.step !== undefined ? parseInt($scope.queryParams.step) : 0;
            $scope.processTutorial($scope.tutorialStep);
        } else if (blankCanvas && !$cookies.get($scope.$parent.cookies.BLANKCANVASINFO)) {
            $scope.openThemedDialog(
                    'Welcome!',
                    'You have a blank canvas in front of you. To load up a pre-built mission, use the menu in the top-right corner.',
                    'Don\'t show me this again', function () {$cookies.put($scope.$parent.cookies.BLANKCANVASINFO, '1');},
                    'Ok', null
                );
        }
        
    }, function (data, statusText) {
        $scope.missionLoading = false;
        $scope.$parent.toolbarTitle = 'It usually works, I swear';
        $scope.serverErrorMessage += 'Missions: ' + statusText + '\n';
    });
    $scope.httpRequest('/launchsites', 'GET', null, function (data) {
        var json = data.data;
        $scope.launchSites = fill(json);
    }, function(data, statusText) {
        $scope.$parent.toolbarTitle = 'It usually works, I swear';
        $scope.serverErrorMessage += 'LaunchSites: ' + statusText + '\n';
    });
    $scope.httpRequest('/stages?engineDetail=true', 'GET', null, function (data) {
        var json = data.data;
        $scope.stageTypes = fillStages(json);
    }, function(data, statusText) {
        $scope.$parent.toolbarTitle = 'It usually works, I swear';
        $scope.serverErrorMessage += 'Stages: ' + statusText + '\n';
    });
    $scope.httpRequest('/engines', 'GET', null, function (data) {
        var json = data.data;
        $scope.engineTypes = fillStages(json);
    }, function(data, statusText) {
        $scope.$parent.toolbarTitle = 'It usually works, I swear';
        $scope.serverErrorMessage += 'Engines: ' + statusText + '\n';
    });
    $scope.httpRequest('/companies', 'GET', null, function (data) {
        var json = data.data;
        $scope.companies = fill(json);
    }, function(data, statusText) {
        $scope.$parent.toolbarTitle = 'It usually works, I swear';
        $scope.serverErrorMessage += 'Companies: ' + statusText + '\n';
    });

    $scope.gravTurnSelect = [
        {code: 'NONE', name: null},
        {code: 'FORWARD', name: 'Forward'},
        {code: 'REVERSE', name: 'Reverse'}
    ];

    $scope.type = [
        {code: 'IGNITION', name: 'Ignition'},
        {code: 'CUTOFF', name: 'Cutoff'},
        {code: 'GUIDANCE', name: 'Guidance'},
        {code: 'LAUNCH', name: 'Launch'},
        {code: 'SEPARATION', name: 'Stage Separation'},
        {code: 'FAIRING_SEP', name: 'Fairing Separation'},
        {code: 'PAYLOAD_SEP', name: 'Payload Separation'}
    ];

    var fillMissions = function (data) {
        var list = data.data;

        $scope.allMissions = [];
        $scope.upcoming = [];
        $scope.past = [];

        for (var i = list.length; i > 0; i--) {
            var mission = list[i - 1];
            var missionObj = {code: mission.code, name: mission.description, display: mission.display};
            var tempDate = Date.parse(mission.date.replace(/-/g, "/") + ' ' + mission.time + ' UTC');

            $scope.allMissions.push(missionObj);
            if (tempDate > new Date()) {
                $scope.upcoming.push(missionObj);
            } else {
                $scope.past.push(missionObj);
            }
        }

    };

    var fill = function (data) {
        var list = data.data;
        var array = {};
        for (var i = list.length; i > 0; i--) {
            array[list[i - 1].code] = {code: list[i - 1].code, name: list[i - 1].description};
        }
        return array;
    };

    var fillStages = function (data) {
        var list = data.data;
        var array = {};
        for (var i = list.length; i > 0; i--) {
            array[list[i - 1].id] = list[i - 1];
        }
        return array;
    };
    
    $scope.tutorialSteps = [
        {id: 1, num: 0, delay: 0, cont: true, title: 'Flight Club Tutorial', done: 'Yeah! :D'},
        {id: 1, num: 1, delay: 0, cont: false, title: 'Selecting Pre-built Missions', done: 'Ok', el: '.sidenav-open', x: $mdPanel.xPosition.ALIGN_END, y: $mdPanel.yPosition.BELOW},
        {id: 1, num: 2, delay: 1000, cont: true, title: 'Selecting a Launch Site', done: 'Tell me more'},
        {id: 2, num: 2, delay: 0, cont: false, title: 'Selecting a Launch Site', done: 'Ok', el: document.getElementsByTagName('md-tab-item')[0], x: $mdPanel.xPosition.ALIGN_START, y: $mdPanel.yPosition.BELOW},
        {id: 3, num: 2, delay: 350, cont: false, title: 'Selecting a Launch Site', done: 'Ok'},
        {id: 1, num: 3, delay: 1000, cont: true, title: 'Building a Rocket', done: 'Tell me more', el: '.vehicleRadio1', x: $mdPanel.xPosition.ALIGN_START, y: $mdPanel.yPosition.BELOW},
        {id: 2, num: 3, delay: 0, cont: false, title: 'Building a Rocket', done: 'Ok', el: '.vehicleRadio2', x: $mdPanel.xPosition.ALIGN_START, y: $mdPanel.yPosition.BELOW},
        {id: 3, num: 3, delay: 2000, cont: true, title: 'Building a Rocket', done: 'Tell me more', el: '.vehicle1', x: $mdPanel.xPosition.ALIGN_START, y: $mdPanel.yPosition.BELOW},
        {id: 4, num: 3, delay: 1000, cont: true, title: 'Building a Rocket', done: 'Tell me more', el: '.vehicle2', x: $mdPanel.xPosition.ALIGN_START, y: $mdPanel.yPosition.BELOW},
        {id: 5, num: 3, delay: 1000, cont: true, title: 'Building a Rocket', done: 'Tell me more', el: '.vehicle3', x: $mdPanel.xPosition.ALIGN_START, y: $mdPanel.yPosition.BELOW},
        {id: 6, num: 3, delay: 0, cont: false, title: 'Building a Rocket', done: 'Ok'},
        {id: 1, num: 4, delay: 1000, cont: false, title: 'Building a Flight Profile', done: 'Ok', el: '#eventList md-list-item', x: $mdPanel.xPosition.ALIGN_START, y: $mdPanel.yPosition.BELOW},
        {id: 2, num: 4, delay: 2000, cont: true, title: 'Building a Flight Profile', done: 'Tell me more', el: $mdMedia('gt-sm')?'.event1':'.event11', x: $mdMedia('gt-sm')?$mdPanel.xPosition.OFFSET_START:$mdPanel.xPosition.ALIGN_START, y: $mdMedia('gt-sm')?$mdPanel.yPosition.ALIGN_TOPS:$mdPanel.yPosition.BELOW},
        {id: 3, num: 4, delay: 0, cont: true, title: 'Building a Flight Profile', done: 'Tell me more', el: $mdMedia('gt-sm')?'.event1':'.event11', x: $mdMedia('gt-sm')?$mdPanel.xPosition.OFFSET_START:$mdPanel.xPosition.ALIGN_START, y: $mdMedia('gt-sm')?$mdPanel.yPosition.ALIGN_TOPS:$mdPanel.yPosition.BELOW},
        {id: 4, num: 4, delay: 1000, cont: true, title: 'Building a Flight Profile', done: 'Tell me more', el: $mdMedia('gt-sm')?'.event2':'.event21', x: $mdMedia('gt-sm')?$mdPanel.xPosition.OFFSET_START:$mdPanel.xPosition.ALIGN_START, y: $mdMedia('gt-sm')?$mdPanel.yPosition.ALIGN_TOPS:$mdPanel.yPosition.BELOW},
        {id: 5, num: 4, delay: 1000, cont: true, title: 'Building a Flight Profile', done: 'What about Yaw?', el: $mdMedia('gt-sm')?'.event3':'.event31', x: $mdMedia('gt-sm')?$mdPanel.xPosition.OFFSET_START:$mdPanel.xPosition.ALIGN_START, y: $mdMedia('gt-sm')?$mdPanel.yPosition.ALIGN_TOPS:$mdPanel.yPosition.BELOW},
        {id: 6, num: 4, delay: 0, cont: true, title: 'Building a Flight Profile', done: 'And throttle?', el: $mdMedia('gt-sm')?'.event3':'.event31', x: $mdMedia('gt-sm')?$mdPanel.xPosition.OFFSET_START:$mdPanel.xPosition.ALIGN_START, y: $mdMedia('gt-sm')?$mdPanel.yPosition.ALIGN_TOPS:$mdPanel.yPosition.BELOW},
        {id: 7, num: 4, delay: 0, cont: true, title: 'Building a Flight Profile', done: 'What\'s Gravity Turn?', el: $mdMedia('gt-sm')?'.event3':'.event31', x: $mdMedia('gt-sm')?$mdPanel.xPosition.OFFSET_START:$mdPanel.xPosition.ALIGN_START, y: $mdMedia('gt-sm')?$mdPanel.yPosition.ALIGN_TOPS:$mdPanel.yPosition.BELOW},
        {id: 8, num: 4, delay: 0, cont: true, title: 'Building a Flight Profile', done: 'Tell me more', el: $mdMedia('gt-sm')?'.event3':'.event31', x: $mdMedia('gt-sm')?$mdPanel.xPosition.OFFSET_START:$mdPanel.xPosition.ALIGN_START, y: $mdMedia('gt-sm')?$mdPanel.yPosition.ALIGN_TOPS:$mdPanel.yPosition.BELOW},
        {id: 9, num: 4, delay: 1000, cont: true, title: 'Building a Flight Profile', done: 'Keep going', el: $mdMedia('gt-sm')?'.event4':'.event41', x: $mdMedia('gt-sm')?$mdPanel.xPosition.OFFSET_START:$mdPanel.xPosition.ALIGN_START, y: $mdMedia('gt-sm')?$mdPanel.yPosition.ALIGN_TOPS:$mdPanel.yPosition.BELOW},
        {id: 10, num: 4, delay: 0, cont: true, title: 'Building a Flight Profile', done: 'Cool!', el: $mdMedia('gt-sm')?'.event4':'.event41', x: $mdMedia('gt-sm')?$mdPanel.xPosition.OFFSET_START:$mdPanel.xPosition.ALIGN_START, y: $mdMedia('gt-sm')?$mdPanel.yPosition.ALIGN_TOPS:$mdPanel.yPosition.BELOW},
        {id: 1, num: 5, delay: 1000, cont: true, title: 'Flight Club Tutorial', done: 'Woo!'}
    ];
    
    $scope.processTutorial = function (step) {

        if (!$scope.runTutorial || step !== $scope.tutorialStep)
            return;

        if ($scope.tutorialStep < $scope.tutorialSteps.length) {
            var step = $scope.tutorialSteps[$scope.tutorialStep];
            setTimeout(function() {
                $mdPanel.open(getTutorialPane(step.el, step.x, step.y));
            }, step.delay);
        }

    };
    
    $scope.updateUrl = function() {
        if($scope.form) {
            var formAsJSON_string = JSON.stringify($scope.form);

            var formHash = window.btoa(formAsJSON_string);
            $location.hash(formHash);
            return formHash;
        }
    };
    
    $scope.$watch('form', function() {
        $scope.updateUrl();
    }, true);

    $scope.selectMission = function (mission) {
        $scope.selectedMission = mission;
        $scope.loadingMission = true;
        $scope.httpRequest('/missions/' + mission.code, 'GET', null, function (data) {
            $mdSidenav("sidenav").close();
            $scope.loadingMission = false;
            $scope.form = data.data;
            setNewMission(mission.code);
            if ($scope.runTutorial && mission.code === 'IRD1') {
                $scope.processTutorial(2);
            }
        }, null);
    };
    
    var setNewMission = function (code) {
        $scope.sortEvents();
        $scope.$parent.toolbarTitle = $scope.form.Mission.description;
        $scope.selectedEvent = null;
        $scope.builderType = 'previous';
        $scope.selectedVeh = code;
        $scope.recalcDV();
    };

    $scope.selectMissionVehicle = function (code) {
        $scope.httpRequest('/missions/' + code, 'GET', null, function (data) {
            var tempForm = JSON.parse(data.data);
            
            var currentStages = $scope.form.Mission.Vehicle.Stages.length;
            var newStages = tempForm.Mission.Vehicle.Stages.length;
            
            $scope.form.Mission.Vehicle = tempForm.Mission.Vehicle;
            $scope.recalcDV();
            
            if(currentStages > newStages) {
                for (var i = $scope.form.Mission.Events.length - 1; i >= 0; i--) {
                    if($scope.form.Mission.Events[i].stage > newStages-1)
                        $scope.form.Mission.Events.splice(i, 1);
                }
            }
            $scope.$apply();
        }, null);
    };

    $scope.selectSite = function (site) {
        $scope.form.Mission.launchsite = site.code;
        if($scope.runTutorial && site.code === 'BOCA') {
            $scope.processTutorial(4);
        }
        
    };
    $scope.selectEvent = function (event, $eventIndex) {
        $scope.selectedEvent = $scope.selectedEvent === event ? null : event;

        if($scope.runTutorial && $eventIndex===0)
            $scope.processTutorial(12);        
        
    };
    $scope.getStageByNumber = function(numArray) {
        if(!$scope.form || numArray === undefined)
            return null;
        var arr = [];
        for(var k=0;k<numArray.length;k++) {
            var num = numArray[k];
            for (var i = 0; i < $scope.form.Mission.Vehicle.Stages.length; i++) {
                if ($scope.form.Mission.Vehicle.Stages[i].stageNumber === num) {
                    arr.push($scope.form.Mission.Vehicle.Stages[i]);
                    continue;
                }

                for (var j = 0; j < $scope.form.Mission.Vehicle.Stages[i].Boosters.length; j++) {
                    if ($scope.form.Mission.Vehicle.Stages[i].Boosters[j].stageNumber === num) {
                        arr.push($scope.form.Mission.Vehicle.Stages[i].Boosters[j]);
                        continue;
                    }
                }
            }
        }
        return arr.sort(function(a, b){return a.stageNumber-b.stageNumber;});
    };
    
    var resetstageNumbersAndEvents = function() {
                
        var i = 0;
        for(var index=0;index<$scope.form.Mission.Vehicle.Stages.length;index++) {
            
            var obj = $scope.form.Mission.Vehicle.Stages[index];
            obj.stageNumber = i++;
            
            $scope.form.Mission.Vehicle.Stages[index].Boosters.forEach(function (obj) {
                obj.stageNumber = i++;
            });
        }
    };
    
    $scope.removeEntity = function (parentStage, $index) {

        // remove entity by stageNumber
        if(parentStage) {
            parentStage.Boosters.splice($index, 1);
        } else {
            $scope.form.Mission.Vehicle.Stages.splice($index, 1);
        }

        resetstageNumbersAndEvents();
        $scope.recalcDV();
    };
    
    $scope.incrementEntity = function(parentStage) {
        if(parentStage) {
            parentStage.Boosters[parentStage.Boosters.length] = {
                Engines: [],
                Boosters: []
            };
        } else {
            $scope.form.Mission.Vehicle.Stages[$scope.form.Mission.Vehicle.Stages.length] = {
                Engines: [],
                Boosters: []
            };
        }        
        resetstageNumbersAndEvents();
    };
    
    $scope.recalcDV = function() {
        
        var totalDV = 0;
        var stages = $scope.form.Mission.Vehicle.Stages;
        
        for(var i=0;i<stages.length;i++) {
            
            if(stages[i].Engines[0] === undefined)
                continue;
            
            // Use Vac ISP of first engine by default
            var isp = stages[i].Engines[0].Engine.ispVac;
            
            if(i===0 && stages[i].Engines[0].Engine.ispSL!==undefined) {
                // for lower stages, take midpoint of SL and Vac ISP
                isp = 0.5*(stages[i].Engines[0].Engine.ispSL+stages[i].Engines[0].Engine.ispVac);
            } else if (stages[i].Engines.length>1) {
                // for upper stages, specifically look for Vac engines and use them
                for(var e=0;e<stages[i].Engines.length;e++) {
                    if(stages[i].Engines[e].Engine.ispSL === null) {
                        isp = stages[i].Engines[e].Engine.ispVac;
                        break;
                    }
                }
            }
            
            var aboveMass = 0;
            for(var j=i+1;j<stages.length;j++) {
                aboveMass += stages[j].dryMass + stages[j].propMass;
                for (var k = 0; k < stages[j].Boosters.length; k++) {
                    aboveMass += stages[j].Boosters[k].dryMass + stages[j].Boosters[k].propMass;
                }
                if (stages[j].fairingMass)
                    aboveMass += stages[j].fairingMass;
            }
            aboveMass += parseFloat($scope.form.Mission.Payload.mass);
            
            var m0 = aboveMass + stages[i].dryMass + stages[i].propMass;
            var m1 = aboveMass + stages[i].dryMass;
            for (var j = 0; j < stages[i].Boosters.length; j++) {
                m0 += stages[i].Boosters[j].dryMass + stages[i].Boosters[j].propMass;
                m1 += stages[i].Boosters[j].dryMass;
            }
            var mf = m0 / m1;
            
            totalDV += 9.81*isp*Math.log(mf);
        }
        $scope.payloadDV = (totalDV/1000.0).toPrecision(3);
    };
    
    $scope.addEvent = function () {
        var newEvent = {
            type: null,
            stage: null,
            name: null,
            time: null,
            dynamic: null,
            Attitude: {
                pitch: null,
                yaw: null,
                gt: null,
                throttle: null
            },
            Engines: []
        };
        $scope.form.Mission.Events.push(newEvent);
        $scope.sortEvents();
        $scope.selectedEvent = newEvent;
    };
    $scope.removeEvent = function (index) {
        if($scope.selectedEvent === $scope.form.Mission.Events[index])
            $scope.selectedEvent = null;
        $scope.form.Mission.Events.splice(index, 1);
    };

    $scope.sortEvents = function () {
        $scope.form.Mission.Events.sort(function (a, b) {
            if(a.time === null || a.time === undefined)
                return 1;
            if(b.time === null || b.time === undefined)
                return -1;
            return parseFloat(a.time) - parseFloat(b.time);
        });
    };
    
    $scope.export = function (ev) {       
        
        $scope.form.auth = {token: $scope.$parent.token};
        var formAsJSON_string = JSON.stringify($scope.form);
        $scope.form.auth = {token: null};
        var formHash = window.btoa(formAsJSON_string);
       
        
        $scope.exportStyle = true;
        if($scope.supports_html5_storage()) {
            window['localStorage']['fc_profile'] = formHash;
            $scope.exportStatusColor = '#82CA9D';
            $scope.export_icon = 'check';
            $timeout(function() {
                $scope.export_icon = 'content_copy';
                $scope.exportStyle = false;
            }, 4000);
        } else {
            $scope.exportStatusColor = '#F7977A';
            $scope.export_icon = 'close';
            $timeout(function() {
                $scope.export_icon = 'content_copy';
                $scope.exportStyle = false;
            }, 4000);
            $scope.openThemedDialog(
                    'Not supported!',
                    'Your browser doesn\'t support local storage! Upgrade, fool!',
                    undefined,
                    undefined,
                    'Ok :(',
                    undefined
                );
        }
    };
    
    $scope.import = function (ev) {
        
        $scope.importStyle = true;
        if($scope.supports_html5_storage()) {
            var formHash = window['localStorage']['fc_profile'];
            try {
                var formData = window.atob(formHash);
                $scope.form = JSON.parse(formData);
                setNewMission($scope.form.Mission.code);
                $scope.importStatusColor = '#82CA9D';
                $scope.import_icon = 'check';
                $timeout(function () {
                    $scope.import_icon = 'content_paste';
                    $scope.importStyle = false;
                }, 4000);
            } catch (err) {
                $scope.importStatusColor = '#F7977A';
                $scope.import_icon = 'close';
                $timeout(function () {
                    $scope.import_icon = 'content_paste';
                    $scope.importStyle = false;
                }, 4000);
            $scope.openThemedDialog(
                    'Import error!',
                    err.stack.replace('\n', '<br>'),
                    undefined,
                    undefined,
                    'Ok :(',
                    undefined
                );
            }
        } else {
            $scope.importStatusColor = '#F7977A';
            $scope.import_icon = 'close';
            $timeout(function () {
                $scope.import_icon = 'content_paste';
                $scope.importStyle = false;
            }, 4000);
            $scope.openThemedDialog(
                    'Not supported!',
                    'Your browser doesn\'t support local storage! Upgrade, fool!',
                    undefined,
                    undefined,
                    'Ok :(',
                    undefined
                );
        }

    };
    
    var validateEventswithStages = function() {
        
        var returnObj = {
            isValid: true,
            invalidEvents: [],
            unusedStages: []
        };
        
        var stagesReferencedInEvents = [];
        var maxStageNumber = -1;
        $scope.form.Mission.Vehicle.Stages.forEach(function(stage) {
            maxStageNumber++;
            stage.Boosters.forEach(function() {maxStageNumber++;});
        });
        
        // check for events that reference non-existent stages
        $scope.form.Mission.Events.forEach(function(event) {
            if(event.stageNumbers === undefined)
                returnObj.invalidEvents.push(event);
            else {
                for(var i=0;i<event.stageNumbers.length;i++) {
                    stagesReferencedInEvents.push(event.stageNumbers[i]);
                    if(event.stageNumbers[i] > maxStageNumber)
                        returnObj.invalidEvents.push(event);
                }
            }
        });
        
        // check for stages that have no attached events
        $scope.form.Mission.Vehicle.Stages.forEach(function(stage) {
           if(stagesReferencedInEvents.indexOf(stage.stageNumber)===-1)
               returnObj.unusedStages.push(stage);
            stage.Boosters.forEach(function(booster) {
                if (stagesReferencedInEvents.indexOf(booster.stageNumber)===-1)
                    returnObj.unusedStages.push(booster);
            });
        });
        
        returnObj.isValid = returnObj.invalidEvents.length===0 && returnObj.unusedStages.length===0;
        return returnObj;
    };

    $scope.submit = function () {
        
        var validation = validateEventswithStages();
        if(!validation.isValid) {
            
            var stageList = '<ul>';
            validation.unusedStages.forEach(function(stage) {
                stageList += '<li>'+stage.stageName + '</li>';
            });
            stageList += '</ul>';
            
            var eventList = '<ul>';
            validation.invalidEvents.forEach(function(event) {
                eventList += '<li>'+event.name + '</li>';
            });
            eventList += '</ul>';
            
            $scope.openThemedDialog(
                    'Warning! Possible invalid profile',
                    (validation.unusedStages.length===0?'':('There were no events assigned to the following stages:'+stageList))
                        +(validation.invalidEvents.length===0?'':('The following events don\'t reference a valid stage:'+eventList))
                        +'Do you want to continue? Simulation may fail.',
                    'Go back',
                    undefined,
                    'Ok',
                    processSubmit
                );
        } else {
            processSubmit();
        }
    };
    
    var processSubmit = function() {
        
        $scope.form.auth = {token: $scope.$parent.token};
        var formHash = $scope.updateUrl();
        $scope.form.auth = {token: null};
        
        var simCount = parseInt($cookies.get($scope.$parent.cookies.SIMCOUNT));
        $cookies.put($scope.$parent.cookies.SIMCOUNT, simCount ? simCount+1 : 1);
        
        window.open($scope.$parent.client + '/results/#' + formHash, '_blank');
    };

    $scope.save = function (event)
    {
        $scope.httpRequest('/missions/' + $scope.form.Mission.code, 'GET', null,
                function (data) {
                    var exists = false;
                    if (data.data.error === undefined)
                        exists = true;
                    $scope.form.auth = {token: $scope.$parent.token};
                    var formAsJSON_string = JSON.stringify($scope.form);
                    if (exists) {
                        $scope.openThemedDialog(
                                'Update ' + $scope.form.Mission.code,
                                'This will update ' + $scope.form.Mission.description,
                                'Cancel', null,
                                'Ok', function () {
                                    $scope.saving = true;
                                    $scope.httpRequest('/missions/' + $scope.form.Mission.code, 'PUT', formAsJSON_string, saveSuccess, saveError);
                                }
                        );
                    } else {
                        $scope.openThemedDialog(
                                $scope.form.Mission.code + " doesn't exist yet",
                                "This will create a new mission called '" + $scope.form.Mission.description + "'",
                                'Cancel', null,
                                'Ok', function () {
                                    $scope.saving = true;
                                    $scope.httpRequest('/missions/', 'POST', formAsJSON_string, saveSuccess, saveError);
                                }
                        );
                    }
                }, null);

    };

    var saveSuccess = function () {
        $scope.saving = false;
        $scope.saveStatusColor = '#82CA9D';
        $scope.save_icon = 'check';
        $scope.saveStyle = true;
        $scope.$apply();
        $timeout(function () {
            $scope.save_icon = 'save';
            $scope.saveStyle = false;
        }, 4000);
    };

    var saveError = function () {
        $scope.saving = false;
        $scope.saveStatusColor = '#F7977A';
        $scope.save_icon = 'close';
        $scope.saveStyle = true;
        $scope.$apply();
        $timeout(function () {
            $scope.save_icon = 'save';
            $scope.saveStyle = false;
        }, 4000);
    };
    
    $scope.saveSim = function(event) 
    {
        var confirm = $mdDialog.prompt()
                .title('Save Simulation')
                .textContent('Add a personal note to the simulation to help you remember!')
                .placeholder('User Note')
                .ariaLabel('User Note')
                .targetEvent(event)
                .ok('Ok')
                .cancel('Cancel');

        $mdDialog.show(confirm).then(function (result) {
            saveSimProcess(result);
        });
    };

    var saveSimProcess = function (note)
    {        
        var data = {
            simHash: $location.hash(),
            usernote: note,
            auth: {
                token: $scope.$parent.token
            }
        };
        $scope.savingSim = true;
        $scope.httpRequest('/user/saveSim', 'POST', JSON.stringify(data),
                function () {
                    $scope.savingSim = false;
                    $scope.saveSimStatusColor = '#82CA9D';
                    $scope.saveSim_icon = 'check';
                    $scope.saveSimStyle = true;
                    $scope.$apply();
                    $timeout(function () {
                        $scope.saveSim_icon = 'backup';
                        $scope.saveSimStyle = false;
                    }, 4000);
                }, function () {
                    $scope.savingSim = false;
                    $scope.saveSimStatusColor = '#F7977A';
                    $scope.saveSim_icon = 'close';
                    $scope.saveSimStyle = true;
                    $scope.$apply();
                    $timeout(function () {
                        $scope.saveSim_icon = 'backup';
                        $scope.saveSimStyle = false;
                    }, 4000);
                }
            );
    };
    
    var getTutorialPane = function(element, x, y) {
        
        var position = element === undefined ? 
                $mdPanel.newPanelPosition()
                    .absolute()
                    .top($mdMedia('xs')?'10%':'25%')
                    .left($mdMedia('xs')?'10%':'25%') :
                $mdPanel.newPanelPosition()
                    .relativeTo(element)
                    .addPanelPosition(x, y);

        var config = {
            attachTo: angular.element(document.body),
            controller: function (mdPanelRef, $scope, lTheme, lSteps, lStepId, lParentScope) {
                $scope.steps = lSteps;
                $scope.step = $scope.steps[lStepId];
                $scope.getOtherTheme = function () {
                    return lTheme === 'fc_dark' ? 'fc_default' : 'fc_dark';
                };
                $scope.quit = function () {
                    lParentScope.runTutorial = false;
                    mdPanelRef.close();
                };
                $scope.next = function () {
                    mdPanelRef.close();
                    lParentScope.tutorialStep++;
                    if($scope.step.cont) {
                        lParentScope.processTutorial(lParentScope.tutorialStep);
                    }
                };
            },
            templateUrl: '/pages/tutorial.tmpl.html',
            panelClass: 'dialog-panel',
            position: position,
            clickOutsideToClose: true,
            locals: {
                lTheme: $scope.$parent.theme,
                lSteps: $scope.tutorialSteps,
                lStepId: $scope.tutorialStep,
                lParentScope: $scope
            }
        };
        return config;
    };

    $scope.openStageEditDialog = function ($event, $stageIndex, stage) {

        $mdDialog.show({
            controller: function ($scope, lParent, lForm, lStage, $mdDialog) {

                $scope.parentScope = lParent;

                $scope.selectedStage = JSON.parse(JSON.stringify(lStage));
                $scope.tempEvents = JSON.parse(JSON.stringify(lForm.Mission.Events));
                $scope.stageTypes = $scope.parentScope.stageTypes;
                $scope.engineTypes = $scope.parentScope.engineTypes;

                $scope.selectStageType = function (newStage) {
                    
                    newStage.Engines = $scope.selectedStage.Engines;
                    newStage.Boosters = $scope.selectedStage.Boosters;
                    $scope.selectedStage = JSON.parse(JSON.stringify(newStage));
                    $scope.selectedStage.stageName = newStage.name;
                    
                };
                $scope.removeEngine = function ($index) {
                    
                    $scope.selectedStage.Engines.splice($index, 1);
                    $scope.selectedStage.Engines.forEach(function (obj, i) {
                        obj.engineId = i;
                    });
                    $scope.tempEvents.forEach(function(event) {
                        
                        if(event.stage === $scope.selectedStage.stageNumber) {
                            for (var i = event.Engines.length - 1; i >= 0; i--) {
                                if(event.Engines[i].engineId === $index) {
                                    event.Engines.splice(event.Engines[i], 1);
                                } else if (event.Engines[i].engineId > $index) {
                                    event.Engines[i].engineId--;
                                }
                            }
                        }
                    });
                    $scope.parentScope.recalcDV();

                };
                $scope.incrementEngines = function ($event) {
                    $scope.selectedStage.Engines.push({
                        engineId: $scope.selectedStage.Engines.length
                    });
                    
                    $scope.openEngineEditDialog($event, $scope.selectedStage.Engines.length-1, $scope.selectedStage.Engines[$scope.selectedStage.Engines.length-1]);
                };

                $scope.openEngineEditDialog = function ($event, $engineIndex, engineConfig) {

                    var obj = {
                        controller: function ($scope, lEngineTypes, lEngineConfig, $mdDialog, lStage) {

                            $scope.selectedEngineConfig = JSON.parse(JSON.stringify(lEngineConfig));
                            $scope.engineTypes = lEngineTypes;
                            $scope.stage = lStage;

                            $scope.selectEngineType = function (newEngine) {
                                $scope.selectedEngineConfig.Engine = newEngine;
                            };
                            $scope.cancel = function () {
                                $mdDialog.cancel();
                            };
                            $scope.finish = function () {
                                $mdDialog.hide();
                            };
                            $scope.save = function () {
                                $scope.stage.Engines[$engineIndex] = $scope.selectedEngineConfig;
                                $mdDialog.hide();
                            };
                        },
                        templateUrl: '/pages/editEngine.tmpl.html',
                        parent: angular.element(document.body),
                        targetEvent: $event,
                        clickOutsideToClose: true,
                        //preserveScope: true,
                        autoWrap: true,
                        skipHide: true,
                        locals: {
                            lStage: $scope.selectedStage,
                            lEngineTypes: $scope.engineTypes,
                            lEngineConfig: engineConfig
                        }
                    };
                    $mdDialog.show(obj);
                };
                $scope.cancel = function () {
                    $mdDialog.cancel();
                };
                $scope.finish = function () {
                    $mdDialog.hide();
                };
                $scope.save = function () {                    
                    lForm.Mission.Vehicle.Stages[$stageIndex] = $scope.selectedStage;
                    lForm.Mission.Events = $scope.tempEvents;
                    resetstageNumbersAndEvents();
                    lParent.recalcDV();
                    $mdDialog.hide();
                };
            },
            templateUrl: '/pages/editStage.tmpl.html',
            parent: angular.element(document.body),
            targetEvent: $event,
            clickOutsideToClose: true,
            locals: {
                lParent: $scope,
                lForm: $scope.form,
                lStage: stage
            }
        });
        
        if($scope.runTutorial && $stageIndex===0)
            $scope.processTutorial(7);
    };

    $scope.openBoosterEditDialog = function ($event, stage, $boosterIndex, booster) {

        $mdDialog.show({
            controller: function ($scope, lParent, lForm, lStage, lBooster, $mdDialog) {

                $scope.parentScope = lParent;

                $scope.selectedStage = JSON.parse(JSON.stringify(lBooster));
                $scope.tempEvents = JSON.parse(JSON.stringify(lForm.Mission.Events));
                $scope.stageTypes = $scope.parentScope.stageTypes;
                $scope.engineTypes = $scope.parentScope.engineTypes;

                $scope.selectStageType = function (newStage) {
                    
                    newStage.Engines = $scope.selectedStage.Engines;
                    newStage.Boosters = $scope.selectedStage.Boosters;
                    $scope.selectedStage = JSON.parse(JSON.stringify(newStage));
                    $scope.selectedStage.stageName = newStage.name;
                    
                };
                $scope.removeEngine = function ($index) {
                    
                    $scope.selectedStage.Engines.splice($index, 1);
                    $scope.selectedStage.Engines.forEach(function (obj, i) {
                        obj.engineId = i;
                    });
                    $scope.tempEvents.forEach(function(event) {
                        
                        if(event.stage === $scope.selectedStage.stageNumber) {
                            for (var i = event.Engines.length - 1; i >= 0; i--) {
                                if(event.Engines[i].engineId === $index) {
                                    event.Engines.splice(event.Engines[i], 1);
                                } else if (event.Engines[i].engineId > $index) {
                                    event.Engines[i].engineId--;
                                }
                            }
                        }
                    });
                    $scope.parentScope.recalcDV();

                };
                $scope.incrementEngines = function ($event) {
                    $scope.selectedStage.Engines.push({
                        engineId: $scope.selectedStage.Engines.length
                    });

                    $scope.openEngineEditDialog($event, $scope.selectedStage.Engines.length-1, $scope.selectedStage.Engines[$scope.selectedStage.Engines.length-1]);
                };

                $scope.openEngineEditDialog = function ($event, $engineIndex, engineConfig) {

                    var obj = {
                        controller: function ($scope, lEngineTypes, lEngineConfig, $mdDialog, lStage) {

                            $scope.selectedEngineConfig = JSON.parse(JSON.stringify(lEngineConfig));
                            $scope.engineTypes = lEngineTypes;
                            $scope.stage = lStage;

                            $scope.selectEngineType = function (newEngine) {
                                $scope.selectedEngineConfig.Engine = newEngine;
                            };
                            $scope.cancel = function () {
                                $mdDialog.cancel();
                            };
                            $scope.finish = function () {
                                $mdDialog.hide();
                            };
                            $scope.save = function () {
                                $scope.stage.Engines[$engineIndex] = $scope.selectedEngineConfig;
                                $mdDialog.hide();
                            };
                        },
                        templateUrl: '/pages/editEngine.tmpl.html',
                        parent: angular.element(document.body),
                        targetEvent: $event,
                        clickOutsideToClose: true,
                        //preserveScope: true,
                        autoWrap: true,
                        skipHide: true,
                        locals: {
                            lStage: $scope.selectedStage,
                            lEngineTypes: $scope.engineTypes,
                            lEngineConfig: engineConfig
                        }
                    };
                    $mdDialog.show(obj);
                };
                $scope.cancel = function () {
                    $mdDialog.cancel();
                };
                $scope.finish = function () {
                    $mdDialog.hide();
                };
                $scope.save = function () {
                    lStage.Boosters[$boosterIndex] = $scope.selectedStage;
                    lForm.Mission.Events = $scope.tempEvents;
                    resetstageNumbersAndEvents();
                    lParent.recalcDV();
                    $mdDialog.hide();
                };
            },
            templateUrl: '/pages/editStage.tmpl.html',
            parent: angular.element(document.body),
            targetEvent: $event,
            clickOutsideToClose: true,
            locals: {
                lParent: $scope,
                lForm: $scope.form,
                lBooster: booster,
                lStage: stage
            }
        });
    };

    $scope.openEventEditDialog = function ($trigger, $eventIndex, event) {

        $mdDialog.show({
            controller: function ($scope, lParent, lForm, lEvent, $mdDialog) {

                $scope.parentScope = lParent;
                $scope.selectedEvent = JSON.parse(JSON.stringify(lEvent));
                $scope.type = $scope.parentScope.type;
                $scope.stages = $scope.parentScope.form.Mission.Vehicle.Stages;
                $scope.stageEngines = $scope.parentScope.form.Mission.Vehicle.Stages[$scope.selectedEvent.stageNumbers[0]].Engines;
                $scope.gravTurnSelect = $scope.parentScope.gravTurnSelect;
                
                $scope.cancel = function () {
                    $mdDialog.cancel();
                };
                $scope.finish = function () {
                    $mdDialog.hide();
                };
                $scope.save = function () {
                    lForm.Mission.Events[$eventIndex] = $scope.selectedEvent;
                    lParent.recalcDV();
                    $mdDialog.hide();
                };
            },
            templateUrl: '/pages/editEvent.tmpl.html',
            parent: angular.element(document.body),
            targetEvent: $trigger,
            clickOutsideToClose: true,
            locals: {
                lParent: $scope,
                lForm: $scope.form,
                lEvent: event
            }
        });
        
        if($scope.runTutorial && $eventIndex===0)
            $scope.processTutorial(12);
    };

    $scope.openAdminEditDialog = function ($trigger) {

        $mdDialog.show({
            controller: function ($scope, lParent, lForm, $mdDialog) {

                $scope.parentScope = JSON.parse(JSON.stringify(lParent));
                $scope.companies = lParent.companies;
                
                // offset stuff necessary if client is not UTC. Date() returns time in local TZ >:|
                var today = new Date();
                var offset = -(today.getTimezoneOffset()/60);
                var tempDate = new Date($scope.parentScope.form.Mission.date);
                $scope.parentScope.form.Mission.date = new Date(tempDate.getTime() - offset*60*60*1000);
                
                Date.prototype.yyyymmdd = function () {
                    var mm = this.getMonth() + 1; // getMonth() is zero-based
                    var dd = this.getDate();

                    return [this.getFullYear(),
                        (mm > 9 ? '' : '0') + mm,
                        (dd > 9 ? '' : '0') + dd
                    ].join('-');
                };
                
                $scope.cancel = function () {
                    $mdDialog.cancel();
                };
                $scope.finish = function () {
                    $mdDialog.hide();
                };
                $scope.save = function () {
                    lForm.Mission.code = $scope.parentScope.form.Mission.code;
                    lForm.Mission.description = $scope.parentScope.form.Mission.description;
                    lForm.Mission.date = $scope.parentScope.form.Mission.date.yyyymmdd();
                    lForm.Mission.time = $scope.parentScope.form.Mission.time;
                    lForm.Mission.company = $scope.parentScope.form.Mission.company;
                    lForm.Mission.orbits = $scope.parentScope.form.Mission.orbits;
                    lForm.Mission.display = $scope.parentScope.form.Mission.display;
                    $mdDialog.hide();
                };
            },
            templateUrl: '/pages/editAdmin.tmpl.html',
            parent: angular.element(document.body),
            targetEvent: $trigger,
            clickOutsideToClose: true,
            locals: {
                lParent: $scope,
                lForm: $scope.form
            }
        });
    };

});