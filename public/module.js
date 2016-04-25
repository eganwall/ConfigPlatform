var app = angular.module('ConfigApp', []).controller('ConfigController', function($scope, $http) 
{
    $scope.configs = [];
    $scope.filterString = '';

    $scope.loadConfigs = function() 
    {
        $http.get('/GetFullConfig')
            .success(function(data)
            {
                $scope.configs = data;
                console.log(data);
            }).error(function(err)
            {
                console.log('Error in LoadConfigs(): ' + err);
            });
    };

    // gets the template to ng-include for a table row / item
    $scope.getTemplate = function (config) 
    {
        if (config.id === $scope.configs.selected.id) return 'edit';
        else return 'display';
    };

    $scope.editConfig = function (config) 
    {
        $scope.configs.selected = angular.copy(config);
    };

    $scope.deleteConfig = function (config) 
    {
        console.log('Deleting config with ID ' + config.id);
        $http.delete('/DeleteConfig/' + config.id)
            .success(function(data)
            {
                $scope.configs = data;
                console.log('Successfully deleted config entry');
            }).error(function(err)
            {
                console.log('Error deleting config: ' + err);
            });
    };

    $scope.saveConfig = function (idx) 
    {
        console.log("Saving config...");
        $scope.configs.configs[idx] = angular.copy($scope.configs.selected);
        $scope.reset();

        $http.post('/AddConfig', $scope.configs.configs[idx])
            .success(function(data)
            {
                console.log('Success upating config.\n' + data);
                $scope.configs = data;
            }).error(function(err)
            {
                console.log('Error updating config.\n' + err);
            });
    };

    $scope.reset = function () 
    {
        $scope.configs.selected = {};
    };
});