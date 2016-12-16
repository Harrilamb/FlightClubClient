angular.module('FlightClub').controller('HomeCtrl', function ($scope) {

    $scope.$parent.toolbarClass = "hide";
    $scope.$emit('viewBroadcast', 'home');

});