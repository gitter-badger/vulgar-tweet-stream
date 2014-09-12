
var config = require('../config'),
tps = 0,
mps = 0,
counterModel = undefined,
obj = {};

setInterval(function(){
  obj.tweetsPerSecond = tps;
  obj.matchesPerSecond = mps;
  tps = 0;
  mps = 0;
}, 1000);

exports.serviceApi = function(){ return obj; };

exports.updateMatchesPerSecond = function(){ mps++; };
exports.updateTweetsPerSecond = function(){ tps++; };

exports.setDumpCollection = function(collection){ 
  tweetDumpCollection = collection; 
};
exports.setCounterModel = function(counter){
  counterModel = counter;
  obj.phrases = counter.model;
};

