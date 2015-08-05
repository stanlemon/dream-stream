var express = require('express');
var fs = require('fs');
var http = require('http');
var pgp = require("pg-promise");
var DreamSocket = require('./lib/dream-socket');

var db = (new pgp())(process.env.DATABASE_URL);

var server;
var app = express();
var dreamSocket = new DreamSocket(db);

app.set('port', (process.env.PORT || 8082));

app.use(app.router);
app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.get('/', function (req, res) {
	res.render('index', { title: 'Real Time Stream Console' });
});

app.get('/send', function(req, res) {
	try {
		var message = JSON.parse(req.query.message);

		if (message.email == undefined || message.event == undefined) {
			res.json({ message: "Failure: You must specify an email address and an event!" });
		}

		db.oneOrNone("SELECT c.*, a.name AS account_name, a.website AS account_website FROM salesforce.contact c JOIN salesforce.account a ON c.accountid = a.sfid WHERE c.email = $1 LIMIT 1", message.email)
			.then(function (contact) {
				if (!contact) {
					db.oneOrNone("SELECT * FROM salesforce.lead WHERE email = $1 LIMIT 1", message.email)
						.then(function (lead) {
							if (!lead) {
								res.json({ message: "Failure: Could not find a lead or contact for that email address!" });
							} else {
								message.lead = lead;
								dreamSocket.sendMessage(message);
								res.json({ message: "Success!" });
							}
						}, function (error) {
							res.json({ message: "Failure!", error: error });
						});
				} else {
					message.contact = contact;
					dreamSocket.sendMessage(message);
					res.json({ message: "Success!" });
				}
			}, function (error) {
				res.json({ message: "Failure!", error: error });
			});
	} catch (e) {
		res.json({ message: "Failure: Could not parse message!" });
	}
});

server = http.createServer(app);

server.listen(app.get('port'), function() {
  console.log('Real Time Stream is running on port ' + app.get('port'));
});

dreamSocket.decorate(server);
