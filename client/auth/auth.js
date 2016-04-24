angular.module('roadtrippin.auth', [])

.controller('authController', function($scope, $window, $location, authFactory) {
  $scope.user = {};
  $scope.loginError = false;
  $scope.errorMessage = '';
  
  $scope.signin = function(valid) {
    console.log('is this working');
    if (valid) {
      authFactory.signin($scope.user)
        .then(function (data) {
          if (data.token && typeof data.token !== 'object') {
            $scope.loginError = false;
            $window.localStorage.setItem('com.roadtrippin', data.token);
            $window.localStorage.setItem('username', data.username);
            $location.path('/');
            // console.log('logged in');
            // console.log(data.username);
            // console.log($window.localStorage);
          } else if (typeof data.token === 'object') {
            $scope.loginError = true;
            $scope.errorMessage = data.token.error;
          }
        })
        .catch(function(error) {
          console.log(error);
        });
    }
  };
  
  $scope.signup = function(valid) {
    if (valid) {
      authFactory.signup($scope.user)
        .then(function (data) {
          if (data.token && typeof data.token !== 'object') { 
            $scope.loginError = false;
            $window.localStorage.setItem('com.roadtrippin', data.token);
            $window.localStorage.setItem('username', data.username);
            $location.path('/');
          } else if (typeof data.token === 'object') {
            $scope.loginError = true;
            $scope.errorMessage = data.token.error;
          }
        })
        .catch(function(error) {
          console.log(error);
        });
    }
  };
});