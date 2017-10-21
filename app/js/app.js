var myApp = angular.module('myApp',['ngRoute','ngCookies']);
myApp.constant('URL','http://silo.soic.indiana.edu:48167');
myApp.config(function ($routeProvider) {
  $routeProvider
    .when("/", {
      templateUrl: "components/login/login.html"
    }).when("/signup", {
      templateUrl: "components/signup/signup.html"
    }).when("/profile", {
      templateUrl: "components/profile/profile.html"
    }).when("/forgetpassword", {
      templateUrl: "components/login/forgetpassword.html"
    }).when("/forgetusername", {
      templateUrl: "components/login/forgetusername.html"
    }).when("/updatepassword", {
      templateUrl: "components/login/updatepassword.html"
    }).when("/verifyuser", {
      templateUrl: "components/login/verifyuser.html"
    });
  

   
});