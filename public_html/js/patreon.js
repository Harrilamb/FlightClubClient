angular.module('FlightClub').controller('PatreonCtrl', function ($scope, $cookies) {

    $scope.$emit('viewBroadcast', 'patreon');

    $scope.loading = true;
    $scope.$parent.toolbarTitle = 'Flight Club | Patreon';
    
    var queryString = window.location.search.substring(1);
    $scope.queryParams = $scope.parseQueryString(queryString);
        
    queryString = 'auth=' + $cookies.get($scope.$parent.cookies.AUTHTOKEN);
    $scope.httpRequest('/patreon/patrons?'+queryString, 'GET', null, function (data) {
        var json = data.data;
        if(json.Success) {
            $scope.rewards = json.data;
        } else {
            
        }
        $scope.loading = false;
    }, function (data) {
        $scope.loading = false;        
    });
    
    $scope.show = function(tier) {
        if($scope.queryParams===undefined)
            return true;
        return tier.name.indexOf($scope.queryParams.id)!==-1;
    };
    
});