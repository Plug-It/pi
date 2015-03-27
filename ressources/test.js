var afk = false, version = "Alpha 1.0";

API.on(API.USER_JOIN, sayHello);
function sayHello(obj) {
	API.sendChat("/me Rebonjour, " + obj.username);
}

API.on(API.USER_LEAVE, sayBye);
function sayBye(obj) {
    API.sendChat("/me Bye " + obj.username + " !");
}


API.on(API.CHAT_COMMAND, chatCommand);
function chatCommand (commande) {
	var args = commande.split(" ");
	switch (args[0]) {
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
			
		case "/lockskip":
			/* TOO FAST
			API.moderateLockWaitList(true, false);
			API.moderateForceSkip();
			API.moderateLockWaitList(false, false);
			*/
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
			API.chatLog("/eta renvois le temps restant avant que vous soyez DJ");
			API.chatLog("/vol [0-100] change le volume");
			API.chatLog("/lockskip WIP");
			API.chatLog("/afk envoie un message d'afk (à faire deux fois)");
			API.chatLog("/list affiche cette liste");
		break;
			
		default:
			API.chatLog("Essayez /list");
		break;
	}
}

API.sendChat("/me WiBot loaded ! Running Version " + version);