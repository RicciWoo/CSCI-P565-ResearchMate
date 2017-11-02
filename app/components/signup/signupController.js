
myApp.controller('signupController',['$scope','$http','URL','$location',function($scope,$http,URL,$location) {

  $scope.options = {
    width:40,
    longtitle:true,
    'onsuccess': function(response) {
      var profile = response.getBasicProfile();
      var username = profile.getEmail().replace("@gmail.com","");
      var password = "googlepassword";
      var email = profile.getEmail();
      var firstname = profile.getGivenName();
      var lastname = profile.getFamilyName();
      signUpUser(firstname,lastname, email, password, username);
    }
  }



  $scope.submit = function(){

    var firstname = $scope.fname;
    var lastname = $scope.lname;
    var email = $scope.email;
    var password = $scope.pwd;
    var username = $scope.username;
    signUpUser(firstname, lastname, email, password, username);

}


function signUpUser(firstname, lastname, email, password, username){
  $http({
    url: URL+"/signUp",
    method: "POST",
    data: {
      'username':username,
      'password':password,
      'email': email,
      'firstname':firstname,
      'lastname':lastname
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
        $location.path('/verifyuser');
      }
    }
  },
  function error(response){
    debugger
    console.log("Error occured while authenticating user");
  }
);
}

}]);



// myApp.directive('googleSignInButton', function() {
//   return {
//     scope: {
//       buttonId: '@',
//       options: '&'
//     },
//     template: '<div></div>',
//     link: function(scope, element, attrs) {
//       var div = element.find('div')[0];
//       div.id = attrs.buttonId;
//       gapi.signin2.render(div.id, scope.options()); //render a google button, first argument is an id, second options
//     }
//   };
// });
