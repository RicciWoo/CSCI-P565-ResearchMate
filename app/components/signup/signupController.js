
myApp.controller('signupController',['$scope','$http','URL','$location',function($scope,$http,URL,$location) {

$scope.providerList = [{"name":"At&t", "value":"att"},{"name":"Sprint", "value":"sprint"}, {"name":"T-Mobile", "value":"t-mobile"},{"name":"Verizon", "value":"verizon"}]

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
      var phone = $scope.phone;
      var carrier = $scope.carrier;
      if($scope.validInput)
        signUpUser(firstname,lastname, email, password, username, phone, carrier);
    }
  }
$scope.validInput = false;
$scope.checkGoogleSignup=function(){
  var phone = $scope.phone;
  var carrier = $scope.carrier;
  var msg = "";
  if(phone == undefined || phone == ""){
    msg += "Please provide phone number\n";
  }
  if(carrier == undefined || carrier == ""){
    msg += "Please select a carrier";
  }
  if(msg!=""){
    $scope.validInput = false;
    alert(msg);
  }
  else{
    $scope.validInput = true;
  }
}

  $scope.submit = function(){
    if($scope.signupForm.$invalid){
      alert("Some of the fields are incorrect. Please check info icon aside fields for more info");
      return;
    }
    var firstname = $scope.fname;
    var lastname = $scope.lname;
    var email = $scope.email;
    var password = $scope.pwd;
    var username = $scope.username;
    var phone = $scope.phone;
    var carrier = $scope.carrier;

    signUpUser(firstname, lastname, email, password, username, phone, carrier);

}


function signUpUser(firstname, lastname, email, password, username, phone, carrier){
  $http({
    url: URL+"/signUp",
    method: "POST",
    data: {
      'username':username,
      'password':password,
      'email': email,
      'firstname':firstname,
      'lastname':lastname,
      'phone': phone,
      'carrier': carrier
  },

}).then(function success(response){

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
