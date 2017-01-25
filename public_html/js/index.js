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
        $scope.httpRequest('/auth/', 'POST', data, function (data) {
            
            var json = data.data;
            $scope.authorised = json.auth;
            
            json.permissions.split(",").forEach(function(el) {
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
            var vals = keyVal.length===2 ? keyVal[1].split("%20") : "";
            if(vals.length===1)
                paramMap[decodeURIComponent(keyVal[0])] = decodeURIComponent(vals[0] || '');
            else if(vals.length > 1) {
                paramMap[decodeURIComponent(keyVal[0])] = [];
                for (var j = 0; j < vals.length; j++) {
                    paramMap[decodeURIComponent(keyVal[0])].push(decodeURIComponent(vals[j] || ''));
                }
            }
        }
        return paramMap;
    };

    $scope.redirect = function (path) {
        $location.url(path);
    };

    $scope.redirectExternal = function (path) {
        $window.location.href = path;
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
    
    $scope.COLS = {
        time: 0, x: 1, y: 2, z: 3,
        alt: 4, vel: 5, range: 6,
        q: 7, fuel: 8,
        dV_tot: 9, dV_grav: 10, dv_drag: 11,
        throttle: 12, accel: 13,
        aoa: 14, aov: 15, pitch: 16,
        cd: 17,
        xAbs: 18, yAbs: 19, zAbs: 20,
        yaw: 21, c_thrust: 22, incl: 23
    };
    
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