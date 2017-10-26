myApp.controller('aboutmeController', ['$scope', '$http', 'URL','$cookies','$location', function ($scope, $http, URL,$cookies,$location) {
    var self = $scope;
    self.abc = "abc";
    self.allowedit=false;
    self.sessionString = $cookies.get('sessionString');
    
    var url = $location.path().split('/');
    $scope.username = url[2];
    $http({
        url: "http://silo.soic.indiana.edu:54545/getUserInfo",
        method: "POST",
        data: {
          'username':$scope.username ,
          'sessionstring': self.sessionString
      },
    }).then(function Success(response) {
      console.log();
      if(response.status==200)
      {
       var user = response.data.msg.user;
       var userInfo = response.data.msg.userInfo;
       self.firstname = user.firstName;
       self.lastname = user.lastName;
       self.address=userInfo.location.address;
       self.country=userInfo.location.country;
       self.state=userInfo.location.state;
       self.city=userInfo.location.city;
       self.university=userInfo.university;
       self.summary=userInfo.summary;
      }
      else
      console.error(response.status);
    }, function Error(response) {
        console.log(response);
    });
    self.edit=false;
   self.save= function(){
        self.edit=!self.edit;
        console.log(self.edit);
        console.log(self.sessionString);
        $http({
            url: "http://silo.soic.indiana.edu:54545/setUserInfo",
            method: "POST",
            data: {
                "firstname":self.firstname,
                "lastname":self.lastname,
                "sessionstring":self.sessionString,
                "address":self.address,
                "city":self.city,
                "state":self.state,
                "country":self.country,
                "dob":"03/09/1991",
                "primaryAdvisor":"HiteshKumar",
                "secondaryAdvisor":"RahulVelayutham",
                "picture":"location",
                "summary":self.summary
          },
        }).then(function Success(response) {
          console.log(response);
        });
    }
    
}]);