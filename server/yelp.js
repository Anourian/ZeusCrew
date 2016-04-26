var Yelp = require('yelp');

var yelp = new Yelp({
  consumer_key: '',
  consumer_secret: '',
  token: '',
  token_secret: '',
});
 exports.getReviews = function (req, response, next){
  console.log('about to contact yelp'); 
  console.log(JSON.stringify(req.body));
  var name = req.body.name;
  var location = req.body.location;
  var coord = req.body.geometry.lat + ',' + req.body.geometry.lng;
 
  yelp.search({ term: name, location: location, cll:coord})
    .then(function (data) {
      console.log(data);
      response.send(data);
    })
    .catch(function (err) {
      console.error(err);
      response.send(data);
    });
};

exports.test = function (req, response, next){
  console.log('in yelp file');
};