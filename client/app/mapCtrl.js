angular.module('roadtrippin.maps', ['gservice'])
  .controller('mapController', function($scope, mapFactory, gservice, $location, $anchorScroll, $window, $q) {
    $scope.route = {};
    $scope.route.stopOptions = [1, 2, 3, 4, 5];
    $scope.places = [];
    $scope.savedRoutes = [];
    //$scope.route.stopTypes = ["Things to do", "Restaurants", "Lodging", "Gas"];
    $scope.route.stopTypes = [];
    $scope.username = $window.localStorage;

    $scope.gservice = gservice;    

    $scope.popularRoutes = [];
    gservice.initialize();

    var startAutoComplete = new google.maps.places.Autocomplete(
      document.getElementById('start'), {
      types: ['geocode']
    });
    
    startAutoComplete.addListener('place_changed', function() {
      $scope.route.start = startAutoComplete.getPlace().formatted_address;
        var place = startAutoComplete.getPlace();
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
      //console.log($scope.route.stopTypes + " +++++++++++++")
      gservice.calcRoute($scope.route.start, $scope.route.end, $scope.route.numStops, $scope.route.stopTypes)
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

    $scope.getLocation = function(waypoints){
      var deferred = $q.defer();
      var geoCheck = new google.maps.Geocoder();
      locations = [];
      for (var a = 0; a < waypoints.length; a++){
        geoCheck.geocode({location:{lat:waypoints[a].lat,lng:waypoints[a].lng}}, function (result, status){
          if (status === google.maps.GeocoderStatus.OK){
            var point = {
              location:result[0].formatted_address,
              name:'Custom Location'
            };
            locations.push(point);
            if (locations.length === waypoints.length){
              deferred.resolve(locations);
            } 
          }
        });
        
      }
      return deferred.promise;
    };
    $scope.saveRoute = function () {  
    var deferred = $q.defer();               
      var trip = $scope.gservice.thisTrip;
      var newTrip = {};
      var locations = [];
      if (Object.keys(trip).length > 0){
        var request = $scope.gservice.directionsDisplay.directions.request;
        var wp = request.waypoints;        
        newTrip.waypoints = [];
        for (var a = 0; a < wp.length; a++){
          if (typeof wp[a].location === 'string'){
            //name check
            var name;
            var geometry;
            for (var b = 0; b < trip.waypoints.length; b++){
                if (trip.waypoints[b].location === wp[a].location){
                  name = trip.waypoints[b].name;
                  geometry = trip.waypoints[b].geometry;
                }
            }
            name = name || 'Custom Location';
            newTrip.waypoints[a] = {
              location:wp[a].location,
              position:a,
              name:name,
              geometry:geometry
            };           
          } else {
            var lat = wp[a].location.lat();
            var lng = wp[a].location.lng();
            var pos = a;
            var point = {
              lat:lat,
              lng:lng,
              position:pos
            };
            locations.push(point);                       
          }          
        }
      }
      if (locations.length === 0){
        deferred.resolve(newTrip);
      } else {
        $scope.getLocation(locations).then(function(val){
          for (var c = 0; c < val.length; c ++){
            newTrip.waypoints[locations[c].position] = {
              location:val[c].location,
              position:locations[c].position,
              name:val[c].name,
              geometry:{lat:locations[c].lat,lng:locations[c].lng}
            };
            if (c === val.length - 1){
              deferred.resolve(newTrip);
            }
          }
        });        
      }
      return deferred.promise;
    };
    $scope.saveRouteComplete = function (){
      $scope.saveRoute().then(function(val){
        var newTrip ={};
        var rlegs = $scope.gservice.directionsDisplay.directions.routes[0].legs;        
        newTrip.start = rlegs[0].start_address;
        newTrip.end = rlegs[rlegs.length - 1].end_address;
        newTrip.waypoints = val.waypoints;
        mapFactory.saveJourneyWithWaypoints(newTrip, $window.localStorage.username).then($scope.getAll());                
      });
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
    $scope.shareRoute = function (hash) {
      $scope.savedRoutes.forEach(function(obj, index) {
        if (obj.hash === hash) {
          mapFactory.shareJourney(obj).then(function(result) {
            $scope.getPopularPath();
          });
        }
      });
    };

    $scope.deleteRoute = function (hash) {
      mapFactory.deleteJourney({hash: hash, username: $window.localStorage.username})
        .then($scope.getAll());
    };

    $scope.viewPopularRoute = function(hash) {
      $location.hash('top');
      $anchorScroll();
      for (var i = 0; i < $scope.popularRoutes.length; i++) {
        if ($scope.popularRoutes[i].hash === hash) {
          //split up waypoints array into names ans locations. Even index ==== name, odd index === location
          $scope.popularRoutes[i].stopLocations = [];
          $scope.popularRoutes[i].stopNames = [];
          for (var j = 0; j < $scope.popularRoutes[i].wayPoints.length; j++) {
            if (j % 2 === 0) {
              $scope.popularRoutes[i].stopNames.push($scope.popularRoutes[i].wayPoints[j]);
            } else {
              $scope.popularRoutes[i].stopLocations.push($scope.popularRoutes[i].wayPoints[j]);
            }
          }
          //set $scope.places to saved stop data so stop data will display on page
          var places = [];
          for (var k = 0; k < $scope.popularRoutes[i].stopNames.length; k++) {
            var location = $scope.popularRoutes[i].stopLocations[k];
            var place = {
              name: $scope.popularRoutes[i].stopNames[k],
              location: location,
              position: k
            };
            places.push(place);
          }
          //add stop locations to stops array, render stops to map
          gservice.render($scope.popularRoutes[i].startPoint, $scope.popularRoutes[i].endPoint, places)
          .then(function (places) { splitLocations(places); });
        }
      }

    };

    $scope.viewSavedRoute = function (hash) {
      $location.hash('top');
      $anchorScroll();     
      for (var i = 0; i < $scope.savedRoutes.length; i++) {
        if ($scope.savedRoutes[i].hash === hash) {
          //split up waypoints array into names ans locations. Even index ==== name, odd index === location
          $scope.savedRoutes[i].stopLocations = [];
          $scope.savedRoutes[i].stopNames = [];
          $scope.savedRoutes[i].stopGeometryLat = [];
          $scope.savedRoutes[i].stopGeometryLng = [];
           var counter = 0;
          for (var j = 0; j < $scope.savedRoutes[i].wayPoints.length; j++) {
            if (counter === 0) {
              $scope.savedRoutes[i].stopNames.push($scope.savedRoutes[i].wayPoints[j]);
            } else if (counter === 1){
              $scope.savedRoutes[i].stopLocations.push($scope.savedRoutes[i].wayPoints[j]);
            } else if (counter === 2) {
              $scope.savedRoutes[i].stopGeometryLat.push($scope.savedRoutes[i].wayPoints[j]);
            } else if (counter === 3) {
              $scope.savedRoutes[i].stopGeometryLng.push($scope.savedRoutes[i].wayPoints[j]);
            }
            if (counter < 3){
              counter ++;
            } else {
              counter = 0;
            }
          }
          //set $scope.places to saved stop data so stop data will display on page
          var places = [];
          for (var k = 0; k < $scope.savedRoutes[i].stopNames.length; k++) {
            var location = $scope.savedRoutes[i].stopLocations[k];
            var geometry = {lat:$scope.savedRoutes[i].stopGeometryLat[k], lng:$scope.savedRoutes[i].stopGeometryLng[k]};
            var place = {
              name: $scope.savedRoutes[i].stopNames[k],
              location: location,
              position: k,
              geometry:geometry
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
      $scope.savedRoutes = [];
    };
    
    $scope.getTimes = function (numStops) {
      var array = [];
      for(var i = 0; i<numStops; i++){
        array.push(i);
      }
      return array;
    };
    $scope.getLocation = function(place){
      var name = place.name;
      var location = place.location.join('');
      var geometry = place.geometry;
      var reqObj = {name:name, location:location, geometry:geometry};
      mapFactory.getLocation(reqObj).then(function(val){
        console.log(val);
        place.rating = val.businesses[0].rating;
        place.snippet = val.businesses[0].snippet_text;
        place.url = val.businesses[0].url;
        console.log(place.url);
      });
    };
  });
