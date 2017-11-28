myApp.controller('indexController', ['$scope','$location', function ($scope, $location) {
  $scope.searchQuery = function(){
    debugger
    if($scope.searchStr.indexOf('=')!=-1){
      alert("Possible attempt of SQL Injection. Request blocked!");
      return;

    }
    $location.path("/search/").search({'searchStr':$scope.searchStr})
  };

  $scope.signOut = function() {

window.location.href="http://localhost/researchmate";
      var auth2 = gapi.auth2.getAuthInstance();
      auth2.signOut().then(function () {
        auth2.disconnect();
        console.log('User signed out.');

      });
    }


}]);
