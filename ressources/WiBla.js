// For any informations about the license, go to:
// http://github.com/WiBla/WiBla-Script/blob/master/LISCENCE.md


if (!document.getElementById('Css-WiBla')) {
	var head  = document.getElementsByTagName('head')[0];
	var link  = document.createElement('link');
	link.id   = 'Css-WiBla';
	link.rel  = 'stylesheet';
	link.type = 'text/css';
	link.href = 'https://dl.dropboxusercontent.com/s/fhzczaak292uim3/WiBla.css';
	head.appendChild(link);
	//le menu de contrôle du script
	var Box = $('<div id="Box" onclick="slide()"><h1>W</h1></div>');
	$('#app-menu').after(Box);
	var Settings = $('<div id="Settings"><ul><li id="one" onclick="autoW = !autoW;autowoot()">Auto-woot</li><li id="two" onclick="autoDj = !autoDj;autojoin()">Auto-join</li><li id="three" onclick="hideStream()">Hide video</li><li id="four" onclick="del()">Clear Chat</li><li id="seven" onclick="Css()">Custom Css</li><li id="eight" onclick="WiBla_Script_Shutdown()">Shutdown</li><li id="ten" onclick="askBg()">Custom Bg</li><li id="eleven" onclick="durationAlert = !durationAlert;alertDuration()">Duration alert</li><li id="nine">Official 6.1</li></ul></div>');
	$('#app-menu').after(Settings);
	//l'user doit être du staff pour voir le bouton skip, même s'il le verais il ne pourrais rien faire
	var isDev = (API.getUser().id==4506088) || (API.getUser().id == 4613422);
	if (API.hasPermission(null, API.ROLE.BOUNCER) || isDev) {
		var Controls = $('<div id="remove" onclick="removeDJ();"><img src="https://dl.dropboxusercontent.com/s/ou587hh6d0ov90w/romveDJ.png" alt="button remove from wait-list" /></div><div id="skip" onclick="API.moderateForceSkip();"><img src="https://dl.dropboxusercontent.com/s/0fn3plmg2yhy6rf/skip.png" alt="button skip"/></div>');
		$('#playback-container').after(Controls);
	}
	init();
}

function init() {
	box = document.getElementById('Box');
	settings = document.getElementById('Settings');
	css = document.getElementById('Css-WiBla');
	remove = document.getElementById('remove');
	skip = document.getElementById('skip');
	autoWoot = document.getElementById('one');
	autoJoin = document.getElementById('two');
	video = document.getElementById('three');
	custom = document.getElementById('seven');
	info = document.getElementById('nine');
	eleven = document.getElementById('eleven');
	//plug
	body = document.getElementsByTagName('body');
	stream = document.getElementById('playback-container');
	playback = document.getElementById('playback');
	//le reste
	fond = document.querySelector('.room-background');
	fond.setAttribute('onclick', 'show=true;slide()');
	autowoot();
	custom.style.color = "green";
	autoWoot.style.colot = "green";
}

var show, autoW, autoDj, showVideo, isOn, durationAlert, notif, afk;
show = autoW = autoDj = isOn = durationAlert = afk = false;
showVideo = true;
notif = new Audio('https://dl.dropboxusercontent.com/s/2oof758mv1hjc2r/notif.wav');

$(window).bind('keydown', function (k) {
	if (k.keyCode == 107) {
		var volume = API.getVolume();
		volume += 3;
		API.setVolume(volume);
	}
});
$(window).bind('keydown', function (k) {
	if (k.keyCode == 109) {
		var volume = API.getVolume();
		volume -= 3;
		API.setVolume(volume);
	}
});
API.on(API.CHAT_COMMAND, chatCommand);
function chatCommand (commande) {
	var args = commande.split(" ");
	switch (args[0]) {
			
		case "/like":
			API.sendChat(":heart_eyes::heartpulse::heart_eyes::heartpulse::heart_eyes:");
		break;
		
		case "/love":
			if (args[1] === undefined) {
				API.sendChat(":heart_eyes::heartpulse::heart_eyes::heartpulse::heart_eyes::heartpulse::heart_eyes::heartpulse::heart_eyes::heartpulse:");
			} else {
				API.sendChat(args[1] + " :heart_eyes::heartpulse::heart_eyes::heartpulse::heart_eyes::heartpulse::heart_eyes::heartpulse::heart_eyes::heartpulse:");
			}
		break;
			
		case "/eta":
			if (API.getWaitListPosition() == -1) {
				API.chatLog("Vous n'êtes pas dans la liste d'attente.");
			} else {
				var eta = API.getWaitListPosition() + 1; //index 0
				eta = eta * 4; //we assume that everyone plays 4mins music
				eta = eta * 60; //transform in second
				eta = eta + API.getTimeRemaining(); //to add the time remaining
				eta = eta / 60; //then split in minutes
				eta = Math.round(eta, 1); //gives a rounded result
				if (eta >= 60) {
					var etaH = eta / 60;
					etaH = Math.round(etaH, 1); //gives hours
					var etaM = eta % 60; //gives minutes
					API.chatLog("Il reste " + etaH + "H" + etaM + "min(s) avant votre passage.");
				} else {
					API.chatLog("Il reste " + eta + " minute(s) avant votre passage.");
				}
			}
		break;
		
		case "/vol":
			if (args[1] >= 0 && args[1] <= 100) {
				API.setVolume(args[1]);
			} else {
				API.chatLog("Spécifier un chiffre entre 0 et 100");
			}
		break;
			
		case "/afk":
			afk = !afk;
			if (afk) {
				API.sendChat("/me est AFK.");
			} else {
				API.sendChat("/me n'est plus AFK.");
			}
		break;
			
		case "/list":
			API.chatLog("/like <3 x 5");
			API.chatLog("/love [@user] <3 x 10 + user(optionel)");
			API.chatLog("/eta renvois le temps restant avant que vous soyez DJ");
			API.chatLog("/vol [0-100] change le volume");
			API.chatLog("/afk envoie un message d'afk (à faire deux fois)");
			API.chatLog("/list affiche cette liste");
		break;
			
		default:
			API.chatLog("Essayez /list");
		break;
	}
}

