var redis = require('node-redis');
var subscriber = redis.createClient();
var jsonFile = require('jsonfile');

var file = 'lkgc.txt';

var configObj = {};
configObj.configs = [];

var APP_NAME = 'Consumer';


subscriber.on('message', function(channel, message)
{
	console.log('\n\nConfig updating...');
	var obj = JSON.parse(message);

	if(channel == 'consumer')
	{
		console.log('\nAdding/editing config key ' + obj.key + ' with ID ' + obj.id + '...');

		// overwrite an existing config if it's an edit
		configObj.configs.forEach(function(config, index)
		{
			if((config.id == obj.id) || (config.key.toLowerCase() == obj.key.toLowerCase()))
			{
				console.log('Replacing config...');
				configObj.configs.splice(index, 1);
			}
		});

		configObj.configs.push(obj);

		PrintPersonInfo();
	} else if(channel == 'consumer_DELETE')
	{
		console.log('\nDeleting config key with ID ' + obj.id + '...');

		// find the existing config key and delete it from the object
		configObj.configs.forEach(function(config, index)
		{
			if(config.id == obj.id)
			{
				console.log('Removing config...');
				configObj.configs.splice(index, 1);
			}
		});

		PrintPersonInfo();
	}
});

var ConfigValue = function(key, defaultValue)
{
	console.log('\nFetching local config value for key ' + key + '...');

	var returnValue = '';
	configObj.configs.forEach(function(config)
	{
		if(config.key.toLowerCase() == key.toLowerCase())
		{
			console.log('Returning value ' + config.value);
			returnValue = config.value;
		}
	});

	if(returnValue == '')
	{
		console.log('Config value not found for key ' + key + '! Returning default value ' + defaultValue);
		return defaultValue;
	} else
	{
		return returnValue;
	}
}

var LoadLKGC = function()
{
	jsonFile.readFile(file, function(err, obj)
	{
		if(err)
		{
			console.log('\nERROR READING LKGC:\n' + err);
		} else
		{
			console.log('\nRetrieving ' + APP_NAME + ' application keys from LKGC...')

			obj.configs.forEach(function(config)
			{
				if(config.application.toLowerCase() == APP_NAME.toLowerCase())
				{
					console.log('Retrieved key ' + APP_NAME + '.' + config.key);
					configObj.configs.push(config);
				}
			});
		}

		PrintPersonInfo();
	});
}

var PrintPersonInfo = function()
{
	if(configObj.configs.length < 1)
	{
		console.log('Config not loaded yet!');
	} else
	{
		var first = ConfigValue('firstName', 'dFirst');
		var middle = ConfigValue('middlename', 'dMiddle');
		var last = ConfigValue('LastName', 'dLast');
		var birthday = ConfigValue('Birthday', 'dBirthday');
		var food = ConfigValue('FavoriteFood', 'dFood');

		console.log('My name is %s %s %s, and my birthday is %s.', first, middle, last, birthday);
		console.log('My favorite food is %s.', food);
	}
}

// on startup, load the LKGC file into memory
LoadLKGC();

// subscribe to the "consumer" and "consumer_DELETE" message channels
subscriber.subscribe('consumer');
subscriber.subscribe('consumer_DELETE');

PrintPersonInfo();