angular.module('FlightClub').controller('IndexCtrl', function ($http, $scope, $mdSidenav, $cookies, $location, $window, $interval, $mdMedia, $mdPanel) {
    
    var base, port;
    if($location.host() === 'localhost') {
        base= 'http://localhost';
        port = ':8080';
    }
    // redirect flightclub.io to www.flightclub.io programmatically (using .htaccess for this breaks angular router)
    else if($location.host().indexOf("www") === -1) {
        $window.location.href = $location.absUrl().split('flightclub.io').join('www.flightclub.io');
    } 
    else {
        base = '//www.flightclub.io';
        port = ':8443';
    }
    $scope.client = base;
    $scope.server = base + port + '/FlightClub';
    var api_url = $scope.server + '/api/v1';
    
    $scope.cookies = {
        AUTHTOKEN: 'fc_authToken',
        BLANKCANVASINFO: 'fc_bcInfo',
        SIMCOUNT: 'fc_simCount',
        THEME: 'fc_theme'
    };

    $scope.token = $cookies.get($scope.cookies.AUTHTOKEN);
    $scope.authorised = false;
    $scope.permissions = [];
    $scope.canCreateUser = false;
    
    $scope.showSidenav = true;
    $scope.sidenav_button = "more_vert";
    $scope.$on('viewBroadcast', function(event, args) {
        $scope.showSidenav = (args === 'build' || args === 'results' || args === 'world');
    });

    $scope.httpRequest = function (dest, method, data, successfn, errorfn) {
        $http({
            method: method,
            url: api_url + dest,
            data: data,
            withCredentials: false,
            headers: {}
        }).then(successfn, errorfn);
    };

    if ($scope.token !== undefined) {
        var data = JSON.stringify({auth: {token: $scope.token}});
        $scope.httpRequest('/user/auth/', 'POST', data, function (response) {
            
            var json = response.data;
            $scope.authorised = json.data[0].auth;
            
            json.data[0].permissions.split(",").forEach(function(el) {
                $scope.permissions.push(el.toLowerCase());
            });
            $scope.canCreateUser = $scope.hasPermission('createUser');
            
            if (!$scope.authorised) {
                $cookies.remove($scope.cookies.AUTHTOKEN);
            }
        });
    }

    var themer = $interval(function() {
        if ($scope.theme)
            $interval.cancel(themer);
        else {
            $scope.theme = $cookies.get($scope.cookies.THEME);
            if($scope.theme === undefined)
                $scope.theme = 'fc_dark';
        }
    }, 100);        

    $scope.parseQueryString = function (queryString)
    {
        var keyVals = queryString.split("&");
        var paramMap = {};
        for (var i = 0; i < keyVals.length; i++) {
            var keyVal = keyVals[i].split("=");
            var vals = keyVal.length === 2 ? keyVal[1].split("%20") : "";
            
            paramMap[decodeURIComponent(keyVal[0])] = [];
            for (var j = 0; j < vals.length; j++) {
                paramMap[decodeURIComponent(keyVal[0])].push(decodeURIComponent(vals[j] || ''));
            }
        }
        return paramMap;
    };

    $scope.redirect = function (path) {
        $location.url(path);
    };

    $scope.toggleNav = function (id) {
        $mdSidenav(id).toggle();
        // this doesn't trigger when sidenav closed by clicking outside!
        $scope.sidenav_button = $mdSidenav("sidenav").isOpen() ? "chevron_right" : "more_vert";
    };
    
    $scope.hasPermission = function(toCheck) {
        var ret = false;
        toCheck = toCheck.toLowerCase();
        $scope.permissions.forEach(function(p) {
            if(p === "all" || p === toCheck)
                ret = true;
        });
        return ret;
    };
    
    $scope.toggleTheme = function() {
        $scope.theme = $scope.theme === 'fc_dark' ? 'fc_default' : 'fc_dark';
        $cookies.put($scope.cookies.THEME, $scope.theme);
    };
    
    $scope.supports_html5_storage = function() {
        try {
            return 'localStorage' in window && window['localStorage'] !== null;
        } catch (e) {
            return false;
        }
    };
    
    $scope.openThemedDialog = function(title, text, quitText, quit, okText, ok) {
            
        var position = $mdPanel.newPanelPosition().absolute()
                .top($mdMedia('xs') ? '10%' : '25%').left($mdMedia('xs') ? '10%' : '25%');

        var config = {
            attachTo: angular.element(document.body),
            controller: function (mdPanelRef, $scope, lTheme, lTitle, lText, lQuitText, lQuit, lOkText, lOk) {
                $scope.title = lTitle;
                $scope.text = lText;
                $scope.okText = lOkText;
                $scope.quitText = lQuitText;
                $scope.getOtherTheme = function () {
                    return lTheme === 'fc_dark' ? 'fc_default' : 'fc_dark';
                };
                $scope.quit = function () {
                    if (lQuit)
                        lQuit();
                    mdPanelRef.close();
                };
                $scope.ok = function () {
                    if (lOk)
                        lOk();
                    mdPanelRef.close();
                };
            },
            templateUrl: '/pages/themedDlg.tmpl.html',
            panelClass: 'dialog-panel',
            position: position,
            clickOutsideToClose: false,
            hasBackdrop: true,
            locals: {
                lTheme: $scope.theme,
                lTitle: title,
                lText: text,
                lQuitText: quitText,
                lQuit: quit,
                lOkText: okText,
                lOk: ok
            }
        };
        $mdPanel.open(config);
    };
    
    $scope.COLS = [
        { i: 0, display: true, label: "Time (s)"
        },
        { i: 1, display: false, label: "x (km)"
        },
        { i: 2, display: false, label: "y (km)"
        },
        { i: 3, display: false, label: "z (km)"
        },
        { i: 4, display: true, label: "Altitude (km)"
        },
        { i: 5, display: true, label: "Velocity (m/s)"
        },
        { i: 6, display: true, label: "Downrange (km)"
        },
        { i: 7, display: true, label: "Aerodynamic Pressure (Q) (kN/m^2)"
        },
        { i: 8, display: true, label: "Propellant Mass (t)"
        },
        { i: 9, display: true, label: "Total deltaV (m/s)"
        },
        { i: 10, display: false, label: "Gravity losses (m/s)"
        },
        { i: 11, display: false, label: "Drag losses (m/s)"
        },
        { i: 12, display: true, label: "Throttle"
        },
        { i: 13, display: true, label: "Acceleration (g)"
        },
        { i: 14, display: true, label: "Angle of Attack (°)"
        },
        { i: 15, display: true, label: "Velocity Angle (° rel. to surface)"
        },
        { i: 16, display: true, label: "Pitch Angle (°)"
        },
        { i: 17, display: true, label: "Drag Coefficient"
        },
        { i: 18, display: false, label: "xAbs (km)"
        },
        { i: 19, display: false, label: "yAbs (km)"
        },
        { i: 20, display: false, label: "zAbs (km)"
        },
        { i: 21, display: true, label: "Heading (° cc from East)"
        },
        { i: 22, display: true, label: "Thrust Coefficient"
        },
        { i: 23, display: true, label: "Inclination (°)"
        }
    ];
    
    // implementation of jQuery $.getScript
    $scope.getScript = function(source, callback) {
        var script = document.createElement('script');
        var prior = document.getElementsByTagName('script')[0];
        script.async = 1;
        prior.parentNode.insertBefore(script, prior);

        script.onload = script.onreadystatechange = function (_, isAbort) {
            if (isAbort || !script.readyState || /loaded|complete/.test(script.readyState)) {
                script.onload = script.onreadystatechange = null;
                script = undefined;

                if (!isAbort) {
                    if (callback)
                        callback();
                }
            }
        };

        script.src = source;
    };
    
    $scope.serialize = function (obj) {
        return Object.keys(obj).reduce(function (a, k) {
            a.push(encodeURIComponent(k) + '=' + encodeURIComponent(obj[k]));
            return a;
        }, []).join('&');
    };
    
    $scope.getGEOPatronList = function() {
        return '<li>TMRO</li>'
                + '<li>Burt Paulie</li>'
        ;
    };
});