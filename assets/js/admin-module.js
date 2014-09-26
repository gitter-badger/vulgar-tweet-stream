define(['angular'], function(ng){
  var module = ng.module('admin.module', ['ngRoute']);

  module.config(['$routeProvider', function($routeProvider){
    $routeProvider.otherwise({ redirectTo: '/status' });
  });


  return module;
});
