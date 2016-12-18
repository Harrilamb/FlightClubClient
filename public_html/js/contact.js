angular.module('FlightClub').controller('ContactCtrl', function ($scope, $http, $mdDialog, $timeout) {

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
        $http({url: '/process.php', data: $.param($scope.form), method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}
        }).then(function (data) {
            $scope.sending = false;
            $scope.sendStatusColor = '#82CA9D';
            $scope.send_icon = 'check';
            $scope.sendStyle = true;
            $timeout(function () {
                $scope.send_icon = 'send';
                $scope.sendStyle = false;
            }, 4000);
        }, function (data) {
            $scope.sending = false;
            $scope.sendStatusColor = '#F7977A';
            $scope.send_icon = 'close';
            $scope.sendStyle = true;
            $timeout(function () {
                $scope.send_icon = 'send';
                $scope.sendStyle = false;
            }, 4000);
            $mdDialog.show(
                    $mdDialog.alert()
                    .parent(angular.element(document.querySelector('#mailForm')))
                    .clickOutsideToClose(true)
                    .title('Something\'s broken')
                    .textContent('You can mail me directly at declan.murphy@flightclub.io. Sorry about that.')
                    .ariaLabel('Mail failed')
                    .ok('Got it!')
                    );
        });
    };
});