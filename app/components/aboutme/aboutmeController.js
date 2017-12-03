myApp.controller('aboutmeController', ['$scope', '$http', 'URL','$cookies','$location', 'Upload','$rootScope', function ($scope, $http, URL,$cookies,$location, Upload,$rootScope) {

    var self = $scope;
    self.allowedit=false;
    self.sessionString = $cookies.get('sessionString');
    /**
     * Get user bullet-in board data
     */
     $scope.redditBullets = [];

     $scope.searchRedditForPost = function(searchQuery){
       if(searchQuery == undefined || searchQuery.trim() == "")
         return;
       $http({
         url: "https://www.reddit.com/search.json?q="+searchQuery+"&sort=hot",
         method: "GET"
       }).then(function success(response){

         if(response.status == 200){
           if(response.data != undefined && response.data.data!=undefined && response.data.data.children != undefined){

             $scope.redditBullets = $scope.redditBullets.concat(response.data.data.children);
           }
         }
       },
     function error(response){
    debugger
     });
     };


    $scope.getUserBulletinBoard = function(){
      $http({
        url: URL + "/getUserBulletinBoard",
        method: "POST",
        data:{
          'sessionString': self.sessionString
        }
      }).then(function success(response){
        if(response.status == 200){
          if(response.data.status == "true"){
            $scope.bulletinPosts = response.data.msg.posts;
            $scope.userInterests = response.data.msg.tagNames;
            for(var i=0;i<$scope.userInterests.length;i++){
              $scope.searchRedditForPost($scope.userInterests[i]);
            }
          }
        }
      },
      function error(response){
        console.log(response.data.msg);
      });


    }


    $scope.uploadProfilePic = function($file){
      if($scope.allowEdit==true)
      {
      Upload.upload({
        url: 'http://silo.soic.indiana.edu:54545/uploadProfilePic',
        file: $file,
        data:{'username': $scope.username},
      }).progress(function(e){}).then(function(data, status, headers, config){

      });
    }
    else
    {
      alert("you do not have permission!");
    }
    }

    var url = $location.path().split('/');
    if(url.length==3 && url[2]!="")
      $scope.username = url[2];
    else {
      $scope.username = $cookies.get('username');
    }
    $scope.followUser = function ($event) {
      $http({
        url: URL + "/sendRequest",
        method: "POST",
        data: {
          'username': $scope.username,
          'sessionString': $scope.sessionString
        },
      }).then(function success(response) {
        if (response.status == 200) {
          if (response.data.status == false && response.data.msg != undefined && response.data.msg != "")
            console.log(response.data.msg);
          else {
            $event.target.value = "Request sent"
          }
        }
      },
        function error(response) {

        }
        );
    }
    $http({
          url: "http://silo.soic.indiana.edu:54545/getUserInfo",
          method: "POST",
          data: {
            'username':$scope.username,
            'sessionstring': self.sessionString
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

              if(sessString!=undefined && sessString!="" && sessString == self.sessionString)
                {
                  $scope.allowEdit = true;
                  $scope.getUserBulletinBoard();
                }
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
              $scope.university = userinfo.userInfo.university;
              if(userinfo.userInfo.picture!="" && userinfo.userInfo.picture!="http://silo.soic.indiana.edu:54545/public/userIcon.jpg"){
                $scope.imgLocation = userinfo.userInfo.picture;
              }
              $scope.dob = new Date(userinfo.userInfo.dob).toLocaleDateString("en");
              console.log(userinfo);
            }
          }
        },
        function error(response){
          alert("Error occured while authenticating user");
        }
      );
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

                "university": self.university,
                "summary":self.summary
          },
        }).then(function Success(response) {
          console.log(response);
        });
    }





}]);
