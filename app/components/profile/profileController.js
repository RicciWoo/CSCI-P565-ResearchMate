

myApp.controller('profileController',function($scope,$http, $location, $cookies, $cookieStore) {
  var sessionString = $cookies.get('sessionString');
  var url = $location.path().split('/');
  $scope.username = url[2];
  $scope.edit=false;
  $scope.icon="fa fa-pencil-square-o btnEdit"
  
  $scope.editProfile=function(){
    
    $scope.edit=!$scope.edit;
    if($scope.edit)
    $scope.icon="fa fa-floppy-o btnEdit"
    else
    $scope.icon="fa fa-pencil-square-o btnEdit"
  }
  $http({
        url: "http://silo.soic.indiana.edu:54545/getUserInfo",
        method: "POST",
        data: {
          'username':$scope.username,
          'sessionstring': sessionString
      },

      }).then(function success(response){
        if(response.status==200){
          if(response.data.status=="false"){
            if(response.data.msg!="")
              alert(response.data.msg)
          }
          else{



            var userinfo = response.data.msg;
            var sessString = userinfo.user.sessionString;

            if(sessString!=undefined && sessString!="" && sessString == sessionString)
              $scope.allowEdit = true;
            else {
              $scope.allowEdit = false;
            }
            console.log(userinfo);
            $scope.firstname = userinfo.user.firstName;
            $scope.lastname = userinfo.user.lastName;
            $scope.name=$scope.firstname+" "+$scope.lastname;
            $scope.imgLocation = "http://simpleicon.com/wp-content/uploads/user1.png";
            $scope.address = userinfo.userInfo.location.address != undefined && userinfo.userInfo.location.address.trim()!=""?userinfo.userInfo.location.address + ',':"";
            $scope.city = userinfo.userInfo.location.city != undefined && userinfo.userInfo.location.city.trim()!=""?userinfo.userInfo.location.city + ',':"";
            $scope.state = userinfo.userInfo.location.state;
            $scope.country = userinfo.userInfo.location.country;
            $scope.summary =  userinfo.userInfo.summary;
            console.log(userinfo);
          }
        }
      },
      function error(response){
        alert("Error occured while authenticating user");
      }
    );
}); //end of controller
