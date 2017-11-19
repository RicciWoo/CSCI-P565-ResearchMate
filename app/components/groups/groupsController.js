myApp.controller('groupsController',['$scope','$http','URL','$location', '$cookies', '$cookieStore','$rootScope',function($scope,$http,URL,$location, $cookies, $cookieStore,$rootScope) {
  $http({
    url: URL+"/getAllGroups",
    method: "POST",
    data:{},
  }).then(function success(response){

    $scope.groupInfo = response.data.msg.groupInfo;
  },
function error(response){
});
$scope.userGroupID = []
$scope.username = $cookies.get('username');
$scope.sessionString = $cookies.get('sessionString');
$rootScope.loggedIn = true;
$http({
  url: URL+"/getUserGroups",
  method: "POST",
  data:{'username': $scope.username},
}).then(function success(response){
  if(response.status == 200){
    if(response.data.status == "true" && response.data.msg.groupInfo!=undefined){
      var grpInfo = response.data.msg.groupInfo;
      for(var i = 0;i<grpInfo.length;i++){
        $scope.userGroupID.push(grpInfo[i].groupID);
      }
    }
  }
  else{
    console.log("Error encountered while getting user groups");
  }
},
function error(response){

});

$scope.addNewGroup = function(){
  $http({
    url: URL+"/createGroup",
    method: "POST",
    data:{'sessionString': $scope.sessionString, 'groupname': $scope.newGroupName},
  }).then(function success(response){
    if(response.status == 200){
      if(response.data.status == "true" && response.data.msg == "group entry added."){
        alert(response.data.msg)
      }
      else{
        window.location.reload();
      }
    }
    else{
      alert("Error encountered while joining the group. Please try again!")
    }
  },
  function error(response){
  });
}

  $scope.joinGroup = function(event, groupID, isPrivate){
    if(event.currentTarget.value == "Joined" || event.currentTarget.value == "Requested")
      return; //user is already in the group.
      var method = "setUserGroup";
      if(isPrivate){
        method = "joinPrivateGroup"
      }
      $http({
        url: URL+"/"+method,
        method: "POST",
        data:{'sessionString': $scope.sessionString, 'groupID': groupID},
      }).then(function success(response){
        if(response.status == 200){
          if(response.data.status == "true"){
            if(isPrivate)
              event.target.value = "Requested"
            else
              event.target.value = "Joined"
          }
          else{
            alert(response.data.msg);
          }
        }
        else{
          alert("Error encountered while joining the group. Please try again!")
        }
      },
      function error(response){
      });
  }

}]);
