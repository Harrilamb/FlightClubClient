angular.module('FlightClub').controller('PatreonCtrl', function ($scope, $cookies, $document) {

    $scope.$emit('viewBroadcast', 'patreon');

    $scope.loading = true;
    $scope.$parent.toolbarTitle = 'Flight Club | Patreon';

    var queryString = window.location.search.substring(1);
    $scope.queryParams = $scope.parseQueryString(queryString);
    $scope.chosenTier;

    queryString = 'auth=' + $cookies.get($scope.$parent.cookies.AUTHTOKEN);
    $scope.httpRequest('/patreon/patrons?' + queryString, 'GET', null, function (data) {
        var json = data.data;
        if (json.Success) {
            $scope.rewards = json.data;

            /*
             * add fake data for long list
            for (var i = 0; i < 20; i++) {
                $scope.rewards[3].patrons.push({
                    id: i,
                    name: i,
                    imageUrl: ''
                });
            }*/

            $scope.rewards.forEach(function (tier) {
                if (tier.name.indexOf($scope.queryParams.id) !== -1) {
                    $scope.chosenTier = tier;
                }
            });

            setTimeout(scroll, 1000);

        } else {

        }
        $scope.loading = false;
    }, function (data) {
        $scope.loading = false;
    });

    var scroll = function () {
        var el = $document[0].getElementById("patreon");
        var height = el.scrollHeight;

        var scrollStep = parseInt(height / (5000 / 15));
        var target = 0;
        var scrollInterval = setInterval(function () {
            el.scrollTop = target;
            target += scrollStep;
            
            if(target > height)
                clearInterval(scrollInterval);
        }, 15);
    };

});