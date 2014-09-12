
module.exports = function(services) {
  var endpoints = {};

  endpoints.index = function(req, res){ 
    console.info('hitting index'); 
  };
  endpoints.json = function(req, res){ 
    console.info('hitting json'); 
  };
  endpoints.csv = function(req, res){ 
    console.info('hitting csv');
  };
  endpoints.bigQuery = function(req, res){ 
    console.info('hitting biqQuery'); 
  };

  return endpoints;
};
