myApp.controller('indexController', ['$scope','$location','URL','$cookies','$cookieStore', '$http', '$rootScope', function ($scope, $location, URL, $cookies, $cookieStore, $http, $rootScope) {
  $scope.searchQuery = function(){
    if($scope.searchStr.indexOf('=')!=-1){
      alert("Possible attempt of SQL Injection. Request blocked!");
      return;

    }
    $location.path("/search/").search({'searchStr':$scope.searchStr})
  };

  var sessionString = $cookies.get('sessionString');

  if(sessionString != undefined && sessionString.trim()!=""){
    $('.menu-header').show();
    $http({
      url: URL + "/getAllConnectionRequests",
      method: "POST",
      data:{
        'sessionString': sessionString
      },
    }).then(function success(response){
      if(response.status == 200 && response.data.status == "true" && response.data.msg!=undefined){
        var data = response.data.msg;
        $scope.connectionReqCount = data.users.length;

        $scope.userInfo = [];

        for(var i=0; i<data.userInfo.length;i++){
          $scope.userInfo[data.userInfo[i].userID] = data.userInfo[i];
        }
        $scope.users = data.users;
      }
      else{
        console.log(response.data.msg);
      }
    },
  function error(response){
    console.log(response.statusText);
  });
  }
  else{
    $('.menu-header').hide();
  }

  function removeUserFromList(username){
    for(var i=0;i<$scope.users.length;i++){
      if($scope.users[i].userName == username){
        $scope.users.splice(i, 1);
        break;
      }
    }
  }

  $scope.acceptRequest = function(username){
    if(username == "")
      return;
    $http({
      url: URL + "/allowConnectionRequest",
      method: "POST",
      data:{
        'sessionString' : sessionString,
        'username': username
      }
    }).then(function success(response){
      if(response.status == 200 && response.data.status == "true"){
          removeUserFromList(username);
      }
      else{
        console.log(response.data.msg);
      }
    },
  function error(response){
    console.log(response.statusText);
  });
  };

  $scope.rejectRequest = function(username){
    if(username == "")
      return;
    $http({
      url: URL + "/rejectConnectionRequest",
      method: "POST",
      data:{
        'sessionString' : sessionString,
        'username': username
      }
    }).then(function success(response){
      if(response.status == 200 && response.data.status == "true"){
          removeUserFromList(username);
      }
      else{
        console.log(response.data.msg);
      }
    },
  function error(response){
    console.log(response.statusText);
  });
  };


  $scope.signOut = function() {
    $cookies.remove('username');
    $cookies.remove('userID');
    $cookies.remove('sessionString');
window.location.href="http://localhost/researchmate";
      var auth2 = gapi.auth2.getAuthInstance();
      auth2.signOut().then(function () {
        auth2.disconnect();
        console.log('User signed out.');

      });
    }


}]);
