angular.module('FlightClub').controller('StatusCtrl', function ($scope) {

    $scope.$emit('viewBroadcast', 'status');
    $scope.$parent.toolbarTitle = 'Flight Club | Status';
    $scope.$parent.toolbarClass = "";
    
    $scope.loading = true;
    angular.element(document).ready(function () {
        $scope.ping();
    });
    
    $scope.ping = function() {
        $scope.loading = true;
        $scope.httpRequest('', 'GET', null, function (data) {
            $scope.down = false;
            $scope.loading = false;
            $scope.data = data;
        }, function(data) {
            $scope.down = true;
            $scope.loading = false;
            $scope.data = data;
        });
    };
});