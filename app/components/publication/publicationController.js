myApp.controller('publicationController',['$scope', '$http', '$location','$cookies','$cookieStore','URL', 'Upload', function ($scope, $http, $location, $cookies, $cookieStore,URL, Upload) {

$scope.sessionString = $cookies.get('sessionString');
$scope.username = $cookies.get('username');

$scope.uploadPublication = function($file){
  $scope.file = $file;

}
$scope.savePublication = function(){
/**
 * check if all the required values are provided
 */
var name = $scope.pubName;
var issn = $scope.pubIssn;
var abstract = $scope.abstract;
var journalName = $scope.journalName;
var pubDate = $scope.pubDate.toString();
var otherUsersStr = $scope.otherUsers;
var otherUsers = [];
if(otherUsersStr!=undefined && otherUsersStr.trim()!=""){
  var splittedArr = otherUsersStr.split(',');
  for(var i = 0; i<splittedArr.length;i++){
    if(splittedArr[i]!=undefined && splittedArr[i].trim()!="")
      otherUsers.push(splittedArr[i]);
  }
}
Upload.upload({
  url: 'http://silo.soic.indiana.edu:54545/uploadPaperPdf',
  file: $scope.file,
  data:
  {
    'username': $scope.username,
    'sessionString': $scope.sessionString,
    'name': name,
    'paperAbstract':abstract,
    'publishedAt': journalName,
    'publishDate': pubDate,
    'ISSN': issn,
    'otherUsernames': otherUsers
 },
}).progress(function(e){console.log("progress: " + e)}).then(function(data, status, headers, config){
  $location.path("/profile/"+$scope.username)
});

}


}]);
