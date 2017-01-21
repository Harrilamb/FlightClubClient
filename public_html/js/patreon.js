angular.module('FlightClub').controller('PatreonCtrl', function ($scope, $cookies, $document, $location) {

    $scope.$emit('viewBroadcast', 'patreon');

    $scope.loading = true;
    $scope.$parent.toolbarTitle = 'Flight Club | Patreon';
    $scope.$parent.toolbarClass = "";

    $scope.queryParams = $location.search();
    $scope.chosenTiers = [], $scope.chosenPatrons = [];

    $scope.httpRequest('/patreon/patrons?auth=' + $cookies.get($scope.$parent.cookies.AUTHTOKEN), 'GET', null, function (data) {
        var json = data.data;
        if (json.Success) {
            $scope.rewards = json.data;
            $scope.rewards.sort(function(a,b) {return (a.amount > b.amount) ? -1 : ((b.amount > a.amount) ? 1 : 0);} );

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
                $scope.queryParams.id.forEach(function (queryTier) {
                    if (tier.name.indexOf(queryTier) !== -1) {
                        $scope.chosenTiers.push(tier); // not using this anymore, apart from to set the titleTier
                        tier.patrons.forEach(function (patron) {
                            $scope.chosenPatrons.push(patron);
                        });
                    }
                });
            });
            $scope.titleTier = $scope.chosenTiers[0];
            
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