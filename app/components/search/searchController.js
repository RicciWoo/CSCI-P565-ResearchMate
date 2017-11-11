myApp.controller('searchController', ['$scope', '$http', '$location', 'URL', '$cookieStore', '$cookies', function ($scope, $http, $location, URL, $cookieStore, $cookies) {
  var searchQuery = $location.search().searchStr;
  $scope.currentUsername = $cookies.get("username");
  var sessionString = $cookies.get("sessionString");
  if(searchQuery == undefined || searchQuery == "")
    return;
    $scope.userSearchResult = [];
  $http({
    url: URL+"/searchInput",
    method: "POST",
    data:{
      "searchString": searchQuery
    },
  }).then(function success(response){
    if(response.status == 200 && response.data!=undefined){
      //set user search object
      debugger
      if(response.data.publicsInfoResponse!=undefined && response.data.publicsInfoResponse.status == "true"){
        $scope.publicationSearchResult = response.data.publicsInfoResponse.msg.publicationInfo;
      }
      if(response.data.userSearch!=undefined && response.data.userSearch.status == "true"){
        $scope.userSearchResult = response.data.userSearch.msg;
      }
      else {
        console.log(response.data.userSearch.msg);
      }
      if(response.data.userInfoSearch!=undefined && response.data.userInfoSearch.status == "true"){
        for(var i=0;i<response.data.userInfoSearch.msg.length;i++)
        {
          $scope.userSearchResult.push(response.data.userInfoSearch.msg[i]);
        }
      }
      else {
        console.log(response.data.userSearch.msg);
      }

      if(response.data.groupSearch!=undefined && response.data.groupSearch.status == "true"){
        $scope.groupSearchResult = response.data.groupSearch.msg;
      }
      else{
        console.log(response.data.groupSearch.msg);
      }
      if(response.data.skillSearch!=undefined && response.data.skillSearch.status == "true"){
        $scope.skillSearchResult = response.data.skillSearch.msg;
      }
      else{
        console.log(response.data.skillSearch.msg);
      }

    }
  },
function error(response){

}
);

$scope.followUser = function(username){
  $http({
        url: "http://silo.soic.indiana.edu:54545/followSomeone",
        method: "POST",
        data: {
          'username':username,
          'sessionString': sessionString
      },

    }).then(function success(response){
      if(response.status == 200){
        if(response.data.status == false && response.data.msg!=undefined && response.data.msg!="")
          alert(response.data.msg);
        else{
          console.log("Followed Successfully");

        }
      }
    },
  function error(response){

  }
  );
};

}]);
