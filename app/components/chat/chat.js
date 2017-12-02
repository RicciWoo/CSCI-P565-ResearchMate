myApp.controller('chatController', ['$scope', '$http', 'URL','$cookies','$location','chatService','$rootScope', function ($scope, $http, URL,$cookies,$location,chatService,$rootScope) {
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
      self.toUserID = user.userID;
      self.from =$scope.username;
      self.fromUserID = $cookies.get('userID');
      $('.user-list, .user-list div').removeClass('activeRow')
      $($event.target).parent().addClass('activeRow');
      /**
       * Function to get past messages from backend
       */
       $scope.pastMessages = [];
       $http({
         url: URL + "/getMessagesFromAUser",
         method: "POST",
         data:{
           'sessionString': sessionString,
           'username': user.username
         }
       }).then(function success(response){
         if(response.status == 200 && response.data.status == "true"){
           var conversations = response.data.msg.conversation;
           conversations.sort(function(a, b) {
              return a.sentOn>b.sentOn;
          });

           for(var i=0;i<conversations.length;i++){
             if(conversations[i].senderID == self.fromUserID)
                $scope.pastMessages.push({'side': 'send', 'msg': conversations[i].msg, 'date':  conversations[i].sentOn});
            else{
              $scope.pastMessages.push({'side': 'receive', 'msg':  conversations[i].msg, 'date':  conversations[i].sentOn});
            }
           }
         }
         else{
           console.log(response.data.msg);
         }
       },
     function error(response){
       console.log(response.statusText);
     });
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
          console.log(response.data.msg);
        else{
          debugger
          self.followerInfo = response.data.msg.userInfo;

        }
      }
    },
    function error(response){

    }
    );


}])
