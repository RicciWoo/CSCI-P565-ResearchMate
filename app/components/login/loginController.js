myApp.controller('loginController', ['$scope', '$http', '$location','$cookies','$cookieStore','URL', function ($scope, $http, $location, $cookies, $cookieStore,URL) {
  var self = $scope;

  $scope.submit = function () {
    var username = self.username;
    var password = self.pwd;
    $http({
      url: URL+"/login",
      method: "POST",
      data: {
        'username': username,
        'password': password
      },

    }).then(function success(response) {
      if (response.status == 200) {
        if (response.data.status == "false") {
          if (response.data.msg != "")
            alert(response.data.msg);
        }
        else {
          $cookies.remove('sessionString');
          $cookies.put('sessionString', response.data.msg)
          $location.path('/profile');
        }
      }
    },
      function error(response) {
        alert("Error occured while authenticating user");
      }
      );


  }
  /**
   * [sendUsername Function that accepts email address and sends username if authentic user]
   * @type {[Useremail]}
   */
  $scope.sendUsername = function () {

    var email = $scope.useremail;
    if (email.trim() != "") {
      $http({
        url: URL+"/forgetUsername",
        method: "POST",
        data: {
          'email': email,
        },

      }).then(function success(response) {

        if (response.status == 200) {
          if (response.data.status == "false") {
            if (response.data.msg != "")
              alert(response.data.msg);
          }
          else {
            alert("Please check your email for username")
          }
        }
      },
        function error(response) {

          alert("Error occured while sending username");
        }
        );
    }
    else {
      alert("Please enter email address");
    }
  };

  /**
   * [sendPassword Function that accepts either email or username and sends password reset link to user]
   * @type {[type]}
   */
  $scope.sendPassword = function () {

    var username = $scope.pwdusername.trim();

    console.log("send password");


      $http({
        url: URL+"/forgetPassword",
        method: "POST",
        data: {
          'input': username,
        },

      }).then(function success(response) {
        if (response.status == 200) {
          if (response.data.status == "false") {
            if (response.data.msg != "")
              alert(response.data.msg)
          }
          else {
            alert("Please check your email to reset your password")
          }
        }
      },
        function error(response) {
          alert("Error occured while sending password");
        }
        );


  };

  $scope.redirectSignup = function(){

    $location.path('/signup');
  } // end of redirectSignup fucntion
    /**
   * [updatePassword Function to update the password]
   * @type {[type]}
   */
  $scope.updatePassword = function () {
    var password = $scope.password.trim();
    var repassword = $scope.repassword.trim();
    var sessionStr = $location.search().sessionstring;
    if (sessionStr == undefined || sessionStr.trim() == "") {
      alert("Unable to get session string");
      return;
    }
    if (password != "" && repassword != "") {
      if (password == repassword) {
        $http({
          url: URL+"/updatePassword",
          method: "POST",
          data: {
            'sessionString': sessionString,
            'password': password
          },

        }).then(function success(response) {
          if (response.status == 200) {
            if (response.data.status == "false") {
              if (response.data.msg != "")
                alert(response.data.msg)
            }
            else {
              alert("Please check your email to reset your password")
            }
          }
        },
          function error(response) {
            alert("Error occured while updating password");
          }
          );
      }
      else {
        alert("Password does not match");
      }
    }
    else {
      alert("Please enter password");
    }
  }
  $scope.verifyUser = function () {
    var username = $scope.verUsername.trim();
    var verificationNumber = $scope.verNumber.trim();
    if (username == "") {
      alert("Please provide username");
      return;
    }
    if (verificationNumber == "") {
      alert("Please provide verification number");
      return;
    }
    // if all required inputs are given, hit post call
    $http({
      url: URL+"/verifyUser",
      method: "POST",
      data: {
        'username': username,
        'verificationNumber': verificationNumber
      },

    }).then(function success(response) {
      if (response.status == 200) {
        if (response.data.status == "false") {
          if (response.data.msg != "")
            alert(response.data.msg)
        }
        else {
          alert("Account verified successfully");
          $location.path('/');
        }
      }
    },
      function error(response) {
        alert("Error occured while updating password");
      }
      );



  };
}]);
