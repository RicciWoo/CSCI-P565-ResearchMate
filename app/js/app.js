var myApp = angular.module('myApp',['ngRoute','ngCookies', 'ngFileUpload','moment-picker','luegg.directives','ngMaterial', 'jkAngularRatingStars']);
myApp.constant('URL','http://silo.soic.indiana.edu:54545');
myApp.config(function ($routeProvider) {
  $routeProvider
    .when("/", {
      templateUrl: "components/login/login.html"
    }).when("/signup", {
      templateUrl: "components/signup/signup.html"
    }).when("/profile/", {
      templateUrl: "components/profile/profile.html"
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
    }).when("/publication/:publicationID", {
      templateUrl: "components/publication/publication.html"
    }).when("/groups", {
      templateUrl: "components/groups/groups.html"
    }).when("/search", {
      templateUrl: "components/search/search.html"
    }).when("/login", {
      templateUrl: "components/login/login.html"
    }).when("/gendiscussion", {
      templateUrl: "components/discussion/generaldiscussion.html"
    }).when("/discussion/:groupID", {
      templateUrl: "components/discussion/display-discussion.html"
    }).when("/discussiondetail/:groupid/:postid", {
      templateUrl: "components/discussion/discussion-detail.html"
    }).when("/creategroup", {
      templateUrl: "components/Group/add-group.html"
    }).when("/pendingrequest/:groupID", {
      templateUrl: "components/Group/pending-request.html"
    }).when("/chat", {
      templateUrl: "components/chat/chat.html"
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

myApp.directive('checkImage', function($http) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            attrs.$observe('ngSrc', function(ngSrc) {
                $http.get(ngSrc).success(function(){
                    // alert('image exist');
                }).error(function(){
                    // alert('image not exist');
                    element.attr('src', 'https://cdn0.iconfinder.com/data/icons/student-2/100/student-1-512.png'); // set default image
                });
            });
        }
    };
});

myApp.service('chatService', function($cookies) {
  var sessionString;
  var userName;
  var addSessionString = function(newObj) {
    sessionString = newObj;

  };
  var addUserName= function(newObj) {
    userName = newObj;
    console.log(newObj+" app");
  };
  var getUserName= function(newObj) {
    console.log(userName+" app");
    return userName;

  };
  var getSessionString = function(){

      return sessionString;
  };

  return {
    addSessionString: addSessionString,
    getSessionString: getSessionString,
    addUserName: addUserName,
    getUserName: getUserName
  };

});
myApp.directive("scrollBottom", function(){
  return {
      link: function(scope, element, attr){
          var $id= $("#" + attr.scrollBottom);
          $(element).on("click", function(){
              $id.scrollTop($id[0].scrollHeight);
          });
      }
  }
});
