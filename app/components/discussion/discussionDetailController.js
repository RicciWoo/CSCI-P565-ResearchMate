myApp.controller('discussionDetailContainer',['$scope','$http','URL','$location',  '$cookieStore', '$cookies','$rootScope',function($scope,$http,URL,$location, $cookieStore, $cookies, $rootScope) {
  var url = $location.path().split('/');
  var sessionString = $cookies.get("sessionString");
  $rootScope.loggedIn = true;
  if(url.length<4){
    alert("Invalid parameters in URL");
    return;
  }

  var groupID = url[2];
  var postID = url[3];
  if(groupID == undefined || groupID ==""){
    alert("Invalid parameters in URL");
    return;
  }
  $scope.displayGroupPost = function(postID){
    $http({
      url: URL + "/getAllRepliesByPostID",
      method: "POST",
      data:{"postID":postID}
    }).then(function success(response){
      if(response.status == 200){
        if(response.data.status == "true" && response.data.msg != undefined){
          var userInfo = [];
          var resp = response.data.msg;
          if(Object.prototype.toString.call(response.data.msg.allUsers) == "[object Object]")
              resp.allUsers = [resp.allUsers];
          for(var i=0;i<resp.allUsers.length;i++){
            userInfo[resp.allUsers[i].userID] = resp.allUsers[i]
          }
          $scope.userInfo = userInfo;
          $scope.postInfo = response.data.msg.postInfo;
          $scope.replyInfo = resp.allRepliesInfo;
        }
        else{
          console.log("Message undefined for response: "+response.data.msg);
        }
      }
      else{
        console.log(response.statusText);
      }
    },

  function error(response){
    console.log(response.statusText);
  });
  };
  if(postID == undefined || postID ==""){
    alert("Invalid parameters in URL");
    return;
  }
  $scope.displayGroupPost(postID);
  if(groupID != -1){

  }

$scope.postComment = function(){
  var replyStr = $scope.replyString;
  if(replyStr == undefined || replyStr.trim()==""){
    alert("Reply text cannot be blank");
    return;
  }
  $http({
    url: URL + "/postReply",
    method: "POST",
    data:{
      "sessionString": sessionString,
      "replyString": replyStr,
      "postID": $scope.postInfo.postID
    }
  }).then(function success(response){
    if(response.status == 200){
      if(response.data.status == "true"){
        window.location.reload();
      }
      else{
        console.log(response.data.msg);
      }
    }
  },
function error(response){

}
);;
};




}]);
