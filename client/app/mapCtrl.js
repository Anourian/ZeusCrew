angular.module('roadtrippin.maps', ['gservice'])
  .controller('mapController', function($scope, mapFactory, gservice, $location, $anchorScroll, $window) {
    $scope.route = {};
    $scope.route.stopOptions = [1, 2, 3, 4, 5];
    $scope.places = [];
    $scope.savedRoutes = [];

    $scope.gservice = gservice;    

    $scope.popularRoutes = [];


    var startAutoComplete = new google.maps.places.Autocomplete(
      document.getElementById('start'), {
      types: ['geocode']
    });
    
    startAutoComplete.addListener('place_changed', function() {
      $scope.route.start = startAutoComplete.getPlace().formatted_address;
        var place = startAutoComplete.getPlace();
        console.log('place', place);    
    });

    var endAutoComplete = new google.maps.places.Autocomplete(
      document.getElementById('end'), {
      types: ['geocode']
    });

    endAutoComplete.addListener('place_changed', function() {
      $scope.route.end = endAutoComplete.getPlace().formatted_address;
      $(this).val('') ;   
    });

    //this is a call to our Google maps API factory for directions
    $scope.getRoute = function() {
      gservice.calcRoute($scope.route.start, $scope.route.end, $scope.route.numStops)
        .then(function(places) { splitLocations(places); });
        $scope.startInput = '';
        $scope.endInput = '';
    };

    var splitLocations = function (places) {
      $scope.places = [];
      //copy the places array before we start splitting things so our original stays in-tact
      var placesCopy = [];
      for (var i = 0; i < places.length; i++) {
        //this apparently is needed for a clean copy...
        placesCopy.push(JSON.parse(JSON.stringify(places[i])));
      }
      placesCopy.forEach(function (place) { //split address for easier formatting
        place.location = place.location.split(', ');
        $scope.places.push(place);
      });
    };

    $scope.getLetter = function (i) {
      return String.fromCharCode(i + 66);
    };


    $scope.saveRoute = function () {           
      var trip = $scope.gservice.thisTrip;
      if (Object.keys(trip).length > 0){
        var rlegs = $scope.gservice.directionsDisplay.directions.routes[0].legs; 
        if (trip.start !== rlegs[0].start_address){
          trip.start = rlegs[0].start_address;
        }
        if (trip.end !== rlegs[rlegs.length - 1]){
          trip.end = rlegs[rlegs.length - 1].end_address;
        }
        for (var a = 1; a < rlegs.length; a++){
          var origAdd = trip.waypoints[a-1].location.split(',')[0];
          var newAdd = rlegs[a].start_address.split(',')[0];
          if (origAdd !== newAdd){
            if (origAdd.substring(0,origAdd - 1) === newAdd){
              trip.waypoints[a-1].location = rlegs[a].start_address;
            } else {
              trip.waypoints[a-1].location = rlegs[a].start_address;
              trip.waypoints[a-1].name = 'Custom Location';              
            }
          }
        }
      }
      mapFactory.saveJourneyWithWaypoints(gservice.thisTrip, $window.localStorage.username).then($scope.getAll());

    };
    $scope.getPopularPath = function() {
      mapFactory.getPopularRoutes().then(function (results) {
        $scope.popularRoutes = results;
      });
    };

    $scope.getAll = function () {
      mapFactory.getAllRoutes().then(function (results) {
        $scope.savedRoutes = results;
      });
    };
    $scope.shareRoute = function(hash) {
      $scope.savedRoutes.forEach(function(obj, index) {
        if (obj.hash === hash) {
          mapFactory.shareJourney(obj).then(function(result) {
            $scope.getPopularPath();
          });
        }
      });
    };

    $scope.viewSavedRoute = function (hash) {
      $location.hash('top');
      $anchorScroll();
      for (var i = 0; i < $scope.savedRoutes.length; i++) {
        if ($scope.savedRoutes[i].hash === hash) {
          //split up waypoints array into names ans locations. Even index ==== name, odd index === location
          $scope.savedRoutes[i].stopLocations = [];
          $scope.savedRoutes[i].stopNames = [];
          for (var j = 0; j < $scope.savedRoutes[i].wayPoints.length; j++) {
            if (j % 2 === 0) {
              $scope.savedRoutes[i].stopNames.push($scope.savedRoutes[i].wayPoints[j]);
            } else {
              $scope.savedRoutes[i].stopLocations.push($scope.savedRoutes[i].wayPoints[j]);
            }
          }
          //set $scope.places to saved stop data so stop data will display on page
          var places = [];
          for (var k = 0; k < $scope.savedRoutes[i].stopNames.length; k++) {
            var location = $scope.savedRoutes[i].stopLocations[k];
            var place = {
              name: $scope.savedRoutes[i].stopNames[k],
              location: location,
              position: k
            };
            places.push(place);
          }
          //add stop locations to stops array, render stops to map
          gservice.render($scope.savedRoutes[i].startPoint, $scope.savedRoutes[i].endPoint, places)
          .then(function (places) { splitLocations(places); });
        }
      }
    };

    $scope.getAll();
    $scope.getPopularPath();

    $scope.signout = function () {
      mapFactory.signout();
    };
    
    $scope.getTimes = function (numStops) {
      var array = []
      for(var i = 0; i<numStops; i++){
        array.push(i+1);
      }
      return array;
    };
  });
