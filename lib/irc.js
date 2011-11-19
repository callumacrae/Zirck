var net = require('net');

function IRC(config)
{
	var __self = this;
	var socket = new net.Socket();

	socket.on('data', function(data) {
		data = data.split('\r\n');
		for (var i = 0; i < data.length; i++) {
			if (data !== '') {
				__self.handle(data[i]);
			}
		}
	});

	socket.on('error', function(exception) {
		console.log('Error: ', exception);
	});

	socket.on('connect', function() {
		__self.on(/^PING :(.+)$/i, function(info) {
			__self.raw('PONG :' + info[1]);
		});
		setTimeout(function() {
			__self.raw('NICK ' + config.nick);
			__self.raw('USER ' + config.ident + ' 8 * :' + config.real);
		}, 1000);
	});

	socket.setEncoding('ascii');
	socket.setNoDelay();
	socket.connect(config.port, config.addr);

	//handles incoming messages
	this.handle = function(data) {
		console.log(data);
		var i, info;
		for (i = 0; i < listeners.length; i++) {
			info = listeners[i][0].exec(data);
			if (info) {
				listeners[i][1](info, data);
				if (listeners[i][2]) {
					listeners.splice(i, 1);
				}
			}
		}
	};

	this.raw = function(data) {
		socket.write(data + '\n', 'ascii');
	};
	
	this.quit = function(msg) {
		this.raw('QUIT :' + msg);
	};

	listeners = [];
	this.on = function(data, callback) {
		listeners.push([data, callback, false])
	};
	this.on_once = function(data, callback) {
		listeners.push([data, callback, true]);
	};
}

module.exports = IRC;