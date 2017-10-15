var myApp = angular.module('myApp',['ngRoute','ngCookies']);
myApp.config(function ($routeProvider) {
  $routeProvider
    .when("/", {
      templateUrl: "components/login/login.html"
    }).when("/signup", {
      templateUrl: "components/signup/signup.html"
    });
  

   
});