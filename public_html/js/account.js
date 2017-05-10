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

            var data = JSON.stringify($scope.forms[0]);
            $scope.$parent.httpRequest('/user/login', 'POST', data, function (response) {
                var json = response.data;
                var now = new Date();
                var expiryDate = new Date(now.getTime() + 1000 * parseInt(json.data[0].maxAge));

                $cookies.put($scope.$parent.cookies.AUTHTOKEN, json.data[0].authToken, {'expires': expiryDate});
                $scope.$parent.token = json.data[0].authToken;
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
            $scope.$parent.token = undefined;
            $scope.alerts[0] = "Successfully logged out!";
        }
    };

    $scope.updatePassword = function () {
        $scope.forms[1].auth = {token: $scope.$parent.token};
        var data = JSON.stringify($scope.forms[1]);
        $scope.forms[1].auth = {token: ''};
        $scope.$parent.httpRequest('/user/updatePass', 'POST', data, function (response) {
            $scope.alerts[1] = 'Password updated successfully!';
            $scope.forms[1] = {};
        }, function (response) {
            var json = response.data;
            $scope.alerts[1] = "Error " + response.status + ": " + json.data[0];
        });
    };

    $scope.create = function () {
        $scope.forms[2].auth = {token: $scope.$parent.token};
        var data = JSON.stringify($scope.forms[2]);
        $scope.forms[2].auth = {token: ''};
        $scope.$parent.httpRequest('/user/new', 'POST', data, function (data) {
            $scope.alerts[2] = 'User \"' + $scope.forms[2].Create.new.username + '\" created successfully!';
            $scope.forms[2] = {};
        }, function (response) {
            var json = response.data;
            $scope.alerts[2] = "Error " + response.status + ": " + json.data[0];
        });
    };

    $scope.reloadSavedSims = function () {
        $scope.$parent.httpRequest('/user/savedSims', 'POST', JSON.stringify({auth: {token: $scope.$parent.token}}), function (response) {
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
        var data = {
            id: obj.id,
            auth: {token: $scope.$parent.token}
        };
        $scope.$parent.httpRequest('/user/removeSim', 'POST', JSON.stringify(data), function (response) {
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