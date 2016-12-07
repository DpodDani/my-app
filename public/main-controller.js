angular.module('myApp').controller('mainController', ['$scope', '$http', function($scope, $http) {

  $scope.startTime = moment().get('millisecond'); //488, 905, 349 => 581

  $http.get('/getMessage')
  .then(function(response) {
    //$scope.message = response.data;
    $scope.endTime = moment().get('millisecond'); //530, 957, 382 => 623
  });

  // time difference of 42 seconds (without async library)

}]);
