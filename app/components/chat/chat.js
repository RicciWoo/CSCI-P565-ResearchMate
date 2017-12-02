myApp.controller('chatController', ['$scope', '$http', 'URL','$cookies','$location','chatService','$rootScope','$anchorScroll', function ($scope, $http, URL,$cookies,$location,chatService,$rootScope,$anchorScroll) {
    var self=$scope;

    var sessionString = $cookies.get('sessionString');
    $scope.username = $cookies.get('username');
    var socket = io("http://silo.soic.indiana.edu:54545/");
    $scope.messages = [];
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
    $scope.chatConfig = function(user, $event){

      self.to = user.username;
      self.from =$scope.username;
      $event.target.style.background = "#ccc";
    }

    self.data={
      "sender":$scope.username,
      "receiver":self.to,
      "message":"connection"
    }
    socket.emit('universal',self.data);

    socket.on('universal', function(data){
          $scope.messages.push({'side': 'receive', 'msg': data.message, 'date': new Date()});
          $scope.$apply();
      });

    $scope.sendMessage = function(){
      debugger
     // alert(self.data.sender);
      self.data={
        "sender":self.from,
        "receiver":self.to,
        "message":self.msg
      }
      socket.emit('universal',self.data);
      $scope.messages.push({'side': 'send', 'msg': self.msg, 'date': new Date()});
      self.msg ="";
     
      $location.hash('bottom');
       $anchorScroll();
      
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
