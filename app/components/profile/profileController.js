

myApp.controller('profileController',function($scope,$http, $location, $cookies, $cookieStore) {
  var sessionString = $cookies.get('sessionString');
  console.log("gh");
  //sessionString = "zvBkd2m1QEy5UiIB";
  var url = $location.path().split('/');
  $scope.username = url[2];
  console.log($scope.username);
  $http({
        url: "http://silo.soic.indiana.edu:54545/getUserInfo",
        method: "POST",
        data: {
          'username':$scope.username,
      },

      }).then(function success(response){
        if(response.status==200){
          if(response.data.status=="false"){
            if(response.data.msg!="")
              alert(response.data.msg)
          }
          else{
            
            
           
            var userinfo = response.data.msg;
            console.log(userinfo);
            $scope.firstname = userinfo.user.firstName;
            $scope.lastname = userinfo.user.lastName;
            $scope.address = userinfo.userInfo.location.address != undefined && userinfo.userInfo.location.address.trim()!=""?userinfo.userInfo.location.address + ',':"";
            $scope.city = userinfo.userInfo.location.city != undefined && userinfo.userInfo.location.city.trim()!=""?userinfo.userInfo.location.city + ',':"";
            $scope.state = userinfo.userInfo.location.state;
            $scope.country = userinfo.userInfo.location.country;
          }
        }
      },
      function error(response){
        alert("Error occured while authenticating user");
      }
    );
}); //end of controller
