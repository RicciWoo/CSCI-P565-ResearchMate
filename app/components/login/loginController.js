myApp.controller('loginController', ['$scope', '$http', '$location','$cookies','$cookieStore', function ($scope, $http, $location, $cookies, $cookieStore) {
  var self = $scope;

  $scope.submit = function () {
    var username = self.username;
    var password = self.pwd;
    $http({
      url: "http://silo.soic.indiana.edu:54545/login",
      method: "POST",
      data: {
        'username': username,
        'password': password
      },

    }).then(function success(response) {
      if (response.status == 200) {
        if (response.data.status == "false") {
          if (response.data.msg != "")
            alert(response.data.msg)
        }
        else {
         // $cookies.put('sessionString', response.data.msg)
          $location.path('/profile');
        }
      }
    },
      function error(response) {
        alert("Error occured while authenticating user");
      }
      );
  }
  $scope.redirectSignup = function(){
    console.log("gj");
    $location.path('/signup');
  } // end of redirectSignup fucntion

}]);

