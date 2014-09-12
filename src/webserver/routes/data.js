module.exports = function(services) {
  var endpoints = {};

  endpoints.index = function(req, res){
    console.info('hitting index');
  };

  endpoints.resetCounter = function(req, res){
    console.info('hitting index');
  };

  endpoints.resetDump = function(req, res){
    console.info('hitting index');
  };

  return endpoints;
};
