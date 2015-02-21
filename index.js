var express = require('express');
var mongodb = require('mongodb');
var moment = require('moment');
var _ = require('lodash');

var uri = 'mongodb://abcde:12345@ds045011.mongolab.com:45011/sensor-statistic';

mongodb.MongoClient.connect(uri, function(err, db) {
	if (err) {
		console.log('connect mongo db error ' + err);
	} else {
		console.log('connect mongo db success');
		var app = express();

		function allowCrossDomain(req, res, next) {
		  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

		  var origin = req.headers.origin;
		  if (_.contains(app.get('allowed_origins'), origin)) {
		    res.setHeader('Access-Control-Allow-Origin', origin);
		  }

		  if (req.method === 'OPTIONS') {
		    res.send(200);
		  } else {
		    next();
		  }
		}

		app.use(function(req, res, next) {
		  res.header("Access-Control-Allow-Origin", "*");
		  res.header("Access-Control-Allow-Headers", "X-Requested-With");
		  next();
		});

		//app.use(allowCrossDomain);
		app.use(express.static(__dirname + '/public'));

		app.get('/api/createDataPoint', function(request, response) {
			if (!request.query.value) {
				__sendErrorResponse(response, 403, 'No query parameters value');
				return;
			}

			var title = request.query.value;
			var timeMillis = moment();
			var time = timeMillis.format('MM/DD hh:mm:ss');
			var insert = {
				_id: timeMillis.unix(),
				value : title,
				time : time
			};
			var items = db.collection('sensor_history');
			items.insert(insert, function(err, result) {
				if (err) {
					__sendErrorResponse(response, 406, err);
				} else {
					response.type('application/json');
					response.status(200).send(result);
					response.end();
				}
			});
		});

		app.get('/api/queryDataPoint', function(request, response) {
			var items = db.collection('sensor_history');

			var limit = parseInt(request.query.limit, 10) || 100;

			items.find().sort({$natural: -1}).limit(limit).toArray(function (err, docs) {
				if (err) {
					console.log(err);
					__sendErrorResponse(response, 406, err);
				} else {
					response.type('application/json');
					response.status(200).send(docs);
					response.end();
				}
			});
		});

		app.listen(process.env.PORT || 5000);
		console.log('port ' + (process.env.PORT || 5000));
	}

	function __sendErrorResponse(response, code, content) {
		var ret = {
			err: code,
			desc : content 
		};
		response.status(code).send(ret);
		response.end();
	}
});


