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

    $scope.httpRequest('/user/permissions', 'GET', null, function (response) {
        var json = response.data;
        $scope.permissions = {};
        for (var i = json.data.length; i > 0; i--) {
            $scope.permissions[json.data.length - i] = {code: json.data[i - 1].code, name: json.data[i - 1].name};
        }
    });

    $scope.capitalise = function (string) {
        return string === undefined ? undefined : string.charAt(0).toUpperCase() + string.slice(1);
    };

    $scope.alerts = [];
    $scope.loginToggle = function () {
        if (!$scope.$parent.authorised) {

            $scope.$parent.httpRequest('/user/login', 'POST', JSON.stringify($scope.forms[0]), function (response) {
                var json = response.data;
                
                $scope.$parent.authorised = true;

                $scope.$parent.permissions.length = 0;
                json.data[0].permissions.split(",").forEach(function (el) {
                    $scope.$parent.permissions.push(el.toLowerCase());
                });

                $scope.alerts[0] = "Successfully logged in!";
            }, function (response) {
                var json = response.data;
                $scope.alerts[0] = "Error " + response.status + ": " + json.data[0];
            });

        } else {
            $cookies.remove($scope.$parent.cookies.AUTHTOKEN);
            $scope.$parent.authorised = false;
            $scope.$parent.permissions.length = 0;
            $scope.alerts[0] = "Successfully logged out!";
        }
    };

    $scope.updatePassword = function () {
        $scope.$parent.httpRequest('/user/updatePass', 'POST', JSON.stringify($scope.forms[1]), function (response) {
            $scope.alerts[1] = 'Password updated successfully!';
            $scope.forms[1] = {};
        }, function (response) {
            var json = response.data;
            $scope.alerts[1] = "Error " + response.status + ": " + json.data[0];
        });
    };

    $scope.create = function () {
        $scope.$parent.httpRequest('/user/new', 'POST', JSON.stringify($scope.forms[2]), function (data) {
            $scope.alerts[2] = 'User \"' + $scope.forms[2].Create.new.username + '\" created successfully!';
            $scope.forms[2] = {};
        }, function (response) {
            var json = response.data;
            $scope.alerts[2] = "Error " + response.status + ": " + json.data[0];
        });
    };

    $scope.reloadSavedSims = function () {
        $scope.$parent.httpRequest('/user/savedSims', 'GET', null, function (response) {
            var json = response.data;
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
        }, function (response) {
            var json = response.data;
            $scope.alerts[3] = "Error " + response.status + ": " + json.data[0];
        });
    };

    $scope.removeSim = function (obj) {
        $scope.$parent.httpRequest('/user/savedSims/'+obj.id, 'DELETE', null, function (response) {
            var index = $scope.savedSims.indexOf(obj);
            if (index > -1) {
                $scope.savedSims.splice(index, 1);
            }
        }, function (response) {
            var json = response.data;
            $scope.alerts[3] = "Error " + response.status + ": " + json.data[0];
        });
    };
});