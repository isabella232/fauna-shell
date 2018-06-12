const os = require('os');
const path = require('path');
const fs = require('fs')
const ini = require('ini');

function buildConnectionOptions(cmdFlags, dbScope, role) {
	return new Promise(function(resolve, reject) {
		readFile(getConfigFile())
		.then(function(configData) {
			const config = ini.parse(configData);
			var endpoint;
			var keys = Object.keys(config);
			if (keys.length == 0) {
				endpoint = {}
			} else {
				var found = false
				keys.forEach(function(key) {
					if (config[key].enabled === true) {
						endpoint = config[key]
						found = true;
					}
				});
				if (!found) {
					endpoint = config[keys[0]];
				}
				// we don't want this option going all the way to connection creation.
				delete endpoint.enabled;
			}
			
			const connectionOptions = Object.assign(endpoint, cmdFlags);
			//TODO refactor duplicated code
			if (connectionOptions.secret) {
				resolve(maybeScopeKey(connectionOptions, dbScope, role));
			} else {
				reject("You must specify a secret key to connect to FaunaDB");
			}
		})
		.catch(function(err) {
			if (err.code == 'ENOENT' && err.syscall == 'open' && err.errno == -2) {
				if (cmdFlags.secret) {
					resolve(maybeScopeKey(connectionOptions, dbScope, role))
				} else {
					reject("You must specify a secret key to connect to FaunaDB");
				}
			} else {
				reject(err);
			}
		})
	})
}

function getConfigFile() {
	return path.join(os.homedir(), '.fauna-shell');
}

function readFile(fileName) {
  return new Promise(function(resolve, reject) {
    fs.readFile(fileName, 'utf8', (err, data) => {
			err ? reject(err) : resolve(data);
    })
  })
}

function maybeScopeKey(config, dbScope, role) {
	scopedSecret = config.secret;
	if (dbScope !== undefined && role !== undefined) {
		scopedSecret = config.secret + ":" + dbScope + ":" + role;
	}
	return Object.assign(config, {secret: scopedSecret});
}

module.exports = {
	buildConnectionOptions: buildConnectionOptions,
	getConfigFile: getConfigFile,
	readFile: readFile
};