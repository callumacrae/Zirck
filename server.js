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
		
		case '/jquery.js':
			file = 'js/jquery.min.js';
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
	socket.on('user', function (userData) {
		userData.nick = userData.nick || 'Zirck' + Math.ceil(Math.random() * 1000);
		userData.server = userData.server || 'irc.freenode.net';
		
		socket.ircSocket = new net.Socket();
		
		socket.ircSocket.raw = function (string) {
			socket.ircSocket.write(string + '\n', 'ascii');
		};
		
		socket.ircSocket.on('connect', function () {
			setTimeout(function() {
                socket.ircSocket.raw('NICK ' + userData.nick);
                socket.ircSocket.raw('USER zirck zirck.com zirck :Zirck user');
			}, 1000);
	
			socket.on('raw', function (data) {
				socket.ircSocket.raw(data);
			});
			
			socket.on('join', function (chan) {
				socket.ircSocket.raw('JOIN ' + chan);
			});
			
			socket.on('msg', function (msg) {
				socket.ircSocket.raw('PRIVMSG ' + msg.chan + ' :' + msg.msg);
				msg.nick = userData.nick;
				socket.emit('msg', msg);
			});
		});
		
		socket.ircSocket.setEncoding('ascii');
		socket.ircSocket.setNoDelay();
		socket.ircSocket.connect(6667, userData.server);
		
		socket.ircSocket.on('data', function (data) {
			var info;
			data = data.split('\n');
			for (var i = 0; i < data.length; i++) {
				if ((info = /^PING :(.+)$/.exec(data[i].trim()))) {
					socket.ircSocket.raw('PONG :' + info[1]);
				} else if ((info = /^:([^:!]+)!(~?[^!@]+)@([^ @]+) JOIN :([^ ]+)$/.exec(data[i].trim()))) {
					socket.emit((info[1] === userData.nick) ? 'selfJoin' : 'join', {
						nick: info[1],
						ident: info[2],
						host: info[3],
						chan: info[4]
					});
				} else if ((info = /^:([^:!]+)!(~?[^!@]+)@([^ @]+) PRIVMSG ([^ ]+) :([^ ]+)$/.exec(data[i].trim()))) {
					socket.emit('msg', {
						nick: info[1],
						ident: info[2],
						host: info[3],
						chan: info[4],
						msgs: info[5]
					});
				} else if (data[i].trim()) {
					socket.emit('raw', data[i].trim());
				}
			}
		});
	});
});
