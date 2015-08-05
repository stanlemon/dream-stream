var WebSocketServer = require('websocket').server;
var DreamAuthenticator = require('./dream-authenticator');

var MSG_AUTHENTICATION = 'authenticate';
var MSG_FORMAT = 'message_format';
var AUTH_STATUS_DENIED = 'denied';
var AUTH_STATUS_WAITING = 'waiting';
var AUTH_STATUS_AUTHENTICATED = 'authenticated';
var AUTH_STATUS_NEW = 'new';

var DreamSocket = function (db) {
	var that = this;

	this.connections = [];

	this.decorate = function (server) {
		var webSocketServer = new WebSocketServer({
			httpServer: server,
			// Firefox 7 alpha has a bug that drops the
			// connection on large fragmented messages
			fragmentOutgoingMessages: false
		});
		webSocketServer.on('request', this.respondToRequest);
	}

	this.respondToRequest = function (request) {
		console.log('Accepting request from origin: ' + request.origin);

		withLoggedExceptionHandling(function () {
			var connection = createConnection(request);
			connection.on('message', function (message) {
				handleMessageFromClient(message, this);
			});
		});
	}

	this.sendMessage = function(data) {
		data.type = 'event';
		this.connections.forEach(function(connection){
			var message = JSON.stringify(data);
			console.log("Sending message to socket... " + message);
			connection.sendUTF(message);
		});
	}

	function createAuthenticator(credentials) {
		return new DreamAuthenticator(db, credentials);
	}

	function createConnection(request) {
		var connection = request.accept('real-time-stream', request.origin);
		connection.metadata = {status: AUTH_STATUS_NEW};
		return connection;
	}

	function withLoggedExceptionHandling(func) {
		try {
			func();
		} catch (exception) {
			console.error(exception);
		}
	}

	function handleMessageFromClient(rawMessage, connection) {
		var message = parseUtf8Message(rawMessage);
		if (!message)
			return sendErrorToClient(connection, "Not a Valid UTF8 JSON Message", MSG_FORMAT);

		if (message.type == 'authenticate') {
			ensuringSingleAuth(connection.metadata, function () {
				authenticate(message, connection);
			});
		} else {
			sendErrorToClient(connection, "Invalid Message Type", MSG_FORMAT, message);
		}
	}

	function ensuringSingleAuth(metadata, callback) {
		if (metadata.status === AUTH_STATUS_AUTHENTICATED || metadata.status === AUTH_STATUS_WAITING)
			return;

		metadata.status = AUTH_STATUS_WAITING;
		callback();
	}

	function authenticate(message, connection) {
		var auth = createAuthenticator(message.credentials);
		auth.authenticate({
			success: function (userInfo) {
				authSuccess(connection, message, userInfo);
			},
			error: function (error) {
				authError(connection, message, error)
			}
		});
	}

	function authSuccess(connection, message, userInfo) {
		userInfo.type = 'authentication';

		that.connections.push(connection);

		sendDataToClient(connection, userInfo, MSG_AUTHENTICATION);
	}

	function authError(connection, message, error) {
		sendErrorToClient(connection, error.message, MSG_AUTHENTICATION, error.details || message);
	}

	function sendErrorToClient(connection, errorString, type, details) {
		var msg = {error: errorString, type: type};
		if (details) {
			msg.details = details;
		}
		if (type === MSG_AUTHENTICATION) {
			connection.metadata.status = AUTH_STATUS_DENIED;
		}
		connection.sendUTF(JSON.stringify(msg));
	}

	function sendDataToClient(connection, payload, type) {
		var msg = {data: payload, type: type};
		connection.sendUTF(JSON.stringify(msg));
	}

	function parseUtf8Message(rawMessage) {
		if (rawMessage.hasOwnProperty('type') &&
			(rawMessage.type === 'utf8') &&
			rawMessage.hasOwnProperty('utf8Data')) {
			try {
				return JSON.parse(rawMessage.utf8Data);
			}
			catch (error) {
			}
		}
		return false;
	}
}

module.exports = DreamSocket;