function slide() {
	show = !show;
	// "glissement" du menu
	settings.style.WebkitTransition = "all 0.3s";
    settings.style.transition = "all 0.3s";
	// les deux états
	if (show === false) {
		settings.style.visibility = "hidden";
		settings.style.height = "0";
	} else if (show === true) {
		settings.style.visibility = "visible";
		settings.style.height = "234px";
	}
}
API.on(API.ADVANCE, autowoot);
function autowoot() {
	if (autoW === true) {
		$("#woot").click();//émule le click sur #woot
		autoWoot.style.color = "green";
	} else {
		autoWoot.style.color = "";
	}
}
API.on(API.ADVANCE, autojoin);
function autojoin() {
	var dj = API.getDJ();
	if (autoDj) {
		autoJoin.style.color = "green";
		if (dj === null || dj.id !== API.getUser().id || API.getWaitListPosition() > -1) {
			$('#dj-button.is-wait').click();
		}
	} else {
		autoJoin.style.color = "";
	}
}
function hideStream() {
	showVideo = !showVideo;
	// "glissement" du playback
	stream.style.WebkitTransition = "all 0.25s";
    stream.style.transition = "all 0.25s";
	// les deux états
	if (showVideo === false) {
		stream.style.visibility = "hidden";
		stream.style.height = "0";
		remove.style.top = skip.style.top = "0";
		document.getElementById('playback-controls').style.visibility = "hidden";
		video.style.color = "green";
	} else if (showVideo === true) {
		stream.style.visibility = "visible";
		stream.style.height = "281px";
		remove.style.top = skip.style.top = "283px";
		document.getElementById('playback-controls').style.visibility = "visible";
		video.style.color = "";
	}
}
function del() {
	document.getElementById('chat-messages').innerHTML = '';
}
function Css() {
	isOn = !isOn;
	if (isOn) {
		link.href = 'https://dl.dropboxusercontent.com/s/lf8ut4vx8msytzq/no.css';
		custom.style.color = "";
	} else {
		link.href = 'https://dl.dropboxusercontent.com/s/fhzczaak292uim3/WiBla.css';
		custom.style.color = "green";
	}
}
function WiBla_Script_Shutdown() {
	$(window).unbind();
	API.stopListening(API.CHAT_COMMAND, chatCommand);
	//pour éviter que la balise ne soit définitivement caché
	if (showVideo === false) {
		//on éxecute la commande à la place de l'user
		hideStream();
		setTimeout(WiBla_Script_Shutdown,500);
	}
	var parent = document.getElementById("app");
	parent.removeChild(box);
	parent.removeChild(settings);
	head.removeChild(css);
	if  (API.hasPermission(null, API.ROLE.BOUNCER) || (isDev)) {
		playback.removeChild(remove);
		playback.removeChild(skip);
	}
}
function askBg() {
	var bg = prompt('URL de votre fond');
	if (bg !== null) {
		fond.setAttribute('style', 'background: url(' + bg + ');');
	}
}
API.on(API.ADVANCE, alertDuration);
function alertDuration() {
	if (durationAlert) {
		eleven.style.color = "green";
		if (API.getTimeRemaining() > 435 && API.getTimeRemaining() < 1) {
			API.chatLog('Cette musique dépasse les 7 minutes 15 secondes autorisé !');
			notif.play();
		}
	} else {
		eleven.style.color = "";
	}
}
function removeDJ() {
	API.chatLog('Ce boutton enlèvera le dj actuel de la wait-list, mais il n\'est pas encore au point.');
}

API.chatLog('WiBla-Script 6.1 !');