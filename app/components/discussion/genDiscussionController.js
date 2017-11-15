myApp.controller('genDiscussionController',['$scope','$http','URL','$location',  '$cookieStore', '$cookies','$rootScope',function($scope,$http,URL,$location, $cookieStore, $cookies,$rootScope) {

$scope.tagArr = [];
$scope.username = $cookies.get("username");
$scope.sessionString = $cookies.get('sessionString');
$rootScope.loggedIn = true;
$http({
  url: URL + "/getUserGroups",
  method: "POST",
  data: {
    'username': $scope.username
  }
}).then(function (response){
  if(response.status == 200){
    if(response.data.status == "true" && response.data.msg!=undefined && response.data.msg.groupInfo != undefined){
      $scope.groupInfo = response.data.msg.groupInfo;
    }
  }
},
function error(response){

});

$scope.deleteTag = function(index){
  $scope.tagArr.splice(index, 1);
}

$scope.addTag = function(){
  var tag = $scope.txtTagInput;
  if(tag != undefined && tag.trim() != ""){
    $scope.tagArr.push(tag);
  }
}

$scope.addUserPost = function(){
  if($scope.postStr == undefined || $scope.postStr.trim() ==""){
    alert("Post string is required");
    return;
  }
  if($scope.groupID == undefined || $scope.groupID == "")
    $scope.groupID = -1;
  $http({
    url: URL + "/postQuestion",
    method: "POST",
    data: {
      'sessionString': $scope.sessionString,
      'tagArray' : $scope.tagArr,
      'postString': $scope.postStr,
      'groupID': $scope.groupID
    }
  }).then(function (response){
    if(response.status == 200){
      if(response.data.status == "true"){
          alert("Posted successfully!");
          $location.path("/discussion/-1");
      }
      else{
        console.log(response.data.msg);
      }
    }
  },
  function error(response){
      console.log(response.statusText);
  });


};



}]);
