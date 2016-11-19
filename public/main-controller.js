angular.module('myApp').controller('mainController', ['$scope', '$http', function($scope, $http) {

    $scope.message = 'Hello World';

    /*$http({
	method: 'GET',
	url: '/getMessage'
    }).then(function success(response) {
	$scope.message = response.data;
    }, function error(response) {
	$scope.message = response.statusText;
    });*/

    $http.get('/getMessage')
    .then(function(response) {
		$scope.message = response.data;
		console.log($scope.message);
    });

}]);
