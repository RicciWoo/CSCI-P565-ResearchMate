myApp.controller('addGroupController', ['$scope', '$http', '$location','$cookies','$cookieStore','URL','$rootScope', function ($scope, $http, $location, $cookies, $cookieStore,URL,$rootScope) {

  var sessionString = $cookies.get("sessionString");
  var username = $cookies.get("username");
  if(sessionString!=undefined && sessionString!=""){
    $rootScope.allowEdit = true;
  }

$scope.createGroup = function(){
  var groupName = $scope.groupName;
  var isPrivate = $scope.isPrivate;
  if(groupName == undefined || groupName.trim()==""){
    alert("Group name is required");
    return;
  }
  if(isPrivate == "" || isPrivate == ""){
    alert("Please select group access: Private/Public");
    return;
  }
  $http({
    url: URL+"/createGroup",
    method: "POST",
    data:
    {
      'sessionString': sessionString,
     'groupname': groupName,
     'description': $scope.groupDescription,
     'isPrivate': parseInt(isPrivate)
   },
  }).then(function success(response){
    if(response.status == 200){
      if(response.data.status == "true"){
        $location.path('/groups');
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
