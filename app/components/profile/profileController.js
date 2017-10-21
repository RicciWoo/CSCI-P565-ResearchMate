

myApp.controller('profileController',function($scope,$http, $location, $cookies, $cookieStore) {
  var sessionString = $cookies.get('sessionString');
  debugger
  //sessionString = "zvBkd2m1QEy5UiIB";
  $http({
        url: "http://silo.soic.indiana.edu:48167/getUserInfo",
        method: "POST",
        data: {
          'sessionstring':sessionString,
      },

      }).then(function success(response){
        if(response.status==200){
          if(response.data.status=="false"){
            if(response.data.msg!="")
              alert(response.data.msg)
          }
          else{
            debugger
            var userinfo = response.data.msg;
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
