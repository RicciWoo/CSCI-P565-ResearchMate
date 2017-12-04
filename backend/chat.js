myApp.controller('chatController', ['$scope', '$http', 'URL','$cookies','$location','chatService','$rootScope', function ($scope, $http, URL,$cookies,$location,chatService,$rootScope) {
    var self=$scope;
    var url = $location.path().split('/');
    $scope.username = url[2];
    var sessionString = $cookies.get('sessionString');
    $scope.sessionString =chatService.getSessionString();
    console.log(sessionString );
    console.log($scope.username);
    var socket = io("http://silo.soic.indiana.edu:54545/");
   
    console.log(socket);
    $http({
        url: "http://silo.soic.indiana.edu:54545/getMyCircle",
        method: "POST",
        data: {
          'sessionString':sessionString,
          
      },

    }).then(function success(response){
      if(response.status == 200){
        if(response.data.status == false && response.data.msg!=undefined && response.data.msg!="")
        {  alert(response.data.msg);
        }
        else{
           console.log(response.data);

        }
      }
    },
    function error(response){

    }
    );
    $scope.chatConfig = function(user){
      self.to = "test 1";
      self.from ="test 2";
      self.msg = "test";
      self.chatRoom=self.from+self.to ; 
      $http({
        url: "http://silo.soic.indiana.edu:54545/chatConnect",
        method: "POST",
        data: {
          'sender':self.from,
           'receiver':self.to
      },

    }).then(function success(response){
      if(response.status == 200){
        if(response.data.status == false && response.data.msg!=undefined && response.data.msg!="")
        {  alert(response.data.msg);
        }
        else{
           console.log(response.data);

        }
      }
    },
    function error(response){

    }
    );
     
  
    }

    
    $scope.sendMessage = function(){
      alert(self.chatRoom+" "+self.msg);
      socket.emit('abc',self.msg);
    }
    $http({
        url: "http://silo.soic.indiana.edu:54545/getUserFollowers",
        method: "POST",
        data: {
          'username':$scope.username,
          'sessionString': sessionString
      },

    }).then(function success(response){
      if(response.status == 200){
        if(response.data.status == false && response.data.msg!=undefined && response.data.msg!="")
          alert(response.data.msg);
        else{
          self.followerInfo = response.data.msg.userInfo;
          
        }
      }
    },
    function error(response){

    }
    );
}])