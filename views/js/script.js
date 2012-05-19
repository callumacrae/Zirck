var irc = {};
irc.socket = io.connect();
irc.chans = {};
irc.currentChan = 'status';

//irc.socket.emit('user', {});

/**
 * EVENT HANDLERS
 */

$('#message').keydown(function (e) {
	if (e.keyCode === 13) {
		var msg = $(this).val();
		$(this).val('');
		
		if (msg[0] === '/' && msg[1] !== '/') {
			var command = msg.slice(1, msg.indexOf(' ') < 0 ? msg.length : msg.indexOf(' '));
			$(irc).trigger(command, msg);
		} else {
			$(irc).trigger('msg', [msg, irc.currentChan]);
		}
	}
});

$('#sidebar').on('click', 'a', function (e) {
	e.preventDefault();
	irc.switchToChan($(this).text());
});

/**
 * SOCKET STUFF
 */

$(irc).on('join', function (e, msg) {
	var chan = msg.split(' ')[1];
	irc.socket.emit('join', chan);
});
irc.socket.on('selfJoin', function (chan) {
	chan.slug = irc.slug(chan.chan);
	irc.chans[chan.slug] = chan;
	irc.refreshChanList();
	
	$('#msgs').append('<ul data-chan="' + chan.slug + '"></ul>')
});

$(irc).on('msg', function(e, msg, chan) {
	if (typeof chan === 'undefined') {
		chan = msg.split(' ')[1];
		msg = msg.slice(msg.indexOf(' ', msg.indexOf(' ') + 1) + 1);
	} else if (msg[0] === '/' && msg[1] === '/') {
		msg = msg.slice(1);
	}
	
	irc.socket.emit('msg', {
		chan: chan,
		msg: msg
	});
});
irc.socket.on('msg', function (d) {
	var msgs = $('#msgs ul[data-chan="' + irc.slug(d.chan) +'"]');
	if (msgs.length === 1) {
		msgs.append('<li><strong>' + d.nick + ':</strong> ' + d.msg + '</li>');
		
		if (msgs.is(':visible')) {
			msgs.parent()[0].scrollTop += 18;
		}
	}
});

$(irc).on('quote', function (e, msg) {
	irc.socket.emit('raw', msg.slice(msg.indexOf(' ') + 1));
});
irc.socket.on('raw', function (d) {
	var msgs = $('#msgs ul[data-chan="status"]');
	msgs.append('<li>' + d + '</li>');
	if (msgs.is(':visible')) {
		msgs.parent()[0].scrollTop += 18;
	}
});

/**
 * FUNCTIONS
 */

irc.refreshChanList = function () {
	var chans = $('#sidebar ul').html('');
	$.each(irc.chans, function (slug, chan) {
		$('<a href="#"></a>').text(chan.chan).appendTo(chans);
	});
};

irc.slug = function (name) {
	return encodeURIComponent(name).toLowerCase();
};

irc.sortNicks = function (nicks) {
	var endNicks, i, mode,
		modes = {'~': [], '&': [], '@': [], '%': [], '+': [], 'a': []};
	
	for (i = 0; i < nicks.length; i++) {
		modes[modes[nicks[i][0]] ? nicks[i][0] : 'a'].push(nicks[i]);
	}
	
	endNicks = [];
	for (mode in modes) {
		modes[mode].sort();
		endNicks = endNicks.concat(modes[mode]);
	}
	
	return endNicks;
};

irc.switchToChan = function (chan) {
	$('#msgs ul').hide();
	$('#msgs ul[data-chan="' + irc.slug(chan) + '"]').show();
	irc.currentChan = chan;
};
