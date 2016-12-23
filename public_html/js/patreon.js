angular.module('FlightClub').controller('PatreonCtrl', function ($scope, $cookies) {

    $scope.$emit('viewBroadcast', 'patreon');

    $scope.loading = true;
    //$scope.$parent.toolbarClass = 'hide';
    $scope.rewards = [
        {id: 1103003, name: "Suborbital"},
        {id: 1103091, name: "Low Earth Orbit (LEO)"},
        {id: 1101121, name: "Medium Earth Orbit (MEO)"},
        {id: 1103002, name: "Geostationary Transfer Orbit (GTO)"},
        {id: 1102991, name: "Geostationary Earth Orbit (GEO)"}
    ];
    $scope.chosenClass = "Geostationary Earth Orbit (GEO)";
    
    var getRewardById = function(id) {
        var ret = null;
        $scope.rewards.forEach(function(el) {
            if(el.id === id)
                ret = el;
        });
        return ret;
    };
        
    queryString = 'auth=' + $cookies.get($scope.$parent.cookies.AUTHTOKEN);
    $scope.httpRequest('/patreon/patrons?'+queryString, 'GET', null, function (data) {
        var json = data.data;
        if(json.Success) {
            for (var key in json.data) {
                if(json.data.hasOwnProperty(key)) {
                    key = parseInt(key);
                    var reward = getRewardById(key);
                    reward.list = json.data[key];
                }
            }
        } else {
            
        }
        $scope.loading = false;
    }, function (data) {
        $scope.loading = false;        
    });
    
});