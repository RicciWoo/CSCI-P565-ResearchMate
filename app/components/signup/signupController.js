
myApp.controller('signupController',['$scope', '$http',function($scope,$http) {
 console.log("hello");
  $scope.submit = function(){
    debugger
    var firstname = $scope.fname;
    var lastname = $scope.lname;
    var email = $scope.email;
    var password = $scope.pwd;
    var username = $scope.username;

    $http({
      url: "http://silo.soic.indiana.edu:54545/signUp",
      method: "POST",
      data: {
        'username':username,
        'password':password,
        'email': email,
        'password': password
    },

  }).then(function success(response){
    debugger
      if(response.status==200){
        if(response.data.status=="false"){
          if(response.data.msg!="")
            alert(response.data.msg)
        }
        else{
          alert("User successfully created. Please verify your account");
        }
      }
    },
    function error(response){
      debugger
      alert("Error occured while authenticating user");
    }
  );
}
}]);
