var express = require('express');
var app = express();
var http = require('http');
var server = http.createServer(app);
var bodyParser = require('body-parser');
var redis = require('node-redis');
var client = redis.createClient();
var publisher = redis.createClient();
var jsonFile = require('jsonfile');

var configObj = {};
var testConfigObj = {};
configObj.configs = [];
testConfigObj.configs = [];

var file = 'LKGC.txt';

client.on('connect', function() 
{
    console.log('Connected to Redis!');

    client.hvals('config', function(err, object)
	{
		if(err) console.log('\nError getting config from Redis: ' + err);
		else
		{
			console.log('Retrieving and building config state');
		    console.log('----------------------------------------');

			object.forEach(function(item)
			{
				console.log('\nRetrieved item from Redis: ' + item);
				configObj.configs.push(JSON.parse(item));
			});
		}

		console.log('Successfully built config object!\n');
	});

	client.hvals('testConfig', function(err, object)
	{
		if(err) console.log('\nError getting test config from Redis: ' + err);
		else
		{
			console.log('Retrieving and building test config state');
		    console.log('----------------------------------------');

			object.forEach(function(item)
			{
				console.log('\nRetrieved item from Redis: ' + item);
				testConfigObj.configs.push(JSON.parse(item));
			});
		}

		console.log('Successfully built test config object!');
	});
});

// parse application/json
app.use(bodyParser.json())

app.use(bodyParser.urlencoded({ extended: true }));

app.use('/', express.static(__dirname + '/public'));

app.post('/AddConfig', function(req, res)
{
	// get the new config key/val
	var objString = JSON.stringify(req.body);
	var obj = JSON.parse(objString);
	console.log('Request: ' + req.body);

	// add it to the local list so we can make sure the LKGC is updated
	configObj.configs.forEach(function(config, index)
	{
		if((config.id == obj.id) || ((config.key.toLowerCase() == obj.key.toLowerCase()) && 
			config.application.toLowerCase() == obj.application.toLowerCase()))
		{
			console.log('Replacing config');
			configObj.configs.splice(index, 1);

			client.hdel('config', config.id);
		}
	});

	client.hmset('config', obj.id, JSON.stringify(obj));
	console.log('\nWriting object: ' + JSON.stringify(obj));

	configObj.configs.push(obj);

	console.log('\nPublishing message on master channel...');
	publisher.publish('master', JSON.stringify(obj));

	res.json(configObj);
});

app.post('/AddTestConfig', function(req, res)
{
	console.log('Current test config state is :');
	console.log(JSON.stringify(testConfigObj));

	// get the new config key/val
	var objString = JSON.stringify(req.body);
	var obj = JSON.parse(objString);

	// add it to the local list so we can make sure the LKGC is updated
	testConfigObj.configs.forEach(function(config, index)
	{
		if((config.id == obj.id) || ((config.key.toLowerCase() == obj.key.toLowerCase()) && 
			config.application.toLowerCase() == obj.application.toLowerCase()))
		{
			console.log('Replacing test config');
			testConfigObj.configs.splice(index, 1);

			client.hdel('testConfig', config.id);
		}
	});

	client.hmset('testConfig', obj.id, JSON.stringify(obj));
	console.log('\nWriting object: ' + JSON.stringify(obj));

	testConfigObj.configs.push(obj);

	res.json(testConfigObj);
});

app.get('/GetFullConfig', function(req, res)
{
	if(configObj !== {})
	{
		configObj.selected = {};
		console.log('\nSending config object:\n' + JSON.stringify(configObj));
		res.json(configObj);
	} else
	{
		console.log('\nERROR: no Redis connection!');
		res.send('ERROR: no Redis connection!');
	}
});

app.get('/GetTestConfig', function(req, res)
{
	if(testConfigObj !== {})
	{
		testConfigObj.selected = {};
		console.log('\nSending test config object:\n' + JSON.stringify(testConfigObj));
		res.json(testConfigObj);
	} else
	{
		console.log('\nERROR: no Redis connection!');
		res.send('ERROR: no Redis connection!');
	}
});

app.delete('/DeleteConfig/:id', function(req, res)
{
	console.log('Deleting config with ID ' + req.params.id);
	client.hdel('config', req.params.id, function(result)
	{
		configObj.configs.forEach(function(config, index)
		{
			if(config.id == req.params.id)
			{
				console.log('Removing config with ID ' + config.id);
				var deleted = configObj.configs.splice(index, 1);

				console.log('\nPublishing DELETE message master_DELETE channel...');
				publisher.publish('master_DELETE', JSON.stringify(deleted[0]));
			}
		});

		configObj.selected = {}

		res.json(configObj);
	});
});

app.delete('/DeleteTestConfig/:id', function(req, res)
{
	console.log('Deleting test config with ID ' + req.params.id);
	client.hdel('testConfig', req.params.id, function(result)
	{
		testConfigObj.configs.forEach(function(config, index)
		{
			if(config.id == req.params.id)
			{
				console.log('Removing test config with ID ' + config.id);
				var deleted = testConfigObj.configs.splice(index, 1);
			}
		});

		testConfigObj.selected = {}

		res.json(testConfigObj);
	});
});

server.listen(8000, function()
{
    console.log("Server listening on: http://localhost:8000");
});