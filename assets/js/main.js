(function(require, document){

  var config = {
    baseUrl: '/js',
    paths: {
      'angular': 'vendor/angular/angular',
      'ngRoute': 'vendor/angular-route/angular-route',
      'app': 'admin-module',
    },
    shims: {
      'angular': { exports: 'angular' },
      'ngRoute': ['angular'],
      'app': ['ngRoute']
    }
  };

  require.config(config);

  require(['angular', 'app'], function(ng, application){
    ng.element(document).ready(function(){
        ng.bootstrap(document, [application.name]);
      });
  });

}(require, document));
