var socket = io.connect();

socket.on('raw', function (d) {
	console.log(d);
});
