myApp.controller('displayDiscussionController',['$scope','$http','URL','$location',  '$cookieStore', '$cookies','$rootScope',function($scope,$http,URL,$location, $cookieStore, $cookies, $rootScope) {
$rootScope.loggedIn = true;
$scope.displayPosts = function(groupID){
  $http({
    url: URL+"/getAllPostsByGroupID",
    method: "POST",
    data:{"groupID": groupID}
  }).then(function success(response){
    if(response.status==200){
      if(response.data.status=="true"){
        var userInfo = [];
        var data=response.data.msg;
        for(var i=0;i<data.userInfo.length;i++){
          userInfo[data.userInfo[i].userID] = data.userInfo[i]
        }
        $scope.userInfo = userInfo;
        $scope.postInfo = data.postInfo;
      }
    }
    else{
      console.log(response.statusText);
    }
  },
function error(response){

});
};
var url = $location.path().split('/');
var groupID = url[2];
var sessionString = $cookies.get("sessionString");
var username = $cookies.get('username');
if(groupID == -1){
  $scope.displayPosts(groupID);
}
else{
  $http({
      url: "http://silo.soic.indiana.edu:54545/getUserGroups",
      method: "POST",
      data: {
        'username':username,
        'sessionString': sessionString
    },

  }).then(function success(response){
    if(response.status == 200){
      if(response.data.status == "false" && response.data.msg!=undefined && response.data.msg!="")
        alert(response.data.msg);
      else{
        debugger
          if(response.data.msg!=undefined && response.data.msg.groupInfo!=undefined){
            for(var i=0;i<response.data.msg.groupInfo.length;i++){
              if(response.data.msg.groupInfo[i].groupID == groupID){
                $scope.displayPosts(groupID);
                return;
              }
            }
            alert("You are not a part of the group");
          }

      }
    }
  },
  function error(response){

  }
  );
}

}]);
