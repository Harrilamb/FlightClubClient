/* global angular */

angular
        .module('FCContact', ['ngMaterial', 'ngMessages'])
        .controller('ContactCtrl', function ($scope, $window, $http, $mdDialog) {

          $scope.mailSuccess = false;
          $scope.form = {
            name: '',
            email: '',
            message: ''
          };

          $scope.formDisabled = true;
          $scope.validate = function () {
            $scope.mailSuccess= false;
            if ($scope.form.email === ''
                    || $scope.form.name === ''
                    || $scope.form.message === '')
              $scope.formDisabled = true;
            else
              $scope.formDisabled = false;
          };

          $scope.redirect = function (url) {
            $window.location.href = url;
          };

          $scope.sendMail = function () {
            $scope.formDisabled = true;
            $http({url: '/process.php', data: $.param($scope.form), method: 'POST',
                headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}
            }).then(function () {
              $scope.mailSuccess = true;
            }, function () {
              $mdDialog.show(
                      $mdDialog.alert()
                      .parent(angular.element(document.querySelector('#mailForm')))
                      .clickOutsideToClose(true)
                      .title('Something\'s broken')
                      .textContent('You can mail me directly at murphd37@tcd.ie. Sorry about that.')
                      .ariaLabel('Mail failed')
                      .ok('Got it!')
                      );
            });
          };
        });
        