var myApp = angular.module('myApp',[]);

myApp.controller('loginController', ['$scope','$http', function($scope,$http) {
  var self=$scope; 
    $scope.submit = function(){
      console.log($scope.email);
      console.log($scope.pwd);
      $http.get('https://jsonplaceholder.typicode.com/posts/1').then(function(response) {
        
              
      });
    } 

 
}]);