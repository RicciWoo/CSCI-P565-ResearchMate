
myApp.controller('loginController', ['$scope','$http','$location', function($scope,$http,$location,$cookies,$cookieStore) {
  var self=$scope; 
 
    $scope.submit = function(){
  
    }
 
}]);

myApp.config(function($routeProvider) {
  $routeProvider
  .when("/", {
      templateUrl : "components/login/login.html"
  }).when("/signup", {
    templateUrl : "components/signup/signup.html"
});;
});