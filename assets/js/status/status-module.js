define(['angular'], function(ng){
  var module = ng.module('status.module', []);

  module.config(['$routeProvider', function($routeProvider){
    $routeProvider.when('/status', {
      controller: '',
      templateUrl: ''
    });

  });

  return module;
});
