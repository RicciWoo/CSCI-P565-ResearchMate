myApp.controller("adminCtrl", ['$scope', '$http', 'URL',  function ($scope, $http, URL) {
   $scope.userDetails=[];
    $http({
        url: URL + "/getAllUsers",
        method: "POST"
    }).then(function success(response) {
        if (response.status == 200) {
            if (response.data.status == false && response.data.msg != undefined && response.data.msg != "") {
                console.log(response.data.users);
            }
            else {
                console.log(response.data.msg);
                $scope.users = response.data.msg.users;
                $scope.userInfos = response.data.msg.userInfos;
                for(var i=0;i<$scope.users.length;i++)
                {
                    if($scope.users[i].verificationNumber>0)
                    $scope.active=true;
                    else
                    $scope.active=false;

                     $scope.userDetails.push({
                         user:$scope.users[i],
                         userInfo:$scope.userInfos[i],
                         active:$scope.active
                     })


                }
                console.log($scope.userDetails)
            }
        }
    },
        function error(response) {

        }
        );

        $scope.activate = function(userName,index, $event)
        {
            var method = "/activateUser";
            if($event.target.value != "Activate")
                method = "/deActivateUser";
            $http({
                url: URL + method,
                method: "POST",
                data: {'username':userName}

            }).then(function success(response) {
                if (response.status == 200) {
                    if (response.data.status == "true") {
                      debugger
                        console.log(response.data.users);
                        if($event.target.value != "Activate")
                            $event.target.value = "Activate";
                        else
                          $event.target.value = "Deactivate";
                    }
                    else {
                        console.log(response.data.msg);

                    }
                }
            },
                function error(response) {

                }
                );
        }

}])
