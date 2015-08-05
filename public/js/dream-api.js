var DreamApi = function (options) {
	var that = this;

	this.defaults = {
		url: '<url>',
		delayBeforeReconnect: 3000,
		authenticationSuccess: null,
		authenticationError: null,
		disconnected: null,
		connected: null,
		processMessage: null,
		autoLoginOnDisconnect: true
	};

	this.lastMessageActivityTimestamp = null;

	this.credentials = null;

	this.isReconnecting = false;

	// authenticate
	this.authenticate = function (credentials) {
		// save credentials
		that.credentials = credentials;
		// auth web socket with credentials
		that.authenticateWebSocket();
	};

	this.processOpenConnection = function () {
		that.runCallbackIfPresent('connected');
		if (that.credentials && that.options.autoLoginOnDisconnect) {
			that.authenticateWebSocket();
		}
	}

	this.processCloseConnection = function () {
		that.runCallbackIfPresent('disconnected');
		setTimeout(function () {
			that.isReconnecting = true;
			that.connect();
			that.isReconnecting = false;
		}, that.options.delayBeforeReconnect);
	}

	this.processIncomingMessage = function (message) {
		var data = JSON.parse(message.data);
		if (!data.hasOwnProperty('type')) {
			return;
		}

		switch (data.type) {
			case 'authenticate':
				that.processAuthenticationMessage(data);
				break;
			default:
				that.runCallbackIfPresent('processMessage', [data]);
				break;
		}
	}

	this.connect = function () {
		// check for websocket compatibility; for now, just exit if incompatible
		var TheWebSocketClass = window['MozWebSocket'] ? window.MozWebSocket : window.WebSocket;
		if (typeof TheWebSocketClass === 'undefined') {
			return;
		}

		// to ensure we don't keep opening websockets...
		that.disconnect();

		console.log('Connecting to socket...');

		that.websocket = new TheWebSocketClass(that.options.url, 'real-time-stream');
		that.websocket.onerror = function (e) {
			console.log('ERROR:');
			console.log(e);
		};
		that.websocket.onmessage = that.processIncomingMessage;
		that.websocket.onclose = that.processCloseConnection;
		that.websocket.onopen = that.processOpenConnection;
		that.startWebsocketWatchdog();
	}

	this.disconnect = function () {
		// unless we're attempting a reconnect, clear the creds
		if (!that.isReconnecting) {
			that.credentials = null;
		}
		// we are past the timeout so we should close the websocket
		if (that.websocket && (that.websocket.readyState === 1)) {
			that.websocket.onclose = null;
			that.websocket.close();
		}
	}

	this.authenticateWebSocket = function () {
		var message = {
			type: 'authenticate',
			credentials: that.credentials
		};
		that.websocket.send(JSON.stringify(message));
	}

	this.processAuthenticationMessage = function (message) {
		if (message.hasOwnProperty('error')) {
			that.runCallbackIfPresent('authenticationError', [message.error]);
		} else {
			that.runCallbackIfPresent('authenticationSuccess', [message.data]);
		}
	}

	this.runCallbackIfPresent = function (name, params) {
		if (that.options.hasOwnProperty(name) && (typeof that.options[name] === 'function')) {
			that.options[name].apply(that, params);
		}
	}

	this.getDefaults = function (obj) {
		for (var prop in that.defaults) {
			if (!obj.hasOwnProperty(prop)) obj[prop] = that.defaults[prop];
		}
		return obj;
	}

	this.each = function (arr, cb) {
		var i;
		for (i = 0; i < arr.length; i++) {
			cb(arr[i]);
		}
	}

	// Websockets seem to think they are still connected if a laptop loses network connection when
	// going into a sleep state. In some scenarios the websocket will recover. This is designed
	// to close a websocket that thinks it's open but is not.
	this.startWebsocketWatchdog = function() {
		setTimeout(function(){
			if (!that.closeWebsocketIfItAppearsInactive()) {
				that.startWebsocketWatchdog();
			}
		}, 10000);
	}

	this.closeWebsocketIfItAppearsInactive = function() {
		if (that.lastMessageActivityTimestamp === null) {
			//no messages yet so just return
			return false;
		}
		var timeout = 60 * 60; //1 hour
		var now = that.getCurrentTimeInSeconds();
		if ((that.lastMessageActivityTimestamp + timeout) < now) {
			//we are past the timeout so we should close the websocket
			if (that.websocket.readyState === 1) {
				that.websocket.close();
				if (window.console && window.console.log) {
					window.console.log('Websocket closed by watchdog');
				}
			}
			return true;
		} else {
			return false;
		}
	}

	this.getCurrentTimeInSeconds = function(){
		return ~~((+(new Date()))/1000);
	}

	this.options = this.getDefaults(options);
};
