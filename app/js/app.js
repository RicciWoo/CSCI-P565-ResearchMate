var myApp = angular.module('myApp',['ngRoute','ngCookies', 'ngFileUpload','moment-picker','ngMaterial', 'jkAngularRatingStars']);
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
    }).when("/search", {
      templateUrl: "components/search/search.html"
    }).when("/login", {
      templateUrl: "components/login/login.html"
    });


});
myApp.run(function ($rootScope, $location, $cookieStore,$cookies) {
  $rootScope.$on("$locationChangeStart", function (event, next, current) {
    var sessionString = $cookies.get('sessionString');
    
     if($location.path().includes("/profile/") || $location.path().includes("/group")|| $location.path().includes("/publication"))
     {
       if(sessionString==undefined)
       {
         alert("not authorize");
         $location.path("/");
       }
     }
  });
 });


myApp.directive('ngEnter', function() {
  return function(scope, element, attrs) {
      element.bind("keydown", function(e) {
          if(e.which === 13) {
              scope.$apply(function(){
                  scope.$eval(attrs.ngEnter, {'e': e});
              });
              e.preventDefault();
          }
      });
  };
});
