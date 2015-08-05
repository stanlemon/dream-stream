(function(){
	var dreamApi = new DreamApi({
		authenticationSuccess: loginSuccess,
		authenticationError: loginFailed,
		processMessage: processMessage,
		connected: authIfCredsAvailable,
		url: getSocketUrl()
	});

	dreamApi.connect();

	function getSocketUrl() {
		// for embedding this in visualforce
		if (window.dreamSocketUrl !== undefined) {
			return window.dreamSocketUrl;
		}

		// else for direct use of console
		var baseUrl;
		// get base URL; handle IE
		if (!window.location.origin) {
			baseUrl = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port: '');
		} else {
			baseUrl = window.location.origin;
		}
		baseUrl = baseUrl.replace("https", "wss");
		// just in case this ends up on http, enforce wss when not developing locally
		if (window.location.hostname.indexOf('localhost') !== -1) {
			return baseUrl.replace("http", "ws");
		} else {
			return baseUrl.replace("http", "wss");
		}
	}

	function authIfCredsAvailable() {
		if (window.dreamApiCredentials !== undefined) {
			dreamApi.authenticate(window.dreamApiCredentials);
		}
	}

	function authenticate(serverUrl, sessionId){
		dreamApi.authenticate({serverUrl: serverUrl, sessionId: sessionId});
	}

	function loginSuccess(data){
		$('#authbox').fadeOut('fast');
		console.log('Login Successful: ');
		displayConsoleMessage(data, 'blue');
	}

	function loginFailed(data){
		console.log('Login Failed: ');
		displayConsoleMessage(data, 'red');
	}

	function processMessage(message){
		displayConsoleMessage(message, 'purple');
	}

	function loginNotify(type, message){
		var notifier = $('#authbox .notify');
		notifier.addClass(type);
		notifier.html(message);
		notifier.slideDown('fast');
	}

	function displayConsoleMessage(message, color){
		var payload = $('<div/>',{
			class: 'payload '+color,
			text: JSON.stringify(message, null, 4)
		});
		var msg = $('<div/>',{
			class: 'hidden message '+color,
			html: "<div class='date'>"+(new Date())+"</div>"
		});
		msg.append(payload);
		$('#console').prepend(msg);
		msg.slideDown('fast');
	}

	function validateserverUrl(serverUrl){
		if (serverUrl === ''){
			loginNotify('error',"Please provide a serverUrl address.");
			return false;
		}
		return true;
	}

	function validatesessionId(sessionId){
		if (sessionId === ''){
			loginNotify('error',"Please provide a sessionId.");
			return false;
		}
		return true;
	}

	$('#authbox form').submit(function(e){
		e.preventDefault();

		$('#authbox .notify').slideUp(function(){
			var serverUrl = $('#authbox form #serverUrl').val();
			var sessionId = $('#authbox form #sessionId').val();

			if ((validateserverUrl(serverUrl) && validatesessionId(sessionId))) {
				authenticate(serverUrl, sessionId);
			}
		});
	});
})();
