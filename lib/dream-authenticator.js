var sf = require('jsforce');

var DreamAuthenticator = function (db, credentials) {
	var that = this;

	this.credentials = credentials;

	this.getUserInfoUsingRest = function(success, fail, credentials) {
		var conn = new sf.Connection({
			serverUrl: credentials.serverUrl,
			sessionId: credentials.sessionId
		});

		conn.identity(makeIdentityCallback(success, fail));
	}

	this.authenticate = function (callbacks) {
		var error = getValidationErrorMessage();
		if (error) {
			return callbacks.error(makeAuthError(error));
		}

		that.getUserInfoUsingRest(
			callbacks.success,
			callbacks.error,
			credentials
		);
	}

	function hasCredential(name) {
		return credentials.hasOwnProperty(name) && (credentials[name] != '');
	}

	function getValidationErrorMessage() {
		if (!credentials) {
			return 'Message missing credentials';
		}
		if (hasCredential('sessionId') && hasCredential('serverUrl')) {
			return false;
		}
		return 'Credentials missing parameters';
	}

	function makeIdentityCallback(success, fail) {
		return function (error, identityInfo) {
			if (error) {
				fail(makeAuthError('Could not authenticate connection: ' + error));
				console.error(err);
			} else {
				db.oneOrNone("SELECT * FROM salesforce.user WHERE sfid = $1 LIMIT 1", identityInfo.user_id)
					.then(function (user) {
						if (!user) {
							fail(makeAuthError('Could not find this user.'));
						} else {
							success({
								id: user.sfid,
								email: user.email,
								username: user.username,
								first_name: user.firstname,
								last_name: user.lastname,
								lastlogin: user.lastlogindate
							});
						}
					}, function (error) {
						console.error(error);
						fail(makeAuthError('Could not authenticate connection: ' + error));
					});
			}
		}
	}

	function makeAuthError(message, details) {
		return {message: message};
	}
}

module.exports = DreamAuthenticator;
