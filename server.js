var server = require('http').createServer(handler),
	io = require('socket.io').listen(server),
	fs = require('fs'),
	net = require('net');

server.listen(8080);

function handler(req, res) {
	var file, contentType;

	switch (req.url.toLowerCase()) {
		case '/':
			file = 'index.html';
			contentType = 'text/html';
			break;
		
		case '/style.css':
			file = 'css/zirck.css';
			contentType = 'text/css';
			break;
		
		case '/script.js':
			file = 'js/script.js';
			contentType = 'application/javascript';
			break;
	}

	fs.readFile('views/' + file, function (err, data) {
		if (err) {
			res.writeHead(500);
			res.end('Error, please email callum@macr.ae.');
		} else {
			res.writeHead(200, {'Content-Type': contentType});
			res.end(data);
		}
	});
}

io.sockets.on('connection', function (socket) {
	socket.ircSocket = false;
	socket.on('user', function (data) {
		data.nick = data.nick || 'Zirck' + Math.ceil(Math.random() * 1000);
		data.server = data.server || 'irc.efnet.org';
		
		socket.ircSocket = new net.Socket();
		
		socket.ircSocket.raw = function (string) {
			socket.ircSocket.write(string + '\n', 'ascii');
		}
		
		socket.ircSocket.on('connect', function () {
			setTimeout(function() {
                socket.ircSocket.raw('NICK ' + data.nick);
                socket.ircSocket.raw('USER zirck zirck.com zirck :Zirck user');
			}, 1000);
		});
		
		socket.ircSocket.setEncoding('ascii');
		socket.ircSocket.setNoDelay();
		socket.ircSocket.connect(6667, data.server);
		
		socket.ircSocket.on('data', function (data) {
			data = data.split('\n');
			for (var i = 0; i < data.length; i++) {
				if (data[i].trim()) {
					socket.emit('raw', data[i].trim());
				}
			}
		});
	});
});
