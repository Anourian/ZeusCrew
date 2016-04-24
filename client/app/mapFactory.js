angular.module('roadtrippin.mapsFactory', [])

  .factory('mapFactory', function($http, $q, $window, $location) {

    //send endpoints and array of waypoints to the server
    var shareJourney = function(selectedTrip) {
      console.log(selectedTrip);
      var deferred = $q.defer ();
      $http({
        method: 'POST',
        url: '/shareJourney',
        data: JSON.stringify(selectedTrip)
      }).then(function (res) {
        deferred.resolve (res);
      }).catch(function (err) {
        deferred.reject (err);
      });
      return deferred.promise;
    };
    var saveJourneyWithWaypoints = function (tripObject, username) {
      // console.log(username);
      // console.log(tripObject);
      tripObject.username = username;
      var deferred = $q.defer ();
      $http({
        method: 'POST',
        url: '/saveJourney',
        data: JSON.stringify(tripObject)
      }).then(function (res) {
        deferred.resolve (res);
      }).catch(function (err) {
        deferred.reject (err);
      });
      return deferred.promise;
    };

    var getAllRoutes = function() {
      console.log('invoked');
      console.log(localStorage.username);
      var username = localStorage.username;
      var deferred = $q.defer();
      $http({
        method: 'GET',
        url: '/saveJourney/' + username
      }).then(function (res) {
        // console.log(res.data);
        deferred.resolve (res.data);
      }).catch(function (err) {
        deferred.reject (err);
      });
      return deferred.promise;
    };

    var signout = function() {
      $window.localStorage.removeItem('com.roadtrippin');
      $location.path('/signin');
    };

    return {
      shareJourney: shareJourney,
      saveJourneyWithWaypoints: saveJourneyWithWaypoints,
      getAllRoutes: getAllRoutes,
      signout: signout
    };
  });
