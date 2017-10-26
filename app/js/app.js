var myApp = angular.module('myApp',['ngRoute','ngCookies', 'ngFileUpload','moment-picker']);
myApp.constant('URL','http://silo.soic.indiana.edu:54545');
myApp.config(function ($routeProvider) {
  $routeProvider
    .when("/", {
      templateUrl: "components/login/login.html"
    }).when("/signup", {
      templateUrl: "components/signup/signup.html"
    }).when("/profile/:username", {
      templateUrl: "components/profile/profile.html"
    }).when("/forgetpassword", {
      templateUrl: "components/login/forgetpassword.html"
    }).when("/forgetusername", {
      templateUrl: "components/login/forgetusername.html"
    }).when("/updatepassword", {
      templateUrl: "components/login/updatepassword.html"
    }).when("/verifyuser", {
      templateUrl: "components/login/verifyuser.html"
    }).when("/publication", {
      templateUrl: "components/publication/publication.html"
    }).when("/groups", {
      templateUrl: "components/groups/groups.html"
    });


});
