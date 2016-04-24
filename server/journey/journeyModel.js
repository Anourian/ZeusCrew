var mongoose = require('mongoose');
var crypto = require('crypto');
var Q = require('q');

var JourneySchema = new mongoose.Schema({
  startPoint: {
    type: String
  },
  endPoint: {
    type: String
  },
  wayPoints: {
    type: [String]
  },
  hash: {
    type: String
  }
});


var Journey = mongoose.model('Journey', JourneySchema);
module.exports = Journey;
