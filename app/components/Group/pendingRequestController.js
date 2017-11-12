myApp.controller('groupPendingController', ['$scope', '$http', '$location','$cookies','$cookieStore','URL','$rootScope', function ($scope, $http, $location, $cookies, $cookieStore,URL,$rootScope) {
  var sessionString = $cookies.get("sessionString");
  debugger
  var username = $cookies.get("username");
  var url = $location.path().split('/');
  if(url.length<3)
    return;
  var groupID = url[2]
  $http({
    url: URL + "/getPendingRequests",
    method: "POST",
    data:{
      'sessionString': sessionString,
      'groupID': groupID
    }
  }).then(function success(response){
    if(response.status == 200){
      if(response.data.status == "true" && response.data.msg!=undefined){
        if(response.data.msg.requesters != undefined){
          $scope.userInfo = response.data.msg.requesters;
        }
      }
    }
  },
function error(response){

}
);


$scope.approveRequest = function(userID){
  $http({
    url: URL + "/approveGroupRequests",
    method: "POST",
    data:{
      "userID": userID,
      "groupID": groupID
    }
  }).then(function success(response){
    debugger
  },
function error(response){

});
};

}]);
