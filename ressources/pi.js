/*! Copyright (c) 2016 Plug-It <contact.wibla@gmail.com>
 * Licensed under the GNU License (LICENSE.txt).
 */

;(function(){
if (typeof pi !== 'undefined') pi.reload();
else {
	// Status (can be used to debug)
	$('.app-header').after(
		$('<div id="pi-status">\
			<img height="" src="">\
			<span></span>\
		</div>').css({
			position: 'absolute',
			top: '65px', left: '15px',
			padding: '5px',
			color: '#DDD',
			background: '#181C21',
			borderRadius: '5px',
			boxShadow: '0 0 3px #000',
			transition: 'all .25s ease-in-out'
		})
	);
	window.updateStatus = function(txt, status) {
		$('#pi-status span')[0].innerHTML = 'PI is loading..<br>'+txt+'<br>Status: '+status;
	};
	
	// Get last commit of any project, used to know if an update is available
	function getLastCommit(url, callback) {
		var xhr = new XMLHttpRequest;
		xhr.open('GET', url);
		xhr.onload = callback;
		xhr.send();
	}
	getLastCommit('https://api.github.com/repos/Plug-It/pi/commits/pre-release', function(data){window.thisCommit = JSON.parse(data.currentTarget.responseText);});

	// Load user language
	updateStatus('Loading user language', 1);
	switch (API.getUser().language) {
		case 'en': lang = 'en'; break;
		case 'fr': lang = 'fr'; break;
		default: lang = 'en'; break;
	}
	$.getJSON('https://rawgit.com/Plug-It/pi/pre-release/lang/'+lang+'.json', function(data) {
		window.lang = data; // should be in pi
	});
	
	// Retrieve user settings if available
	updateStatus('Loading user settings', 2);
	var ls = localStorage.getItem('pi-settings');
	var settings = {
		// General
		autoW: false,
		autoDJ: false,
		keyboardShortcuts: false,
		betterMeh: false,
		navWarn: false,
		afk: false,
		// Customisation
		showVideo: true,
		CSS: false,
		bg: '',
		oldChat: false,
		// Moderation
		durationAlert: false,
		time: 480,
		historyAlert: false,
		// Notifications
		userMeh: false,
		userGrab: false,
		userJoin: false,
		userLeft: false
	};
	if (typeof ls == 'string') {
		// Making sure user settings are up to date
		var usrSettings = JSON.parse(ls);
		for (var obj in settings) {
			if (!usrSettings[obj]) {
				usrSettings[obj] = settings[obj];
			}
		}
		localStorage.setItem('pi-settings', JSON.stringify(usrSettings));
		settings = usrSettings;
	} else {
		localStorage.setItem('pi-settings', JSON.stringify(settings));
	}

	sessionStorage.setItem('modSkipWarn', false);
	sessionStorage.setItem('modQuitWarn', false);
	sessionStorage.setItem('trustWarn', false);

	// Get Plug & Script ranks
	updateStatus('Fetching script ranks', 3);
	$.getJSON('https://rawgit.com/Plug-It/pi/pre-release/ressources/ranks.json', function(data) {
		window.ranks = data; // should be in pi
	});
	
}

window.pi = {
// ╔══════════════════╗
// ║    VARIABLES     ║
// ╚══════════════════╝
version: '1.0.0 pre-15',
url: {
	script: 'https://rawgit.com/Plug-It/pi/pre-release/ressources/pi.js',
	menu_css: 'https://rawgit.com/Plug-It/pi/pre-release/ressources/menu.css',
	old_chat: 'https://rawgit.com/Plug-It/pi/pre-release/ressources/old-chat.css',
	blue_css: 'https://rawgit.com/Plug-It/pi/pre-release/ressources/blue.css'
	// Not sure if I'll keep this
	// notif: 'https://raw.githubusercontent.com/Plug-It/pi/pre-release/ressources/notif.wav',
},
user: API.getUser(),
// ╔══════════════════╗
// ║    FUNCTIONS     ║
// ╚══════════════════╝
getRank: function(id) {
	var result = [], user;

	if (!id) {
		user = pi.user;
		id = user.id;
	}
	else user = API.getUser(id);
	
	for (var rank in ranks) {
		for (var users in ranks[rank]) {
			if (id == ranks[rank][users]) result.push(rank);
		}
	}
	
	return result;
},
isRank: function(rank, id) {
	if (!rank) return null;
	var result = pi.getRank(id);

	for (var ranks in result) {
		result[ranks] = result[ranks].toLowerCase();
		rank = rank.toLowerCase();
		if (result[ranks] == rank) return true;
	}
	return false;
},
complete: function(txt) {
	txt = txt.split(' ');
	for (var i = 0; i < txt.length; i++) {
		if (txt[i].charAt(0) == '$') {
			switch(txt[i]) {
				case '$version': txt[i] = pi.version; break;
				case '$dj': txt[i] = API.getDJ().rawun; break;
				case '$historyDj': txt[i] = arguments[1]; break;
				default: console.log(lang.error.unknowVariable);
			}
		}
	}
	return txt.join(' ');
},
tooltip: function(set, type, x,y, txt) {
	if (set) {
		var $tooltip = $('\
			<div id="tooltip" class="'+type+'" style="top: '+y+'px; left: '+x+'px;">\
				<span>'+txt+'</span>\
				<div class="corner"></div>\
			</div>');
		$('body').append($tooltip);
	}
	else {
		$('#tooltip').each(function(){this.remove();});
	}
},
modal: function(set) {
	if (set) {
		var $dialog = $('\
			<div id="dialog-media-update" class="dialog">\
				<div class="dialog-frame">\
					<span class="title">Set background\'s image</span>\
					<i class="icon icon-dialog-close"></i>\
				</div>\
				\
				<div class="dialog-body">\
					<div class="dialog-input-container" style="position:relative;top:10px;">\
						<span class="dialog-input-label">URL</span>\
						<div class="dialog-input-background">\
							<input type="text" placeholder=".jpg .png .gif.." name="url">\
						</div>\
						<p style="position:relative;top:55px;">\
								Type :<br>\
								"default" for plug\'s default background<br>\
								"reset" for script\'s default background\
							</p>\
					</div>\
				</div>\
				\
				<div class="dialog-frame">\
					<div class="button cancel"><span>Cancel</span></div>\
					<div class="button submit"><span>Save</span></div>\
				</div>\
			</div>\
		');

		$dialog.find('.dialog-frame i, .button.cancel').on('click', function(){pi.modal(false)});
		$dialog.find('.button.submit').on('click', function(){
			settings.bg = $dialog.find('input[name="url"]')[0].value;
			pi.askBG(settings.bg);
			pi.modal(false);
		});

		$('#dialog-container').append($dialog);
		$('#dialog-container')[0].style.display = "block";
	}
	else if (!set) {
		$('#dialog-container')[0].style.display = "none";
		$('#dialog-container *').each(function(){this.remove();});
	}
},
getPlugSettings: function(id) {
	if (typeof id == 'undefined') id = pi.user.id;
	var json = JSON.parse(localStorage.getItem('settings'));
	for (var i = 1; i < 20; i++) {
		if (typeof json[i][id] !== 'undefined') return json[i][id];
	}
},
setPlugSettings: function(option, value) {
	switch (option) {
		// Whitelist
		case 'videoOnly':case'chatTimestamps':case'emoji':case 'tooltips':case 'chatImages':case 'notifyDJ':case 'notifyScore':case 'notifyFriendJoin':case 'nsfw':case 'friendAvatarsOnly':
			var data = {};
			data[option] = value;
			$.ajax({
				type: 'PUT',
				url: 'https://plug.dj/_/users/settings',
				data: JSON.stringify(data),
				error: function(e) {
					pi.log(e.responseJSON.data[0], 'error', 'console');
				},
				dataType: 'json',
				contentType: 'application/json'
			});
		break;
	}

	var json = JSON.parse(localStorage.getItem('settings'));
	var id = pi.user.id;
	for (var i = 1; i < 5; i++) {
		if (typeof json[i] !== 'undefined') {
			if (typeof json[i][id] !== 'undefined') {
				for (var obj in json[i][id]) {
					if (obj == option) json[i][id][obj] = value;
				}
			}
		}
	}
	localStorage.setItem('settings', JSON.stringify(json));
},
parseHTML: function(txt) {
	txt = txt.split('\n');
	for (var i = 0; i < txt.length; i++) {
		if (i !== txt.length-1) {
			txt[i] += '<br>';
		}
	}
	return txt.join('');
},
log: function(txt, type, where, callback) {
	switch(type) {
		case 'error': txt = 'Error: ' + txt;break;
		case 'warn':  txt = 'Warn: '  + txt;break;
		case 'info':  txt = 'Info: '  + txt;break;
		case 'debug': txt = 'Debug: ' + txt;break;

		case 'chat':
		case 'console':
		case 'both':
			where = type; type = 'log';
		break;

		default: type = 'log';break;
	}

	if (typeof where == "undefined" || where == 'chat' || where == 'both') {
		var timestamp = pi.getPlugSettings().chatTimestamps;
		if (timestamp) {
			var time = new Date();
			var h = time.getHours();
			var m = time.getMinutes();
			m = m<10 ? "0"+m : m;
			
			if (timestamp == 12) {
				var am;

				if (h >= 12) {
					am = "pm";
					h -= 12;
				}
				else am = "am";

				time = h+":"+m+am;
			}
			else {
				h = h<10 ? "0"+h : h; // Add a 0 to hours only if timestamp is 24
				time = h+":"+m;
			}
		}
		// If style 'top' of .delete-button is set, his position is relative to #chat-messages instead of the .cm
		var $logBox = $('\
			<div class="cm pi-'+type+' deletable">\
				<div class="delete-button" style="display: none;top: initial !important;">Delete</div>\
				<div class="badge-box">\
					<i class="bdg bdg-piLogo"></i>\
				</div>\
				<div class="msg">\
					<div class="from Plug-It">\
						<i class="icon icon-pi"></i>\
						<span class="un">[Plug-It]</span>\
						<span class="timestamp" style="display: '+ (timestamp ? 'inline-block' : 'none') +';">'+time+'</span>\
					</div>\
					<div class="text cid-undefined">'+pi.parseHTML(txt)+'</div>\
				</div>\
			</div>\
		');
		// Delete button
		$logBox.on('mouseenter', function(){
			$logBox.find('.delete-button')[0].style.display = 'block';
		});
		$logBox.on('mouseleave', function(){
			$logBox.find('.delete-button')[0].style.display = 'none';
		});
		$logBox.find('.delete-button').on('click', function(){
			$logBox.remove();
		});
		// Callback
		if (typeof callback == 'function' && where == 'chat') {
			$logBox.css('cursor', 'pointer');
			$logBox.on('click', function(){
				callback();
				this.remove();
			});
		}
		// Make the chat scroll to custom log
		var $chat = $("#chat-messages");
		// Only if chat is overflowing  & already scrolled to bottom
		if ($chat.height() + $chat.scrollTop() == $chat[0].scrollHeight && $chat[0].scrollHeight > $chat.height()) {
			var scrollIntoView = setInterval(function(){
				if ($($logBox).length > 0) {
					$chat.scrollTop($chat[0].scrollHeight);
					clearInterval(scrollIntoView);
				}
			}, 5);
		}
		$('#chat-messages').append($logBox);
	}
	if (typeof where == "undefined" || where == 'console' || where == 'both') {
		console[type]('%c[%cPlug-It%c]%c','color: #EEE','color: #ABDA55','color: #EEE','',txt);
	}
},
getFriendsOnline: function(callback) {
	var xhr = new XMLHttpRequest;
	xhr.open('GET', 'https://plug.dj/_/friends');
	xhr.onload = function(){
		var data = xhr.responseText;
		callback(data);
	};
	xhr.send();
},
menu: function(choice) {
	choice += '';
	switch(choice) {
		case '0': pi.slide(); break;
		case '1': settings.autoW = !settings.autoW; pi.autowoot(); break;
		case '2': settings.autoDJ = !settings.autoDJ; pi.autojoin(); break;
		case '3': settings.showVideo = !settings.showVideo; pi.hideStream(); break;
		case '4': settings.CSS = !settings.CSS; pi.design(); break;
		case '5': pi.modal(true); break;
		case '6': settings.oldChat = !settings.oldChat; pi.oldChat(); break;
		case '7': settings.alertDuration = !settings.alertDuration; pi.alertDuration(); break;
		case '8': settings.userMeh = !settings.userMeh; pi.voteAlert(); break;
		case '9': settings.betterMeh = !settings.betterMeh; pi.muteMeh(); break;
		case '10':
			settings.navWarn = !settings.navWarn;
			settings.navWarn ? pi.dom.navWarn.className = 'pi-on' : pi.dom.navWarn.className = 'pi-off';
		break;
		case '11': settings.keyboardShortcuts = !settings.keyboardShortcuts;
			settings.keyboardShortcuts ? pi.dom.keyShortcut.className = 'pi-on' : pi.dom.keyShortcut.className = 'pi-off';
		break;
		case '12': settings.historyAlert = !settings.historyAlert;
			settings.historyAlert ? pi.dom.historyAlert.className = 'pi-on' : pi.dom.historyAlert.className = 'pi-off';
		break;
		case '15': settings.userGrab = !settings.userGrab;
			settings.userGrab ? pi.dom.userGrab.className = 'pi-on' : pi.dom.userGrab.className = 'pi-off';
		break;
		case '13': settings.userJoin = !settings.userJoin;
			settings.userJoin ? pi.dom.userJoin.className = 'pi-on' : pi.dom.userJoin.className = 'pi-off';
		break;
		case '14': settings.userLeave = !settings.userLeave;;
			settings.userLeave ? pi.dom.userLeave.className = 'pi-on' : pi.dom.userLeave.className = 'pi-off';
		break;
		
		case 'init':
			pi.autowoot();
			pi.autojoin();
			pi.hideStream();
			pi.design();
			pi.oldChat();
			pi.alertDuration();
			pi.voteAlert();
			pi.muteMeh();
			settings.navWarn ? pi.dom.navWarn.className = 'pi-on' : pi.dom.navWarn.className = 'pi-off';
			settings.keyboardShortcuts ? pi.dom.keyShortcut.className = 'pi-on' : pi.dom.keyShortcut.className = 'pi-off';
			settings.historyAlert ? pi.dom.historyAlert.className = 'pi-on' : pi.dom.historyAlert.className = 'pi-off';
			settings.userGrab ? pi.dom.userGrab.className = 'pi-on' : pi.dom.userGrab.className = 'pi-off';
			settings.userJoin ? pi.dom.userJoin.className = 'pi-on' : pi.dom.userJoin.className = 'pi-off';
			settings.userLeave ? pi.dom.userLeave.className = 'pi-on' : pi.dom.userLeave.className = 'pi-off';
		break;
		case 'kill': pi.kill(); break;
		default: console.log(lang.info.menuOptions);
	}

	localStorage.setItem('pi-settings', JSON.stringify(settings));
},
autowoot: function() {
	if (settings.autoW === true && !$('#meh.selected')[0]) {
		$('#woot')[0].click();
		pi.dom.woot.className = 'pi-on';
	} else {
		pi.dom.woot.className = 'pi-off';
	}
},
autojoin: function() {
	var dj = API.getDJ();
	if (settings.autoDJ) {
		pi.dom.join.className = 'pi-on';
		if (dj !== undefined) {
			if (dj.id !== API.getUser().id && API.getWaitListPosition() === -1) {
				switch (API.djJoin()) {
					case 1:
						pi.log(lang.error.autoJoin1, 'error', 'chat');
					break;
					case 2:
						pi.log(lang.error.autoJoin2, 'error', 'chat');
					break;
					case 3:
						pi.log(lang.error.autoJoin3, 'error', 'chat');
					break;
				}
			}
		} else {
			API.djJoin();
		}
	} else {
		pi.dom.join.className = 'pi-off';
	}
},
hideStream: function() {
	if (settings.showVideo) {
		pi.dom.stream.style.visibility = 'visible';
		pi.dom.stream.style.height = '281px';
		if (API.hasPermission(pi.user, API.ROLE.BOUNCER)) {
			pi.dom.rmvDJ.style.top = pi.dom.skip.style.top = '283px';
		}
		$('#playback-controls')[0].style.visibility = 'visible';
		$('#no-dj')[0].style.visibility = 'visible';
		pi.dom.video.className = 'pi-off';
	} else {
		pi.dom.stream.style.visibility = 'hidden';
		pi.dom.stream.style.height = '0';
		if (API.hasPermission(pi.user, API.ROLE.BOUNCER)) {
			pi.dom.rmvDJ.style.top = pi.dom.skip.style.top = '0';
		}
		$('#playback-controls')[0].style.visibility = 'hidden';
		$('#no-dj')[0].style.visibility = 'hidden';
		pi.dom.video.className = 'pi-on';
	}
	localStorage.setItem('pi-settings',JSON.stringify(settings));
},
design: function() {
	if (settings.bg == 'reset') askBG();
	if (settings.CSS) {
		pi.dom.style.setAttribute('href', pi.url.blue_css);
		settings.bg = 'reset'; pi.askBG();
		pi.dom.css.className = 'pi-on';
	} else {
		pi.dom.style.setAttribute('href', '');
		settings.bg = 'default'; pi.askBG();
		pi.dom.css.className = 'pi-off';
	}
	localStorage.setItem('pi-settings',JSON.stringify(settings));
},
oldChat: function() {
	if (settings.oldChat) {
		pi.dom.oldChat.className = 'pi-on';
		pi.dom.oldStyle.setAttribute('href', pi.url.old_chat);
	} else {
		pi.dom.oldChat.className = 'pi-off';
		pi.dom.oldStyle.setAttribute('href', '');
	}
},
askBG: function() {
		var style = $('.room-background')[0].getAttribute('style').split(' ');
	if (typeof(plugBG) == 'undefined') {
		window.plugBG = style[9];
	}
	switch (settings.bg) {
		case 'reset':
			settings.bg = 'https://raw.githubusercontent.com/Plug-It/pi/pre-release/images/background/default/custom.jpg';
			pi.changeBG();
		break;
		case 'default':
			settings.bg = plugBG;
			pi.changeBG(true);
		break;
		default:
			pi.changeBG(true);
		break;
	}
},
changeBG: function(isDefault) {
	if (isDefault) {
		$('.room-background')[0].style.background = plugBG + ' no-repeat';
		if ($('i.torch')[0] !== undefined) {
			$('i.torch')[0].style.display = 'block';
			$('i.torch.right')[0].style.display = 'block';
		}
		pi.dom.bg.className = 'pi-off';
	} else {
		$('.room-background')[0].style.background = 'url(' + settings.bg + ') no-repeat';
		pi.dom.bg.className = 'pi-on';
		if ($('i.torch')[0] !== undefined) {
			$('i.torch')[0].style.display = 'none';
			$('i.torch.right')[0].style.display = 'none';
		}
		localStorage.setItem('pi-settings',JSON.stringify(settings));
	}
},
alertDuration: function() {
	if (settings.alertDuration) {
		pi.dom.lengthA.className = 'pi-on';
		if (API.getMedia() !== undefined) {
			if (API.getMedia().duration > settings.time) {
				notif.play();
				pi.log(lang.warn.songLimit, 'warn', 'chat');
			}
		}
	} else {
		pi.dom.lengthA.className = 'pi-off';
	}
},
muteMeh: function() {
	if (settings.betterMeh) {
		$('#meh').on('click', function(){
			if (settings.betterMeh) API.setVolume(0);
		});
		$('#woot').on('click', function(){
			if (settings.betterMeh && API.getVolume() == 0) {
				API.setVolume(pi.getPlugSettings().volume);
			};
		});
		pi.dom.betterMeh.className = 'pi-on';
	} else {
		pi.dom.betterMeh.className = 'pi-off';
	}
},
afk: function(msg) {
	if (settings.afk) {
		if (typeof msg !== 'undefined') {
			API.sendChat('/me is AFK: "' + msg + '".');
			settings.afk = false;
		} else {
			API.sendChat('/me is back.');
		}
	} else {
		if (typeof msg !== 'undefined') {
			API.sendChat('/me is AFK: "' + msg + '".');
		} else {
			API.sendChat('/me is AFK.');
		}
	}
	settings.afk = !settings.afk;
},
voteAlert: function(data) {
	//visual stuff
	if (settings.userMeh === true) {
		pi.dom.mehA.className = 'pi-on';
	} else {
		pi.dom.mehA.className = 'pi-off';
	}
	//notifications
	if (data !== undefined) {
		if (data.vote == 1 && settings.userWoot === true) {
			pi.log(data.user.username + lang.log.wooted, 'chat');
		} else if (data.vote == -1 && settings.userMeh === true) {
			pi.log(data.user.username + lang.log.meh, 'chat');
		}
	}
},
reload: function() {
	pi.log(lang.log.reloading);
	menu(10);
	$.getScript('https://rawgit.com/Plug-It/pi/pre-release/ressources/pi.js');
},
slide: function() {
	var menu = $('#pi-menu')[0];
	if (menu.style.visibility == "visible") {
		menu.style.visibility = 'hidden';
		menu.style.zIndex = '0';
		menu.style.right = '200px';
	} else {
		menu.style.visibility = 'visible';
		menu.style.zIndex = '2';
		menu.style.right = '345px';
	}
},
forceSkip: function() {
	if (sessionStorage.getItem('modSkipWarn') == 'false') {
		sessionStorage.setItem('modSkipWarn', 'true');
		pi.log(lang.warn.confirmSkip, 'warn', 'chat');
	} else {
		sessionStorage.setItem('modSkipWarn', 'false');;
		API.moderateForceSkip();
	}
},
removeDJ: function() {
	if (sessionStorage.getItem('modQuitWarn') == 'false') {
		sessionStorage.setItem('modQuitWarn', 'true');;
		pi.log(lang.warn.confirmEject, 'warn', 'chat');
	} else {
		sessionStorage.setItem('modQuitWarn', 'false');;
		API.moderateForceQuit();
	}
},
execute: function(code) {
	if (sessionStorage.getItem('trustWarn') == 'false') {
		sessionStorage.setItem('trustWarn', 'true');
		pi.log(lang.warn.isTrusted, 'warn', 'chat', function(){pi.execute(code)});
	} else {
		try {eval(code);} catch(err){pi.log(err+'', 'error', 'chat');}
	}
},
chatCommand: function(cmd) {
	var args = cmd.split(' '), msg = [];
	for (var i = 1; i < args.length; i++) {
		msg.push(args[i]);
	}
	msg = msg.join(' ');
	
	switch (args[0]) {
		case '/like':
			API.sendChat(':heart_eyes::heartpulse::heart_eyes::heartpulse::heart_eyes:');
		break;
		
		case '/love':
			if (args[1] === undefined) API.sendChat(':heart_eyes::heartpulse::heart_eyes::heartpulse::heart_eyes::heartpulse::heart_eyes::heartpulse::heart_eyes::heartpulse:');
			else API.sendChat(msg + ' :heart_eyes::heartpulse::heart_eyes::heartpulse::heart_eyes::heartpulse::heart_eyes::heartpulse::heart_eyes::heartpulse:');
		break;
		
		case '/fire':
			API.sendChat(':fire: :fire: :fire: :fire: :fire: :fire: :fire: :fire: :fire: :fire:');
		break;

		case '/eta':
			if (API.getUser().id == API.getDJ().id) {
				pi.log(lang.info.youPlay, 'info', 'chat');
			} else if (API.getWaitListPosition() == -1) {
				pi.log(lang.info.notInWaitList, 'info', 'chat');
			} else if (API.getWaitListPosition() == 0) {
				var eta = API.getTimeRemaining();
				if (eta >= 3600) {
					var etaH = Math.floor(eta/60);
					var etaM = eta%60;
					pi.log(etaH+'h'+etaM+'m '+lang.log.eta, 'chat');
				} else if (eta >= 60) {
					var etaM = Math.floor(eta/60);
					var etaS = eta%60;
					etaS < 10 ? etaS = '0'+etaS : void(0);
					pi.log(etaM+'m'+etaS+'s '+lang.log.eta, 'chat');
				} else {
					pi.log(eta+'s '+lang.log.eta, 'chat');
				}
			} else {
				var eta = (API.getWaitListPosition())*4*60;
				eta += API.getTimeRemaining();
				if (eta >= 3600) {
					var etaH = Math.floor(eta/60);
					var etaM = eta%60;
					pi.log(etaH+'h'+etaM+'m '+lang.log.eta, 'chat');
				} else {
					var etaM = Math.floor(eta/60);
					var etaS = eta%60;
					etaS < 10 ? etaS = '0'+etaS : void(0);
					pi.log(etaM+'m'+etaS+'s '+lang.log.eta, 'chat');
				}
			}
		break;
		
		case '/vol':
			if (args[1] >= 0 && args[1] <= 100) {
				API.setVolume(args[1]);
				pi.setPlugSettings("volume", args[1]);
			}
			else pi.log(lang.info.helpVol, 'info', 'chat');
		break;
		
		case '/afk':
			if (msg.length === 0) msg = undefined;
			else window.afkMessage = msg;
			pi.afk(msg);
		break;
		
		case '/whoami':
			var me = API.getUser();
			pi.log('Username: ' + me.username +
			'\nID: ' + me.id + 
			'\nDescription: ' + me.blurb +
			(me.level >= 5 ? '\n<a target="_blank" href="'+location.origin+"/@/"+me.username.toLowerCase().replace(/([^A-z] )|( [^A-z])/g, "").replace(" ","-").replace(/[^A-z-0-9]|\[|\]/g, "")+'">Profile</a>' : "") +
			'\nAvatar: ' + me.avatarID +
			'\nBadge: ' + me.badge +
			'\nLvl: ' + me.level +
			'\nXP: ' + me.xp +
			'\nPP: ' + me.pp, 'chat');
		break;
		
		case '/whois':
			if (typeof msg == 'undefined') pi.log(lang.info.helpUserOrId, 'info');
			else if (isNaN(msg)) var user = API.getUserByName(msg.replace('@', '').trim());
			else var user = API.getUser(msg);
			if (typeof user !== 'null') {
				pi.log('Username: '+user.rawun +
				'\nID: ' +user.id +
				(user.level >= 5 ? '\n<a target="_blank" href="'+location.origin+"/@/"+user.username.toLowerCase().replace(/([^A-z] )|( [^A-z])/g, "").replace(" ","-").replace(/[^A-z-0-9]|\[|\]/g, "")+'">Profile</a>' : "") +
				'\nlanguage: '+user.language +
				'\nAvatar: '+user.avatarID +
				'\nBadge: '+user.badge +
				'\nLvl: '+user.level +
				'\nFriend: '+user.friend+'\n', 'info', 'chat');
			} else pi.log('Could not get user, verify the id/pseudo', 'error', 'chat');
		break;

		case '/pi':
			API.sendChat('Plug-It : http://wibla.free.fr/plug/script/');
		break;

		case '/js':
			pi.execute(msg);
		break;
		
		case '/list':
			pi.log('/like <3 x 5\
			\n/love [@user]\
			\n/fire\
			\n/eta\
			\n/vol [0-100]\
			\n/afk [message]\
			\n/whoami\
			\n/whois [id/pseudo]\
			\n/pi\
			\n/js [javaScript code]\
			\n/reload\
			\n/kill\
			\n/list', 'chat');
		break;
		
		case '/reload':
			pi.reload();
		break;
		
		case '/kill':
			pi.menu('kill');
		break;
	}
},
/* Core */
init: function(unload) {
	// API initalization
	if (!unload) {
		updateStatus('Initalizating API & Events listener', 4);
		function apiAdvance(){
			pi.autowoot();
			pi.autojoin();
			pi.alertDuration();
			sessionStorage.setItem('modSkipWarn', 'false');
			sessionStorage.setItem('modQuitWarn', 'false');
		}
		API.on(API.ADVANCE, apiAdvance);
		API.on(API.HISTORY_UPDATE, function(){
			if (settings.historyAlert) {
				var histo = API.getHistory();
				var media = API.getMedia();
				var dj = API.getDJ();

				// i = 1 to jump the first item being the current song
				for (var i = 1; i < histo.length; i++) {
					if (media.format == histo[i].media.format && media.cid == histo[i].media.cid) {
						pi.log(
							pi.parseHTML(
								dj.username + ' is playing a song in history :\n'+
								'Author : ' + histo[i].media.author +'\n'+
								'Title : ' + histo[i].media.title +'\n'+
								'Played by : ' + histo[i].user.username + ' '+(i-1)+' songs ago.\n'
								+ (API.hasPermission(pi.user, API.ROLE.BOUNCER) ? 'Click here to force skip.' : void(0))
							)
						, 'warn', 'chat', (API.hasPermission(pi.user, API.ROLE.BOUNCER) ? function(){API.moderateForceSkip();} : null));
					}
				}
			}
		});
		API.on(API.USER_JOIN, function(e){
			if (settings.userJoin) pi.log(e.username + ' joined !', 'chat');
		});
		API.on(API.USER_LEAVE, function(e){
			if (settings.userLeave) pi.log(e.username + ' left !', 'chat');
		});
		API.on(API.VOTE_UPDATE, pi.voteAlert);
		API.on(API.CHAT_COMMAND, pi.chatCommand);
		API.on(API.CHAT, function(msg) {
			// This message node
			var selector = '#chat [data-cid="'+msg.cid+'"]';
			var sender = API.getUser(msg.uid);
			if (!$(selector).length) return; // Second message from the same user

			// Script ranks
			switch (pi.getRank(sender.id)[0]) {
				case "Dev": $(selector)[0].className += ' is-dev'; break;
				case "Helper": $(selector)[0].className += ' is-helper'; break;
				case "Graphist": $(selector)[0].className += ' is-graphist'; break;
				case "Translator": $(selector)[0].className += ' is-translator'; break;
				case "Donator": $(selector)[0].className += ' is-donator'; break;
				case "Alpha": $(selector)[0].className += ' is-alpha'; break;
				case "Bot": $(selector)[0].className += ' is-bot'; break;
			}
			// Plug ranks
			switch(sender.role) {
				case API.ROLE.HOST: $(selector)[0].className += ' is-host'; break;
				case API.ROLE.COHOST: $(selector)[0].className += ' is-cohost'; break;
				case API.ROLE.MANAGER: $(selector)[0].className += ' is-manager'; break;
				case API.ROLE.BOUNCER: $(selector)[0].className += ' is-bouncer'; break;
				case API.ROLE.DJ: $(selector)[0].className += ' is-dj'; break;
				case API.ROLE.NONE: $(selector)[0].className += ' is-user'; break;
			}
			// Additional ranks
			if (sender.sub == 1) $(selector)[0].className += ' is-subscriber';
			if (sender.silver) $(selector)[0].className += ' is-silversubscriber';
			if (sender.friend) $(selector)[0].className += ' is-friend';

			/* Chat images
			var imgRE = new RegExp(/(http(s)?:\/\/(www.)?).+\.(jpg|jpeg|gif|png|apng|svg|bmp)/ig);
			var result = msg.message.match(imgRE);
			if (typeof result !== 'null' && result.length > 0) {
				for (var i = 0; i < result.length; i++) {
					var link = '<img src="'+result[i]+'" alt="'+result[i]+'">';
					msg.message = msg.message.replace(result[i], link);
				}
				$(selector).find(".text")[0].innerHTML = msg.message;
			}
			*/

			// Self Deletion Magic
			if (msg.uid == pi.user.id && API.hasPermission(pi.user, API.ROLE.BOUNCER)) {
				$(selector)[0].className += ' deletable';
				$(selector).prepend('<div class="delete-button" style="display: none;">Delete</div>');
				$(selector).on('mouseenter', function(){
					$(selector).find('.delete-button')[0].style.display = 'block';
				});
				$(selector).on('mouseleave', function(){
					$(selector).find('.delete-button')[0].style.display = 'none';
				});
				$(selector).find('.delete-button').on('click', function(){
					API.moderateDeleteChat(msg.cid);
				});
			}
			// Auto AFK responder
			if (msg.type == 'mention' && settings.afk && msg.uid !== pi.user.id) {
				if (typeof afkMessage !== "undefined") API.sendChat('@'+msg.un + ' I am afk: '+afkMessage);
				else API.sendChat('@'+msg.un + ' I am afk.');
			}
		});
	}
	else {
		API.off(API.ADVANCE, apiAdvance);
		API.off(API.HISTORY_UPDATE);
		API.off(API.USER_JOIN);
		API.off(API.USER_LEAVE);
		API.off(API.VOTE_UPDATE, pi.voteAlert);
		API.off(API.CHAT_COMMAND, pi.chatCommand);
		API.off(API.CHAT);
	}
	// API addition
	if (!unload) {
		API.moderateForceQuit = function() {
			$.ajax({
				url: location.origin+'/_/booth/remove/'+API.getDJ().id,
				method: 'DELETE'
			});
		};
		API.getUserByName = function(name) {
			if (typeof name !== 'string') return console.error('Name must be a string');
			name = name.toLowerCase();
			var audience = API.getUsers();
			for (var i = 0; i < audience.length; i++) {
				if (audience[i].rawun.toLowerCase() == name) return audience[i];
			}
			return null;
		};
	}
	else {
		delete API.moderateForceQuit;
		delete API.getUserByName;
	}

	// #### [Events listener] ####
	// Navigation warning
	if (!unload) {
		window.onbeforeunload = function() {
			if (settings.navWarn) return '[Plug-It] Navigation warn: Are you sure you want to leave ?';
		};
	}
	else window.onbeforeunload = null;
	// Keyboard shorcuts
	if (!unload) {
		$(document).on('keydown', function(e) {
			if (settings.keyboardShortcuts) {
				switch (e.key) {
					case "+":
						if (!$($('#chat-input')).attr('class')) {
							API.setVolume(API.getVolume()+5);
							pi.setPlugSettings('volume', API.getVolume());
						}
					break;
					case "-":
						if (!$($('#chat-input')).attr('class')) {
							API.setVolume(API.getVolume()-5);
							pi.setPlugSettings('volume', API.getVolume());
						}
					break;
					case "l":
						if (e.ctrlKey) {
						e.preventDefault();
						API.sendChat("/clear");
					}
					break;
				}
			}
		});
	}
	else $(window).off('keydown');
	// ScrollWheel volume changer
	if (!unload) {
		$('#volume, #playback').on('mousewheel', function(e){
			e.preventDefault();
			if (e.originalEvent.deltaY > 0) API.setVolume(API.getVolume()-5);
			else API.setVolume(API.getVolume()+5);

			pi.setPlugSettings('volume', API.getVolume());
		});
	}
	else $('#volume, #playback').off('mousewheel');

	// setInterval
	if (!unload) {
		window.levelBarInfo = setInterval(function(){
			$('#footer-user .info .meta .bar .value')[0].innerHTML = $('#footer-user .info .meta .bar .value')[0].innerHTML.replace(/ [0-9]*%/g, '') + ' ' + $('#footer-user .info .progress')[0].style.width;
			
			if ($('#the-user-profile .experience.section .xp .value')[0]) {
				$('#the-user-profile .experience.section .xp .value')[0].innerHTML = $('#the-user-profile .experience.section .xp .value')[0].innerHTML.replace(/ [0-9]*%/g, '') + ' ' + $('#the-user-profile .experience.section .progress')[0].style.width;
			}
		}, 5*60*1000);
		window.friendsOnline = setInterval(function(){
			pi.getFriendsOnline(
				function(data) {
					var friends = JSON.parse(data).data;
					var friendsOnline = 0;
					for (var i = 0; i < friends.length; i++) {
						if (typeof friends[i].room !== 'undefined') friendsOnline++;
					}
					var count = $('#friends-button > span')[0].innerText.replace(/[0-9]*\//g,'');
					count = friendsOnline + '/' + count;
					$('#friends-button > span')[0].innerText = count;
				}
			)
		}, 30*1000);
		window.roomURL = location.pathname
		window.checkIfRoomChanged = setInterval(function(){
			if (location.pathname !== window.roomURL) {
				pi.log('Your room changed', 'info');
				window.roomURL = location.pathname; // If not set, script will reload infinitely
				clearInterval(checkIfRoomChanged);
				pi.reload();
			}
		}, 2*1000);
		window.checkIfUpdatesAvailable = setInterval(function(){pi.checkForUpdates()}, 30*60*1000);
	}
	else {
		clearInterval(levelBarInfo);
		clearInterval(friendsOnline);
		clearInterval(checkIfRoomChanged);
		clearInterval(checkIfUpdatesAvailable);

		window.levelBarInfo = undefined;
		window.friendsOnline = undefined;
		window.roomURL = undefined;
		window.checkIfRoomChanged = undefined;
		window.checkIfUpdatesAvailable = undefined;
	}

	// Creating DOM elements
	if (!unload) {
		updateStatus('Creating script environement', 5);
		// Menu icon
		$('#app').append($('<div id="pi-logo"><div id="icon"></div></div>'));
		// Menu itself
		$('#app').append($('<div id="pi-menu" style="visibility: hidden;">\
			<ul>\
				<h2>General</h2>\
				<ul>\
					<li id="pi-woot">'+lang.menu.aw+'</li>\
					<li id="pi-join">'+lang.menu.aj+'</li>\
					<li id="pi-keyShortcut">'+lang.menu.ks+'</li>\
					<li id="pi-mutemeh">'+lang.menu.mm+'</li>\
					<li id="pi-navWarn">'+lang.menu.nw+'</li>\
				</ul>\
				<h2>Customisation</h2>\
				<ul>\
					<li id="pi-video">'+lang.menu.hv+'</li>\
					<li id="pi-css">'+lang.menu.cs+'</li>\
					<li id="pi-bg">'+lang.menu.cb+'</li>\
					<li id="pi-old-chat">'+lang.menu.oc+'</li>\
				</ul>\
				<h2>Moderation</h2>\
				<ul>\
					<li id="pi-lengthA">'+lang.menu.sl+'</li>\
					<li id="pi-historyA">'+lang.menu.ha+'</li>\
				</ul>\
				<h2>Notifications</h2>\
				<ul>\
					<li id="pi-userJoin">'+lang.menu.uj+'</li>\
					<li id="pi-userLeave">'+lang.menu.ul+'</li>\
					<li id="pi-userGrab">'+lang.menu.ug+'</li>\
					<li id="pi-userMeh">'+lang.menu.um+'</li>\
				</ul>\
				<h2>About</h2>\
				<p>\
					Plug-It '+pi.version+'.<br>\
					Developed by: <a target="_blank" href="https://twitter.com/WiBla7" target="blank">@WiBla7</a><br>\
					<a target="_blank" href="https://chrome.google.com/webstore/detail/plug-it-extension/bikeoipagmbnkipclndbmfkjdcljocej">Rate the extension</a><br>\
					<a target="_blank" href="https://github.com/Plug-It/pi/tree/pre-release#contribute">Help translate !</a><br>\
					<a target="_blank" href="https://github.com/Plug-It/pi/issues">Bug report</a><br>\
					<span id="pi-off">'+lang.menu.s+'</span>\
				</p>\
			</ul>\
		</div>'));
		// Menu css
		$('head').append($('<link id="pi-menu-CSS" rel="stylesheet" type="text/css" href="'+pi.url.menu_css+'">'));
		// General css
		$('head').append($('<link id="pi-CSS\" rel="stylesheet\" type="text/css" href="">'));
		// Old chat css
		$('head').append($('<link id="pi-oldchat-CSS" rel="stylesheet" type="text/css" href="">'));
		// DelChat icon
		$('#chat-header').append('<div id="pi-delchat" class="chat-header-button">\
			<i class="icon pi-delchat"></i>\
		</div>');
		// If at least bouncer
		if (API.hasPermission(pi.user, API.ROLE.BOUNCER)) {
			// Moderation tools
			$('#playback-container').append($('<div id="pi-rmvDJ">\
				<img src="https://raw.githubusercontent.com/Plug-It/pi/pre-release/images/other/romveDJ.png" alt="button remove from wait-list" />\
			</div>\
			<div id="pi-skip">\
				<img src="https://raw.githubusercontent.com/Plug-It/pi/pre-release/images/other/skip.png" alt="button skip" />\
			</div>'));
		}
	}
	else {
		// Unbind events BEFORE removing elements
		$('#pi-logo, #pi-menu').off('click', function(e){
			switch (e.target.id) {
				case 'pi-logo':
				case 'icon':
				pi.menu(0); break;
				// General
				case 'pi-woot': pi.menu(1); break;
				case 'pi-join': pi.menu(2); break;
				case 'pi-keyShortcut': pi.menu(11); break;
				case 'pi-mutemeh': pi.menu(9); break;
				case 'pi-navWarn': pi.menu(10); break;
				// Customisation
				case 'pi-video': pi.menu(3); break;
				case 'pi-css': pi.menu(4); break;
				case 'pi-bg': pi.menu(5); break;
				case 'pi-old-chat': pi.menu(6); break;
				// Moderation
				case 'pi-lengthA': pi.menu(7); break;
				case 'pi-historyA': pi.menu(12); break;
				// Notifications
				case 'pi-userJoin': pi.menu(13); break;
				case 'pi-userLeave': pi.menu(14); break;
				case 'pi-userGrab': pi.menu(15); break;
				case 'pi-userMeh': pi.menu(8); break;
				// About
				case 'pi-off': pi.menu('kill'); break;
			}
		});
		$('#pi-menu h2').off('click', function(){
			$(this).next().slideToggle();
		});
		$('#pi-delchat').off('click', function(){API.sendChat('/clear');});

		$('*[id*="pi-"]').each(function(){
			this.remove();
		});
	}
	// Click Event Binding
	if (!unload) {
		$('#pi-logo, #pi-menu').on('click', function(e){
			switch (e.target.id) {
				case 'pi-logo':
				case 'icon':
				pi.menu(0); break;
				// General
				case 'pi-woot': pi.menu(1); break;
				case 'pi-join': pi.menu(2); break;
				case 'pi-keyShortcut': pi.menu(11); break;
				case 'pi-mutemeh': pi.menu(9); break;
				case 'pi-navWarn': pi.menu(10); break;
				// Customisation
				case 'pi-video': pi.menu(3); break;
				case 'pi-css': pi.menu(4); break;
				case 'pi-bg': pi.menu(5); break;
				case 'pi-old-chat': pi.menu(6); break;
				// Moderation
				case 'pi-lengthA': pi.menu(7); break;
				case 'pi-historyA': pi.menu(12); break;
				// Notifications
				case 'pi-userJoin': pi.menu(13); break;
				case 'pi-userLeave': pi.menu(14); break;
				case 'pi-userGrab': pi.menu(15); break;
				case 'pi-userMeh': pi.menu(8); break;
				// About
				case 'pi-off': pi.menu('kill'); break;
			}
		});
		$('#pi-menu h2').on('click', function(){
			$(this).next().slideToggle();
		});

		$('#pi-rmvDJ').on('click', function(){pi.removeDJ();});
		$('#pi-skip').on('click', function(){pi.forceSkip();});
		$('#pi-delchat').on('click', function(){API.sendChat('/clear');});
	}
	// Tooltips
	if (!unload) {
		$('#now-playing-media').on('mouseenter', function(){
			if (pi.getPlugSettings().tooltips) {
				pi.tooltip(true, 'left', $(this).offset().left+47,0, this.innerText);
			}
		});
		$('#pi-rmvDJ').on('mouseenter', function(){
			if (pi.getPlugSettings().tooltips) {
				var x = $(this).offset().left + ($(this).width()/2);
				var y = $(this).offset().top - ($(this).height()/2);
				pi.tooltip(true, 'left', x,y, 'Will remove the DJ from Wait-List and skip him.');
			}
		});
		$('#pi-skip').on('mouseenter', function(){
			if (pi.getPlugSettings().tooltips) {
				var x = $(this).offset().left + ($(this).width()/2);
				var y = $(this).offset().top - ($(this).height()/2);
				pi.tooltip(true, 'left', x,y, 'Will force skip the DJ.');
			}
		});
		$('#pi-delchat').on('mouseenter', function(){
			if (pi.getPlugSettings().tooltips) {
				var x = $(this).offset().left + ($(this).width()/2);
				var y = $(this).offset().top - ($(this).height()/2);
				pi.tooltip(true, 'left', x,y, 'Clear chat');
			}
		});
		$('#now-playing-media, #pi-rmvDJ, #pi-skip, #pi-delchat').on('mouseleave', function(){pi.tooltip();});
	}
	else {
		$('#now-playing-media, #pi-rmvDJ, #pi-skip, #pi-delchat').off('mouseenter');
		$('#now-playing-media, #pi-rmvDJ, #pi-skip, #pi-delchat').off('mouseleave');
	}

	// Fully loaded
	if (!unload) {
		pi.dom = {
			// Menu
			// General
			woot: $('#pi-woot')[0],
			join: $('#pi-join')[0],
			keyShortcut: $('#pi-keyShortcut')[0],
			betterMeh: $('#pi-mutemeh')[0],
			navWarn: $('#pi-navWarn')[0],
			// Customisation
			video: $('#pi-video')[0],
			css: $('#pi-css')[0],
			bg: $('#pi-bg')[0],
			oldChat: $('#pi-old-chat')[0],
			// Moderation
			lengthA: $('#pi-lengthA')[0],
			historyAlert: $('#pi-historyA')[0],
			// Notifications
			userJoin: $('#pi-userJoin')[0],
			userLeave: $('#pi-userLeave')[0],
			userGrab: $('#pi-userGrab')[0],
			mehA: $('#pi-userMeh')[0],
			// About
			off: $('#pi-off')[0],
			// Mod Bar
			rmvDJ: $('#pi-rmvDJ')[0],
			skip: $('#pi-skip')[0],
			// Other
			DelChat: $('#pi-delchat')[0],
			style: $('#pi-CSS')[0],
			oldStyle: $('#pi-oldchat-CSS')[0],
			// Plug
			stream: $('#playback-container')[0]
		};
		pi.menu('init');

		pi.log(pi.complete(lang.log.loaded));
		pi.log(lang.log.help, 'info', 'chat');
		pi.log('This is a pre-release, expect bugs !!!', 'warn', 'chat');
		$('#pi-status').css({opacity:'0'});
		setTimeout(function(){$('#pi-status').remove();}, 250);
	}
	
	// Preventing making the video definitly desapear
	if (unload && !settings.showVideo) {
		pi.menu(3);
		settings.showVideo = false;
		localStorage.setItem('pi-settings', JSON.stringify(settings));
		return 'unloaded';
	}
	if (unload) {
		sessionStorage.removeItem('modQuitWarn');
		sessionStorage.removeItem('modSkipWarn');
		sessionStorage.removeItem('trustWarn');
		return 'unloaded';
	}
},
reload: function() {
	pi.log(lang.log.reloading);
	if (pi.kill() == 'killed') $.getScript(scriptURL);
	else pi.log('Unexpected error, couldn\'t kill script', 'error');
},
kill: function() {
	if (pi.init(true) == 'unloaded') {
		window.scriptURL = pi.url.script; // Allow to reload
		pi = undefined;
		return 'killed';
	}
	else pi.log('Unexpected error, couldn\'t unload script', 'error');
},
checkForUpdates: function(isForced) {
	getLastCommit('https://api.github.com/repos/Plug-It/pi/commits/pre-release', function(data){
		var lastCommit = JSON.parse(data.currentTarget.responseText);
		if (thisCommit.sha !== lastCommit.sha) {
			if (isForced) {
				pi.log(lang.log.forcingReload);
				pi.reload();
			}
			else pi.log('An update is available:\n'+lastCommit.commit.message+'\n\nClick here to reload.', 'info', 'chat', function(){pi.reload();});
		}
	});
}};
// end of 'pi' declaration
function wait(){
	if (typeof lang !== 'object' || typeof ranks !== 'object') {setTimeout(wait, 200);}
	else pi.init();
}
wait();
})();
