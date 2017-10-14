

myApp.controller('loginController', ['$scope','$http','$location', function($scope,$http,$location) {
  var self=$scope; 
 
    $scope.submit = function(){
  
      console.log($scope.pwd);
      $http.get('https://jsonplaceholder.typicode.com/posts/1').then(function(response) {
        $location.path("/singup");
              
      });
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