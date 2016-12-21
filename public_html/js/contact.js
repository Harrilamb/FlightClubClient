angular.module('FlightClub').controller('ContactCtrl', function ($scope, $http, $timeout) {

    $scope.$emit('viewBroadcast', 'contact');

    $scope.$parent.toolbarTitle = 'Flight Club | Contact';
    $scope.send_icon = 'send';
    $scope.form = {
        name: '',
        email: '',
        message: ''
    };

    $scope.formDisabled = true;
    $scope.validate = function () {
        if ($scope.form.email === ''
                || $scope.form.name === ''
                || $scope.form.message === '')
            $scope.formDisabled = true;
        else
            $scope.formDisabled = false;
    };

    $scope.sendMail = function () {
        $scope.sending = true;
        $scope.formDisabled = true;
        $http({url: '/process.php', data: $scope.serialize($scope.form), method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}
        }).then(function () {
            $scope.sending = false;
            $scope.sendStatusColor = '#82CA9D';
            $scope.send_icon = 'check';
            $scope.sendStyle = true;
            $timeout(function () {
                $scope.send_icon = 'send';
                $scope.sendStyle = false;
            }, 4000);
        }, function () {
            $scope.sending = false;
            $scope.sendStatusColor = '#F7977A';
            $scope.send_icon = 'close';
            $scope.sendStyle = true;
            $timeout(function () {
                $scope.send_icon = 'send';
                $scope.sendStyle = false;
            }, 4000);
            $scope.openThemedDialog('Something\'s broken',
                    'You can mail me directly at declan.murphy@flightclub.io. Sorry about that.',
                    null, null,
                    'Got it!', null
            );
        });
    };
});