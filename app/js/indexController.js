myApp.controller('indexController', ['$scope','$location', function ($scope, $location) {
  $scope.searchQuery = function(){
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
