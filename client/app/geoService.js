angular.module('gservice', [])
    .factory('gservice', function ($http, $q, mapFactory) {

      var googleMapService = {};

      // Set-up functions
      // --------------------------------------------------------------

      // Initialize the map
      var map, directionsDisplay;
      var directionsService = new google.maps.DirectionsService();

      //Store current trip data so we can access it for saving.
      //Properties will be added to this object every time a route is calculated.
      googleMapService.thisTrip = {};

      //initialize the map if no other instructions are given
      var initialize = function () {
        directionsDisplay = new google.maps.DirectionsRenderer({draggable:true});
        var SF = new google.maps.LatLng(37.7749, -122.4194);
        var mapOptions = {
          zoom: 7,
          center: SF
        };
        map = new google.maps.Map(document.getElementById('map'), mapOptions);
        googleMapService.map = map;
        directionsDisplay.setMap(map);
        googleMapService.directionsDisplay = directionsDisplay;
      };

      // Refresh, to re-initialize the map.
      googleMapService.refresh = function () {
        initialize();
      };

      // Refresh the page upon window load.
      google.maps.event.addDomListener(window, 'load',
        googleMapService.refresh());


      // Navigation functions - Google directions service
      // --------------------------------------------------------------

      //calculate a route (promisified function)
      googleMapService.calcRoute = function (start, end, numStops, stopTypes) {
        var deferred = $q.defer();
        var request = {
          origin: start,
          destination: end,
          travelMode: google.maps.TravelMode.DRIVING
        };
        directionsService.route(request, function (result, status) {
          if (status == google.maps.DirectionsStatus.OK) {
            // grab official start and end points for later use
            var officialStart = result.routes[0].legs[0].start_address;
            var officialEnd = result.routes[0].legs[0].end_address;
            //format and send request for the same trip but with waypoints
            var stops = [];
            var waypoints = getWaypoints(result.routes[0].overview_path, numStops);
            var promise = getNearbyThings(waypoints, stopTypes); //testing testing
            promise.then(function (placePoints) {
              googleMapService.render(officialStart, officialEnd, placePoints)
              .then(function () {
                deferred.resolve(googleMapService.thisTrip.waypoints);
              });
            });
          }
        });
        return deferred.promise;
      };

      //render a complete journey (promisified function)
      googleMapService.render = function (start, end, waypoints) {
        var deferred = $q.defer();
        //make route points accessable to other functions
        googleMapService.thisTrip.start = start;
        googleMapService.thisTrip.end = end;
        googleMapService.thisTrip.waypoints = waypoints;
        var stops = []; //format stops for Google request
        waypoints.forEach(function (w) {
          stops.push({
            location: w.location,
            stopover: true
          });
        });
        var wyptRequest = { //format the request for Google
          origin: start,
          destination: end,
          waypoints: stops,
          optimizeWaypoints: true,
          travelMode: google.maps.TravelMode.DRIVING
        };
        directionsService.route(wyptRequest, function (response, status) {
          if (status === google.maps.DirectionsStatus.OK) {
            directionsDisplay.setDirections(response);
            var route = response.routes[0];
            sortWaypoints(response.routes[0].waypoint_order);
            deferred.resolve(waypoints);
          }
        });
        return deferred.promise;
      };


      // Waypoint functions - Google places service
      // --------------------------------------------------------------

      // get waypoints by breaking up trip into even-ish segments
      var getWaypoints = function (waypointArray, numStops) {
        var points = [];
        var stopDistance = Math.floor(waypointArray.length / (numStops + 1));
        for (i = 0; i < numStops; i++) {
          points.push(stopDistance + (stopDistance * i));
        }
        var waypoints = [];
        points.forEach(function (index) { //retrieve lat/lng data for each wpt
          var waypoint = {
            lat: waypointArray[index].lat(),
            lng: waypointArray[index].lng()
          };
          waypoints.push(waypoint);
        });
        return waypoints;
      };
      
      //determine what the type is based on inpute
      var findType = function (type) {
        if(type === 'stay'){
          return 'lodging';
        }
        if(type === 'gas'){
          return 'gas_station';
        }
        if(type === 'eat'){
          return 'restaurant';
        }
        if(type === 'play'){
          var activites = ['amusement_park' , 'aquarium', 'art_gallery', 'bar', 'bowling_alley', 'casino', 'embassy', 'library', 'movie_theater', 'museum', 'night_club', 'park', 'zoo'];
          var index = Math.floor(Math.random()*activites.length);
          return activites[index];
        }
        return 'restaurant';
      }

      //get a single nearby attraction for each waypoint (promisified function)
      var getNearbyThings = function (waypointArray, stopTypes, distance) {
        var deferred = $q.defer();
        var placesToStop = [];
        //build out an array of requests
        var placeRequests = [];
        var type;
        waypointArray.forEach(function (w, index) {
          //type = findType(stopTypes[index]);
          placeRequests.push({
            location: new google.maps.LatLng(w.lat, w.lng),
            radius: distance || '500',
            type: type || 'embassy'
          });
        });
        //query the google places service each waypoint
        var doneSoFar = 0; //counter for async for loop
        for (var i = 0; i < placeRequests.length; i++) {
          var placesService = new google.maps.places.PlacesService(document.getElementById('invisible'), placeRequests[i].location);
          var currentSearch = placeRequests[i];
          placesService.textSearch(placeRequests[i], function (res, status) {
            if (!res.length){
              console.log(status);
              currentSearch.type = findType('play');
              console.log(currentSearch);
             // var placesService = new google.maps.places.PlacesService(document.getElementById('invisible'), currentSearch.location);
              placesService.textSearch(currentSearch, function (res, status){
                console.log('did this');
              })
            }
            if (status == google.maps.places.PlacesServiceStatus.OK) {
              console.log(res);
              var index = 0;
              //decide on index randomly
              //var index = Math.floor(Math.random()*20)
              var place = {
                location: res[index].formatted_address,
                name: res[index].name
              };
              placesToStop.push(place);
              doneSoFar++;
              if (doneSoFar === placeRequests.length) {
                deferred.resolve(placesToStop);
              }
            } else { //if Google doesn't send an OK status
              deferred.reject('we had a problem');
            }
          });
        }
        return deferred.promise;
      };

      //Record order in 'position' property of each waypoint
      var sortWaypoints = function (waypointOrder) {
        for (var i = 0; i < googleMapService.thisTrip.waypoints.length; i++) {
          var waypoint = googleMapService.thisTrip.waypoints[i];
          var position = waypointOrder[i];
          waypoint.position = position;
        }
        return;
      };      

      return googleMapService;
    });
