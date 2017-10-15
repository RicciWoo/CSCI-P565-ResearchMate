var myApp = angular.module('myApp',['ngRoute','ngCookies']);
myApp.config(function($locationProvider) {
    $locationProvider.html5Mode({
      enabled: true,
      requireBase: false
    });
});