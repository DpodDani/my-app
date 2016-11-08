const myApp = angular.module('myApp', ['ngRoute']);

myApp.config(function($routeProvider) {
    $routeProvider
	.when('/', {
	    templateUrl: 'index.ejs',
	    controller: 'main-controller'
	});
});
