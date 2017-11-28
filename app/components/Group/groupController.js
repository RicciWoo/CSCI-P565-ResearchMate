myApp.controller('groupController', ['$scope', '$http', 'URL','$cookies','$location', function ($scope, $http, URL,$cookies,$location) {
    var self=$scope;
    var sessionString = $cookies.get('sessionString');
    var url = $location.path().split('/');
    if(url.length==3)
      self.username = url[2];
    else {
      self.username = $cookies.get('username');
    }
    $http({
        url: "http://silo.soic.indiana.edu:54545/getUserGroups",
        method: "POST",
        data: {
          'username':self.username,
          'sessionString': sessionString
      },

    }).then(function success(response){
      if(response.status == 200){
        if(response.data.status == false && response.data.msg!=undefined && response.data.msg!="")
          alert(response.data.msg);
        else{
            var groupInfo = response.data.msg.groupInfo
            var groupNames = []
            for(var i = 0; i<groupInfo.length;i++){
              groupNames.push(groupInfo[i].groupName)
            }
            $scope.groupNames = groupNames;

        }
      }
    },
    function error(response){

    }
    );

$scope.redirectAddGroup = function(){
  $location.path("/groups");
}

}]);
