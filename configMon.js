var redis = require('node-redis');
var subscriber = redis.createClient();
var jsonFile = require('jsonfile');
var request = require('request');

var configObj = {};
configObj.configs = [];

var file = 'LKGC.txt';

subscriber.on('connect', function()
{
	console.log('ConfigMon Redis connection established!');
});

// on startup, load the entire config from the config platform
request('http://localhost:8000/GetFullConfig', function (error, response, body) 
{
    if (!error && response.statusCode == 200) 
    {
        console.log('\nGetting full config from ConfigPlatform...');
        configObj = JSON.parse(body);
        WriteLKGC();
    }
});

subscriber.on('message', function(channel, message)
{
	// parse the JSON string as an object so we can work with it
	var obj = JSON.parse(message);

	if(channel == 'master')
	{
		console.log('\nAdding/editing config key with ID ' + obj.id + '...');

		// overwrite an existing config if it's an edit
		configObj.configs.forEach(function(config, index)
		{
			if((config.id == obj.id) || ((config.key.toLowerCase() == obj.key.toLowerCase()) && 
				config.application.toLowerCase() == obj.application.toLowerCase()))
			{
				console.log('Replacing config...');
				configObj.configs.splice(index, 1);
			}
		});

		configObj.configs.push(obj);

	} else if(channel == 'master_DELETE')
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
	}

	WriteLKGC();
});

subscriber.subscribe('master');
subscriber.subscribe('master_DELETE');

var WriteLKGC = function()
{
	console.log('\nWriting LKGC file with contents:\n' + JSON.stringify(configObj));
	jsonFile.writeFile(file, configObj, function (err) 
	{
		if(err) console.error(err);
	});
}