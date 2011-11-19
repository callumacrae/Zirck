var app = require('http').createServer(handler),
	io = require('socket.io').listen(app),
	less = require('less'),
	IRC = require('./lib/irc'),
	fs = require('fs');

app.listen(8080);

function handler(req, res) {
	var file = false, mime;
	switch(req.url) {
		case '/':
			file = 'index.html';
			mime = 'text/html';
			break;
		
		case '/style.css':
			fs.readFile(__dirname + '/views/style.css', function(err, data) {
				if (err) {
					res.writeHead(500);
					return res.end('An error has occurred.');
				}
				
				less.render(String(data), function(err, data) {
					if (err) {
						res.writeHead(500);
						return res.end('An error has occurred.');
					}
				
					res.writeHead(200, {'Content-Type': 'text/css'});
					res.end(data);
				});
			});
			break;
		
		case '/script.js':
			fs.readFile(__dirname + '/views/script.js/init.js', function(err, data) {
				if (err) {
					res.writeHead(500);
					return res.end('An error has occurred.');
				}
				
				data = String(data).replace(/{\% include "([a-z]+\.js)" \%}/g, function() {
					return fs.readFileSync(__dirname + '/views/script.js/' + arguments[1], 'utf8')
				});
				
				res.writeHead(200, {'Content-Type': 'application/javascript'});
				res.end(data);
			});
			break;
		
		default:
			res.writeHead(404);
			res.end('404');
			break;
	}
	
	if (file) {
		fs.readFile(__dirname + '/views/' + file, function(err, data) {
			if (err) {
				res.writeHead(500);
				return res.end('An error has occurred.');
			}
			
			res.writeHead(200, {'Content-Type': mime});
			res.end(data);
		});
	}
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
	
	socket.on('nick', function(nick, fn) {
		ircSock.on_once(new RegExp('^:[^!]+!~?zirck@[^ ]+ NICK :(' + nick.slice(0, 7) + '[^ ]+)$'), function(info) {
			fn(info[1]);
		});
		ircSock.raw('NICK ' + nick);
	});

	socket.on('raw', function(raw) {
		ircSock.raw(raw);
	});
	
	socket.on('disconnect', function(data) {
		if (ircSock) {
			ircSock.quit('http://zirck.com/')
		}
	});
});