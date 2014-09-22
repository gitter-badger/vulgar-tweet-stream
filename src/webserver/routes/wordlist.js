module.exports = function(services){
  var endpoints = {};

  endpoints.index = function(req, res){
    console.info('hitting index');
  };

  endpoints.add = function(req, res){
    console.info('hitting add');
  };

  endpoints.remove = function(req, res){
    console.info('hitting remove');
  };

  return endpoints;
};
