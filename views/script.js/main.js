var socket = io.connect();
var data = {
	nick: 'callum-zirck',
	real: 'Callum Macrae',
	addr: 'irc.freenode.net'
};
socket.on('connect', function() {
	socket.emit('usser', data, function() {
		console.log('connecting');
	});
});