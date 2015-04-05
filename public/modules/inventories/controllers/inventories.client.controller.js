'use strict';

// Inventories controller
angular.module('inventories').controller('InventoriesController', ['$scope', '$http', '$timeout', '$stateParams', '$location', 'Authentication', 'Inventories',
	function($scope, $http, $timeout, $stateParams, $location, Authentication, Inventories) {
		$scope.authentication = Authentication;
		var timeout;
		
		// Create new Inventory
		$scope.create = function() {
			// Create new Inventory object
			var inventory = new Inventories ({
				// TODO: deal with the form data
				name: this.name,
				inv_code: this.inv_code,
				in_time: this.in_time,
				location: this.location
			});

			// Redirect after save
			inventory.$save(function(response) {
				$location.path('inventories/' + response._id);
				
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Remove existing Inventory
		$scope.remove = function(inventory) {
			if ( inventory ) { 
				inventory.$remove();

				for (var i in $scope.inventories) {
					if ($scope.inventories [i] === inventory) {
						$scope.inventories.splice(i, 1);
					}
				}
			} else {
				$scope.inventory.$remove(function() {
					$location.path('inventories');
				});
			}
		};

		// Update existing Inventory
		$scope.update = function() {
			var inventory = $scope.inventory;

			inventory.$update(function() {
				$location.path('inventories/' + inventory._id);
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Find a list of Inventories
		$scope.find = function() {
			// var books = Inventories.query();
			// for (var i = books.length - 1; i >= 0; i--) {
			// 	books[i].status = books[i].isRent ? '借出' : '可借';
			// };
			// console.log(books);
			$scope.inventories =  Inventories.query();

		};

		// Find existing Inventory
		$scope.findOne = function() {
			$scope.inventory = Inventories.get({ 
				inventoryId: $stateParams.inventoryId
			});
		};

		$scope.$watch('keyword', function (newKeyword) {
			if (newKeyword) {
				if (timeout) $timeout.cancel(timeout);
				timeout = $timeout(function () {
					$http({
						method: 'GET',
						url: '/inventories/name/' + newKeyword
					})
					.success(function (data, err) {
						$scope.inventories = data;
					});
				},850);
 			}
		});

		$scope.DoCtrlPagingAct = function (text, page, pageSize) {
			$scope.inventoriesWithPaging=[];
			var start = (page - 1) * pageSize;
			var end = page * pageSize - 1;
			for (var i = end; i >= start; i--) {
				$scope.inventoriesWithPaging.push($scope.inventories[i]);
			};

		};
	}
]);
