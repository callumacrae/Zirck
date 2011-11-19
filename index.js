var app = require('http').createServer(handler),
	io = require('socket.io').listen(app),
	IRC = require('./lib/irc'),
	fs = require('fs');

app.listen(8080);

function handler(req, res) {
	fs.readFile(__dirname + '/views/index.html', function(err, data) {
		if (err) {
			res.writeHead(500);
			return res.end('Error loading index.html');
		}
		
		res.writeHead(200);
		res.end(data);
	});
}

io.sockets.on('connection', function(socket) {
	var ircSock = false;
	socket.on('user', function(data, fn) {
		ircSock = new IRC({
			nick: data.nick,
			ident: 'zirck',
			real: data.real,
			
			port: 6667,
			addr: data.addr
		});
		fn();
	});
	
	socket.on('join', function(chan) {
		ircSock.raw('JOIN :' + chan);
	});
	
	socket.on('msg', function(data) {
		if (!data.chan || !data.msg) {
			socket.send('error', 'Either no channel or message recieved by server.');
		} else {
			if (/[\n|\r]/.test(data.msg)) {
				data.msg = data.msg.split(/[\r\n|\n|\r]/);
				for (var i = 0; i < data.msg.length; i++) {
					if (data.msg[i]) {
						ircSock.raw('PRIVMSG ' + data.chan + ' :' + data.msg[i]);
					}
				}
			} else {
				ircSock.raw('PRIVMSG ' + data.chan + ' :' + data.msg);
			}
		}
	});

	socket.on('raw', function(raw) {
		ircSock.raw(raw);
	});
	
	socket.on('disconnect', function(data) {
		ircSock.quit('http://zirck.com/')
	});
});