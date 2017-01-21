angular.module('FlightClub').controller('AccountCtrl', function ($timeout, $document, $scope, $cookies) {

    $scope.$emit('viewBroadcast', 'login');
    $scope.$parent.toolbarTitle = 'Flight Club | Account';
    $scope.$parent.toolbarClass = "";
    $scope.savedSims = [];

    $scope.forms = [];
    // hack to fix password label not detecting input on Chrome 
    // https://github.com/angular/material/issues/1376
    $timeout(function () {
        var elem = angular.element($document[0].querySelector('input[type=password]:-webkit-autofill'));
        if (elem.length) {
            elem.parent().addClass('md-input-has-value');
        }
    }, 150);
    
    $scope.httpRequest('/user/permissions', 'GET', null, function (data) {
        var json = data.data;
        $scope.permissions = {};
        for (var i = json.length; i > 0; i--) {
            $scope.permissions[json[i - 1].code] = {code: json[i - 1].code, name: json[i - 1].name};
        }
    });
    
    $scope.capitalise = function(string) {
        return string === undefined ? undefined : string.charAt(0).toUpperCase() + string.slice(1);
    };

    $scope.alerts = [];
    $scope.loginToggle = function () {
        if (!$scope.$parent.authorised) {
            
            var data = JSON.stringify($scope.forms[0]);
            $scope.$parent.httpRequest('/user/login', 'POST', data, function (data) {
                var json = data.data;
                if (json.Success) {
                    var now = new Date();
                    var expiryDate = new Date(now.getTime() + 1000 * parseInt(json.Success.maxAge));

                    $cookies.put($scope.$parent.cookies.AUTHTOKEN, json.Success.authToken, {'expires': expiryDate});
                    $scope.$parent.token = json.Success.authToken;
                    $scope.$parent.authorised = true;
            
                    $scope.$parent.permissions.length = 0;
                    json.Success.permissions.split(",").forEach(function (el) {
                        $scope.$parent.permissions.push(el.toLowerCase());
                    });
                    
                    $scope.alerts[0] = "Successfully logged in!";
            
                } else {
                    $scope.alerts[0] = data.error;
                }
                $scope.forms[0] = {};
            }, function (data) {
                var json = data.data;
                if(json)
                    $scope.alerts[0] = json.error;
                else
                    $scope.alerts[0] = data.status + " " + data.statusText;
            });
    
        } else {
            $cookies.remove($scope.$parent.cookies.AUTHTOKEN);
            $scope.$parent.authorised = false;
            $scope.$parent.permissions.length = 0;
            $scope.$parent.token = undefined;
            $scope.alerts[0] = "Successfully logged out!";
        }
    };
    
    $scope.updatePassword = function () {
        $scope.forms[1].auth = {token: $scope.$parent.token};
        var data = JSON.stringify($scope.forms[1]);
        $scope.forms[1].auth = {token: ''};
        $scope.$parent.httpRequest('/user/updatePass', 'POST', data, function (data) {
            var json = data.data;
            if (json.Success) {
                $scope.alerts[1] = 'Password updated successfully!';
            } else {
                $scope.alerts[1] = data.error;
            }
            $scope.forms[1] = {};
        }, function (data) {
            var json = data.data;
            if(json)
                $scope.alerts[1] = 'Error sending request\n'+json.error;
            else
                $scope.alerts[1] = data.status + " " + data.statusText;
        });
    };
    
    $scope.create = function () {
        $scope.forms[2].auth = {token: $scope.$parent.token};
        var data = JSON.stringify($scope.forms[2]);
        $scope.forms[2].auth = {token: ''};
        $scope.$parent.httpRequest('/user/new', 'POST', data, function (data) {
            var json = data.data;
            if (json.Success) {
                $scope.alerts[2] = 'User \"' + $scope.forms[2].Create.new.username + '\" created successfully!';
            } else {
                $scope.alerts[2] = json.error;
            }
            $scope.forms[2] = {};
        }, function (data) {
            var json = data.data;
            if(json)
                $scope.alerts[2] = 'Error sending request\n'+json.error;
            else
                $scope.alerts[2] = data.status + " " + data.statusText;
        });
    };
    
    $scope.reloadSavedSims = function () {
        $scope.$parent.httpRequest('/user/savedSims', 'POST', JSON.stringify({auth: {token: $scope.$parent.token}}),
                function (data) {
                    var json = data.data;
                    if (json.Success) {
                        $scope.savedSims = [];
                        for (var i = 0; i < json.data.length; i++) {
                            var el = json.data[i];
                            var tempForm = JSON.parse(window.atob(el.simHash));
                            var obj = {
                                id: el.id,
                                simHash: el.simHash,
                                timestamp: new Date(el.timestamp).toUTCString(),
                                note: el.note,
                                mission: tempForm.Mission.description
                            };
                            $scope.savedSims.push(obj);
                        }
                    } else {
                        $scope.alerts[3] = json.error;
                    }
                }, function (data) {
                    var json = data.data;
                    if(json)
                        $scope.alerts[3] = 'Error sending request\n'+json.error;
                    else
                        $scope.alerts[3] = data.status + " " + data.statusText;
                }
            );
    };
    
    $scope.removeSim = function (obj) {
        var data = {
            id: obj.id,
            auth: {token: $scope.$parent.token}
        };
        $scope.$parent.httpRequest('/user/removeSim', 'POST', JSON.stringify(data),
                function (data) {
                    var json = data.data;
                    if (json.Success) {
                        var index = $scope.savedSims.indexOf(obj);
                        if (index > -1) {
                            $scope.savedSims.splice(index, 1);
                        }
                    } else {
                        $scope.alerts[3] = json.error;
                    }
                }, function (data) {
                    var json = data.data;
                    if(json)
                        $scope.alerts[3] = 'Error sending request\n'+json.error;
                    else
                        $scope.alerts[3] = data.status + " " + data.statusText;
                }
            );
    };
});