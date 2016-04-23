var Q = require('q');
var Journey = require('./journeyModel.js');
var User = require('../users/userModel.js');

var findJourney = Q.nbind(Journey.findOne, Journey);
var createJourney = Q.nbind(Journey.create, Journey);

var findUserRoute = Q.nbind(User.findOne, User);


module.exports = {
  saveJourney: function (req, res, next) {
    // req.body has start, end and waypoints
    var username = req.body.username;
    var start = req.body.start;
    var end = req.body.end;
    var waypoints = [];
    // putting all the waypoints into the waypoint array
    for (var i = 0; i < req.body.waypoints.length; i++) {
      waypoints[req.body.waypoints[i].position] = [req.body.waypoints[i].name, req.body.waypoints[i].location];
    }
    // waypoint is now an array with inner arrays
    // console.log(waypoints);
    // console.log(username);
    // console.log('-----');
    var waypointsCopy = [].concat.apply([], waypoints);
    waypoints = waypointsCopy;
    // turned this into a single array
    // console.log(waypoints);
    // find userRoute by email first, make sure email is sent
    findUserRoute({username: username}).then(function(profile) {
      var routeObj = {
        startPoint: start,
        endPoint: end,
        wayPoints: waypoints
      };
      profile.userRoute.push(routeObj);
      profile.save();

      // console.log(profile.userRoute);
    });
    
    // findJourney({wayPoints: waypoints})
    //   .then(function (waypoint) {
    //     if (!waypoint) {
    //       return createJourney({
    //         startPoint: start,
    //         endPoint: end,
    //         wayPoints: waypoints
    //       });
    //     } else {
    //       next(new Error('Journey already exist!'));
    //     }
    //   })
    //   .catch(function (error) {
    //     next(error);
    //   });
  },
  getUserRoute: function(req, res, next) {
    var username = req.params.username;
    findUserRoute({username: username})
    .then(function(profile) {
      res.status(200).send(profile.userRoute);
    })
    .catch(function(err) {
      next(err);
    });
  },
  // getAll is not used atm
  getAll: function (req, res, next) {
    var username = req.params.username;
    findUserRoute({username: username})
    .then(function(data) {
      res.status(200).send(data.userRoute);
    })
    .catch(function(error) {
      next(error);
    });
    // Journey.find({})
    //   .then(function (data) {
    //     // console.log(data);
    //     res.status(200).send(data);
    //   })
    //   .catch(function(error) {
    //     next(error);
    //   });
  }
};
