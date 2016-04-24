angular.module('roadtrippin.authFactory', [])

.factory('authFactory', function($http, $location, $window) {
  var signin = function(user) {
    return $http({
      method: 'POST',
      url: '/signin',
      data: user
    })
    .then(function(resp) {
      console.log(resp.data);
      // resp.data has username returned GOODDD now use this to query stuff
      return resp.data;
    })
    .catch(function(error) {
      console.log('ERROR: ', error);
      return { error: error.data.error };
    });
  };
  
  var signup = function(user) {
    return $http({
      method: 'POST',
      url: '/signup',
      data: user
    })
    .then(function(resp) {
      return resp.data;
    })
    .catch(function(error) {
      console.log('ERROR: ', error);
      return { error: error.data.error };
    });
  };
  
  var isAuth = function() {
    return !!$window.localStorage.getItem('com.roadtrippin');
  };
  
  return {
    signin: signin,
    signup: signup,
    isAuth: isAuth
  };
});