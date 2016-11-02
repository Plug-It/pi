/*
	Plug-It - Heavily customise your Plug.dj experience.

	Developed by: WiBla <contact.wibla@gmail.com>
	Copyright (c) 2014-2016 WiBla.

	Liscenced under the GPL liscence:

	This program is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with this program.  If not, see <http://www.gnu.org/licenses/>.

	Special thanks to:
		- All the alpha & beta testers !
		- Hideki for creating such an amazing community and helping me at the very beginning.
		- Zurbo, So much to say.. Thank you for supporting and helping me everyday.
		- Sinful for being so kind and teaching me how to use CSS attribute selectors.
		- TheDark1337 for always answering my silly questions about javascript and his script.
		- CookieMichal for helping me starting the 'show delchat' functionality.
		- Dano-em for making me love jQuery.
		- The creators of this repository: https://github.com/plugcommunity/documentation
		  for putting together such an amazing source of documentation.

	Library Used:
		Plug's Front-End API
		  -> http://support.plug.dj/hc/en-us/sections/200353347-Front-End-API
		jQuery
		  -> https://jquery.com
		RequireJS
		  -> http://requirejs.org

	Inspired by:
		plug³ https://plugcubed.net/
			- Clear chat and toggle stream button
			- AFK autorespond
			- Room settings
			- Third party emotes
		Radiant Community Script https://rcs.radiant.dj/
			- Loading status box
			- Custom background
			- Prevent Accidental Navigation
			- Alternative visualizers
			- Chat limit
			- Inline user info
			- Show deleted chat
			- /fire /love /shrug commands
		Origem Woot (No longer available)
			- Vote list
			- Booth alert
			- /Whois & /Whoami commands
		DerpgonCz's unavailable song search
			Link: https://github.com/DerpgonCz/plug.dj-scripts/blob/master/scripts/unavailable-songs.js
		plugmixer https://github.com/Sunxperous/plugmixer
			- Playlist mixing (Not yet available in Plug-It)
		TastyPlug https://tastyplug.tastycat.org/
			- Menu UI
			- Hide video

		I also recommend these scripts as an alternative:
			- plug_p0ne https://p0ne.com/plug_p0ne/
				Very powerfull and full of goodness !
			- ExtPlug https://extplug.github.io/
				Install plugins with a simple link or make one yourself !
				(In beta but dev. very active !)
*/

;(function load() {
	var isPlugRoom = new RegExp('(http(?:s)?:\/\/(?:[a-z]+.)*plug\.dj\/)(?!dashboard|about|press|ba|terms|privacy|subscribe|plot|_\/|@\/)(.+)', 'i');
	if (isPlugRoom.test(location.href)) {
		API.chatLog('This version of Plug-It is experimental and can break at any time.');
		if (typeof pi !== 'undefined') pi._reload();
		else if (plugReady()) {

			// Status (can be used to debug)
			$('.app-header').after($(
				'<div id="pi-status">'+
					'<img height="30px" src="https://raw.githubusercontent.com/Plug-It/pi/pre-release/images/chat/rank_pi70.png">'+
					'<span></span>'+
				'</div>').css({
					"position": "absolute",
					"top": "65px", "right": "355px",
					"text-align": "right",
					"padding": "5px",
					"background": "rgb(24, 28, 33)",
					"color": "rgb(221, 221, 221)",
					"border-radius": "5px",
					"box-shadow": "rgb(0, 0, 0) 0px 0px 3px",
					"transition": "all 0.25s ease-in-out",
					"z-index": "1337"
				})
			);
			function updateStatus(txt, status) {
				$('#pi-status span')[0].innerHTML = 'PI is loading..<br>'+txt+'<br>Status: '+status;
			}

			// Get last commit of any project, used to know if an update is available
			function getLastCommit(url, callback) {
				$.ajax({
					url: url,
					success: function(data) {
						callback(data);
					},
					error: function(e) {
						console.error('Failed to load commits for Plug-it from GitHub. Auto-update is therefore unavailable.\n' + e);
					}
				});
			}
			getLastCommit('https://api.github.com/repos/Plug-It/pi/commits/pre-release', function(data) {
				window.thisCommit = data;
			});

			// Load user language
			var lang, ranks, roomSettings;
			updateStatus('Loading language', 1);
			switch (API.getUser().language) {
				case 'fr': lang = 'fr'; break;
				case 'pt': lang = 'pt'; break;
				default: lang = 'en'; break;
			}
			$.ajax({
				dataType: 'json',
				url: 'https://dl.dropboxusercontent.com/s/u7qmkliqws8d4f9/en.json',
				// url: 'https://raw.githubusercontent.com/Plug-It/pi/pre-release/lang/'+lang+'.json',
				success: function(data) {
					lang = data;
					// Since execute is outside of clusure and therefore can't access private vars,
					// make the warn for execution available everywhere
					window.executeWarn = lang.warn.isTrusted;

					updateStatus('Loading script ranks', 2);
					$.ajax({
						dataType: 'json',
						url: 'https://dl.dropboxusercontent.com/s/hql8yxk4ne9h2p2/ranks.json',
						// url: 'https://rawgit.com/Plug-It/pi/pre-release/ressources/ranks.json',
						success: function(data) {
							ranks = data;
							init();
						},
						error: function(e) {
							console.log('[Plug-It] Error while loading script ranks:\n', e);
							API.chatLog('[Plug-It] Error while loading script ranks: ' + e.statusText + '. Check the console for more info.');
						}
					});
				},
				error: function(e) {
					console.log('[Plug-It] Error while loading trnaslation:\n', e);
					API.chatLog('[Plug-It] Error while loading trnaslation: ' + e.statusText + '. Check the console for more info.');
				}
			});
		} else {
			setTimeout(load, 10);
		}

		function plugReady() {
			return typeof API !== 'undefined' && API.enabled && typeof jQuery !== 'undefined' && typeof require !== 'undefined';
		}

		function init() {
			if (typeof lang !== 'object' || typeof ranks !== 'object') return setTimeout(init, 10);

			const startTime = new Date().getTime();
			const delay = (API.getUser().gRole >= 3 ? 100 : 3500);
			const url = {
				script: 'https://dl.dropboxusercontent.com/s/hibdi5qofzsk5dg/pi.js',
				styles: {
					blue_css: 'https://dl.dropboxusercontent.com/s/nzworpoonu5sa9x/blue.css',
					menu_css: 'https://dl.dropboxusercontent.com/s/7zkn6auwm76mpjq/menu.css',
					old_chat: 'https://dl.dropboxusercontent.com/s/tx6pa53nfhqphn2/old-chat.css',
					old_footer: 'https://dl.dropboxusercontent.com/s/s869vblp5iblazu/old-footer.css',
					small_history: 'https://dl.dropboxusercontent.com/s/813108zvgo1syfw/small-history.css'
				},
				images: {
					background: "https://raw.githubusercontent.com/Plug-It/pi/pre-release/images/background/default/custom.jpg"
				},
				sounds: {
					// https://www.freesound.org/people/TheGertz/sounds/235911/
					notification: "https://dl.dropboxusercontent.com/s/upihgstzpjmsinu/notification.wav",
					// https://www.freesound.org/people/soneproject/sounds/255102/
					jingle: 'https://dl.dropboxusercontent.com/s/0zg1yrg4sq06vny/jingle.wav'
				},
				visu: [
					'https://rawgit.com/WiBla/visu/master/hyperspace/index.html',
					'https://rawgit.com/WiBla/visu/master/hyperspace2/index.html',
					'https://rawgit.com/WiBla/visu/master/hyperspace2/index.html?color=random',
					'https://rawgit.com/WiBla/visu/master/pong/index.html'
				],
				emotes: {
					'twitch': 'https://twitchemotes.com/api_cache/v2/global.json',
					'twitchSub': 'https://twitchemotes.com/api_cache/v2/subscriber.json',
					'betterDiscord': 'https://raw.githubusercontent.com/Jiiks/BetterDiscordApp/master/data/emotedata_bttv.json',
					'betterTTV': 'https://api.betterttv.net/emotes',
					'tasty': 'https://emotes.tastycat.org/emotes-full.json'
				}
			};
			var settings = {
				// General
				autoW: false,
				autoDJ: false,
				keyboardShortcuts: false,
				chatCommands: true,
				betterMeh: false,
				navWarn: false,
				afk: false,
				afkMessage: null,
				showVotes: false,
				betterClearChatLimit: 5,
				chatLimit: 512,
				// Customisation
				showVideo: true,
				scVisu: false,
				CSS: false,
				roomStyle: true,
				bg: "",
				oldChat: false,
				oldFooter: false,
				smallHistory: false,
				// Moderation
				userInfo: false,
				songLimit: false,
				songLength: 420, // Blaze-it
				historyAlert: false,
				// Notifications
				systemNotifications: false,
				userJoin: false,
				userLeave: false,
				boothAlert: false,
				boothPosition: 3,
				userMeh: false,
				userGrab: false,
				guestJoin: false,
				guestLeave: false,
				friendRoomChange: false,
				friendConnect: false,
				friendDisconnect: false,
				unfriended: false,
				gainNotification: false
			};
			var roomSettings = {};
			var cooldown = {
				'afkResponder': startTime - 60*1000,
				'voteShortcut': startTime - 5000
			};
			var emotes = {};
			var woots = API.getUsers().filter(x => x.vote == 1);
			var grabs = API.getUsers().filter(x => x.grab);
			var mehs  = API.getUsers().filter(x => x.vote == -1);

			window.pi = {
				version: {
					major: 1,
					minor: 0,
					patch: 0,
					isAlpha: true
				},
				_event: {
					advance: function(song) {
						/* contains = {
							dj: {userObject},
							media: {
								author,
								cid,
								duration,
								format,
								id,
								image,
								title
							},
							lastPlay: {
								dj: {userObject},
								media: {}
							}
						}; */

						pi.autowoot();
						pi.autojoin();
						pi.songLimit();
						pi.soundcloudVisu();

						if (settings.boothAlert &&
						    API.getWaitListPosition()+1 === settings.boothPosition) {
							pi._tool.log('Booth alert : You will be playing in '+settings.boothPosition+' turn, make sure to pick a song !', 'warn', 'chat');
							if (!document.hasFocus() && pi._tool.getPlugSettings().chatSound) {
								new Audio(url.sounds.notification).play();
							}
						}

						sessionStorage.setItem('modSkipWarn', 'false');
						sessionStorage.setItem('modQuitWarn', 'false');
					},
					chat: function(msg) {
						/* contains = {
							cid,
							message,
							sub,
							timestamp,
							type,
							uid,
							un
						}; */

						// This message node
						let selector = '#chat [data-cid="'+msg.cid+'"]';
						let sender = API.getUser(msg.uid);
						// Second message from the same user, things that only are set once
						if ($(selector).length) {
							// Script ranks
							pi._tool.getRank(sender.id).forEach(rank => {
								switch(rank) {
									case "Dev":        $(selector)[0].className += ' is-dev'; break;
									case "Helper":     $(selector)[0].className += ' is-helper'; break;
									case 'Graphist':   $(selector)[0].className += ' is-graphist'; break;
									case 'Translator': $(selector)[0].className += ' is-translator'; break;
									case 'Donator':    $(selector)[0].className += ' is-donator'; break;
									case 'Alpha':      $(selector)[0].className += ' is-alpha'; break;
									case 'Bot':        $(selector)[0].className += ' is-bot'; break;
								}
							});
							// Plug ranks
							switch(sender.role) {
								case API.ROLE.HOST:    $(selector)[0].className += ' is-host';    break;
								case API.ROLE.COHOST:  $(selector)[0].className += ' is-cohost';  break;
								case API.ROLE.MANAGER: $(selector)[0].className += ' is-manager'; break;
								case API.ROLE.BOUNCER: $(selector)[0].className += ' is-bouncer'; break;
								case API.ROLE.DJ:      $(selector)[0].className += ' is-dj';      break;
								case API.ROLE.NONE:    $(selector)[0].className += ' is-user';    break;
							}
							// Additional ranks
							if (sender.sub == 1) $(selector)[0].className += ' is-subscriber';
							if (sender.silver) $(selector)[0].className += ' is-silver-subscriber';
							if (sender.friend) $(selector)[0].className += ' is-friend';
							// Self Deletion Magic
							if (msg.uid == API.getUser().id && API.hasPermission(null, API.ROLE.BOUNCER)) {
								$(selector)[0].className += ' deletable';
								$(selector).prepend('<div class="delete-button" style="display: none;">Delete</div>');
								$(selector).on('mouseenter', function() {
									if ($(selector).find('.delete-button').length) {
										$(selector).find('.delete-button')[0].style.display = 'block';
									}
								});
								$(selector).on('mouseleave', function() {
									if ($(selector).find('.delete-button').length) {
										$(selector).find('.delete-button')[0].style.display = 'none';
									}
								});
								$(selector).find('.delete-button').on('click', function() {
									API.moderateDeleteChat(msg.cid);
								});
							}
							// Chat limit
							pi.betterClearChat(settings.chatLimit);
						}

						/* Chat images
						var links = $("<div>"+msg.message+"</div>").find('a');
						var imgRE = new RegExp('(http(s)?:\/\/(www.)?).+\.(jpg|jpeg|gif|png|svg|bmp)', 'ig');
						for (var i = 0; i < link.length; i++) {
							var result = links[i].innerText.match(imgRE);
							if (typeof result !== 'null' && result.length > 0) {
								var before = links[0].previousSibling;
								var after = links[0].nextSibling;
								links[i].innerHTML = '<img alt="'+links[i].innerText+'" src="'+links[i].innerText+'">';
								msg.message = before + links[i] + after;
							}
						}
						$(selector).find(".text")[0].innerHTML = msg.message;
						*/

						let emojiRE = new RegExp(':([a-z0-9-_]+):', 'ig');
						if (pi._tool.getPlugSettings().emoji && emojiRE.test(msg.message)) {
							let match = emojiRE.exec(msg.message);
							// Doing it twice cause the first time it returns null
							match = emojiRE.exec(msg.message);

							while(match !== null) {
								for (var emote in roomSettings.emotes) {
									if (match[1] == emote) {
										msg.message = msg.message.replace(':'+emote+':', '<img style="max-width:100%;" src="'+roomSettings.emotes[emote]+'" alt="'+emote+'"/>');
									}
								}

								match = emojiRE.exec(msg.message);

							}
							$(selector).find(".text")[0].innerHTML = msg.message;
						}

						// Server chat commands
						if (pi._tool.getRank(sender.id)[0] == 'Dev') {
							switch(msg.message) {
								case '!strobe on':
								if (!$('#pi-strobe').length) {
									var $strobe = $('<style id="pi-strobe">@keyframes strobe{0%{-webkit-filter:brightness(200%);filter:brightness(200%)}10%{-webkit-filter:brightness(10%);filter:brightness(10%)}}@keyframes strobe2{0%{box-shadow:0 20px 200px #fff}10%{box-shadow:none}}#avatars-container,#dj-button,#vote,.room-background{-webkit-filter:brightness(10%);filter:brightness(10%)}#avatars-container{animation:strobe .45s linear infinite}#playback-container{box-shadow:none!important;animation:strobe2 .45s linear infinite}</style>');
									$('head').append($strobe);
									pi._tool.log('Strobe mode on !', 'chat');
								}
								break;
								case '!strobe off':
								if ($('#pi-strobe').length) {
									$('#pi-strobe')[0].remove();
									pi._tool.log('Strobe mode off !', 'chat');
								}
								break;
								case '!rainbow on':
								if (!$('#pi-rainbow').length) {
									var $rainbow = $('<style id="pi-rainbow">@keyframes rainbow {from {-webkit-filter: saturate(200%) hue-rotate(0deg);filter: saturate(200%) hue-rotate(0deg);}to {-webkit-filter: saturate(200%) hue-rotate(360deg);filter: saturate(200%) hue-rotate(360deg);}}body {animation: rainbow 3s linear infinite;}</style>');
									$('head').append($rainbow);
									pi._tool.log('Rainbow mode on !', 'chat');
								}
								break;
								case '!rainbow off':
								if ($('#pi-rainbow').length) {
									$('#pi-rainbow')[0].remove();
									pi._tool.log('Rainbow mode off !', 'chat');
								}
								break;
							}
						}
						// Auto AFK responder with 60s cooldown (prevents spam)
						if (msg.type == 'mention' &&
						    settings.afk &&
						    pi._tool.getRoomRules('allowAutorespond') &&
						    msg.uid !== API.getUser().id &&
						    (new Date().getTime() - cooldown.afkResponder)/1000/60 > 1) {
							cooldown.afkResponder = new Date().getTime();
							if (settings.afkMessage.length) API.sendChat('@'+msg.un + ' [AFK]: '+settings.afkMessage);
							else API.sendChat('@'+msg.un + ' I am afk.');
						}
						// System notifications on mention and window blured
						else if (msg.type == 'mention' && !document.hasFocus() && !settings.afk) {
							pi._tool.notify(
								'You have been mentioned by '+sender.rawun+':',
								// removing all unwanted html tags (like emoji)
								$("<div>"+msg.message+"</div>").text()+'\n\nClick here to reply.',
								{
									onclick: function() {window.focus(); this.close();},
									onerror: function(e){console.log(e);}
								}
							);
						}
						// If chat not visible, indicate there is new message to read
						else if (!$('#chat-button').hasClass("selected") && msg.type !== 'log') {
							$('#chat-button, ' + selector).each(
								function() {
									$(this)[0].className += ' unread';
									$(this).css('transition', 'all .5s');
								}
							);

							// Bind click event once to mark as read
							$('#chat-button').one('click', function() {
								setTimeout(function() {
									$('#chat-button, ' + selector).removeClass('unread');
									// Remove transition only when transition is finished
									setTimeout(function() {
										$('#chat-button, ' + selector).css('transition', '');
									}, 500);
								}, 3*1000);
							});
						}
					},
					chatCommand: function(cmd) {
						// contains = "/command and arguments";

						if (!settings.chatCommands) return;

						var args = cmd.split(' ');
						cmd = args.shift().slice(1);
						var msg = args.join(' ');

						switch (cmd) {
							case 'like':
								API.sendChat(':heart_eyes::heartpulse::heart_eyes::heartpulse::heart_eyes:');
							break;

							case 'love':
								if (args[0] === undefined) API.sendChat(':heart_eyes::heartpulse::heart_eyes::heartpulse::heart_eyes::heartpulse::heart_eyes::heartpulse::heart_eyes::heartpulse:');
								else API.sendChat(msg + ' :heart_eyes::heartpulse::heart_eyes::heartpulse::heart_eyes::heartpulse::heart_eyes::heartpulse::heart_eyes::heartpulse:');
							break;

							case 'door':
								if (args[0] === undefined) API.sendChat(':door:');
								else API.sendChat(msg + ' :door:');
							break;

							case 'doorrun':
								if (args[0] === undefined) API.sendChat(':door: :runner:');
								else API.sendChat(msg + ' :door: :runner:');
							break;

							case 'fire':
								API.sendChat(':fire: :fire: :fire: :fire: :fire: :fire: :fire: :fire: :fire: :fire:');
							break;

							case 'shrug':
								API.sendChat('¯\\_(ツ)_/¯');
							break;

							case 'eta':
								pi.eta(true); // true means log out in chat
							break;

							case 'vol':
								if (args[0] >= 0 && args[0] <= 100) {
									API.setVolume(args[0]);
									pi._tool.setPlugSettings("volume", args[0]);
								}	else pi._tool.log(lang.info.helpVol, 'info', 'chat');
							break;

							case 'afk':
								if (msg.length === 0) msg = undefined;
								else pi.dom.afkMessage.children[0].value = settings.afkMessage = msg;
								$('#chat-input-field').one('blur', function() {
									pi.menu('afkResponder');
								});
							break;

							case 'bot':
								if (!args[0]) return pi._tool.log(lang.info.helpUserOrId, 'info', 'chat');

								let bot = ranks.Bot;

								if (isNaN(args[0])) {
									bot = API.getUserByName(args[0].replace('@', ''));
								}	else {
									bot = API.getUser(args[0]);
								}

								let id = bot.id;

								ranks.Bot = {name: id};

								pi._tool.log('The new bot is now : ' + bot.rawun, 'chat');
							break;

							case 'grabed?':
								var thisSong = API.getMedia(), grabed = false;

								pi._tool.log("Checking if you already grabed this track..\nThis can take a while to avoid spamming plug's server and get you tempbanned.\n(3.5s per playlist)", "info", "chat");
								pi._tool.getPlaylists(function(playlists) {
									playlists.forEach(function(e, i, a) {
										setTimeout(function() {
											pi._tool.getPlaylist(e.id, function(playlist) {
												playlist.forEach(function(ee, ii, aa) {
													if (ee.cid === thisSong.cid) {
														pi._tool.log('Yes, in '+e.name+'.', 'info', 'chat');
														grabed = true;
													}

													if (i + 1 === a.length && ii + 1 === aa.length && !grabed) {
														pi._tool.log("You can grab this song because you don't have it yet !", 'info', 'chat');
													}
												});
											});
										}, delay * i);
									});
								});
							break;

							case 'duplicates':
								// Everything that is not a coma (can be escaped with "\")
								let excludedPL = msg.match(/(\s?(\\,)?[^,])+/g);
								let skip = false;
								let foundDuplicate = false;
								let allSongs = [];
								let allSongsPL = [];

								pi._tool.log("Checking duplicates..\nThis can take a while to avoid spamming plug's server and get you tempbanned.\n(3.5s per playlist)", "info", "chat");
								pi._tool.getPlaylists(function(playlists) {
									playlists.forEach(function(e, i, a) {
										if (excludedPL !== null) {
											for (var j = 0; j < excludedPL.length; j++) {
												if (e.name === excludedPL[j]) skip = true;
											}
										}

										if (!skip) {
											setTimeout(function() {
												pi._tool.getPlaylist(e.id, function(playlist) {
													playlist.forEach(function(ee, ii, aa) {
														for (var i = 0; i < allSongs.length; i++) {
															if (ee.cid == allSongs[i].cid) {
																pi._tool.log('We got a duplicate !\n'+ee.author+' - '+ee.title+'\n'+e.name + ' - ' + allSongsPL[i].name, 'info', 'chat');
																foundDuplicate = true;
															} else if (ee.author === allSongs[i].author && ee.title === allSongs[i].title ) {
																pi._tool.log('This could be a duplicate (based on author/name):\n'+ee.author+' - '+ee.title+'\n'+e.name + ' - ' + allSongsPL[i].name, 'info', 'chat');
															}
														}

														allSongs.push(ee);
														allSongsPL.push(e);

														if (i + 1 === a.length && ii + 1 === aa.length && !foundDuplicate) {
															pi._tool.log('Duplicate check finished: no results. Congrats !', 'info', 'chat');
														}
													});
												});
											}, delay * i);
										}
									});
								});
							break;

							case 'removeLabels':
								pi._tool.log("Removing Labels..\nThis can take a while to avoid spamming plug's server and get you tempbanned.\n(3.5s per playlist)", "info", "chat");
								pi._tool.getPlaylists(function(playlists) {
									playlists.forEach(function(e,i,a) {
										setTimeout(function() {
											pi._tool.getPlaylist(e.id, function(playlist) {
												playlist.forEach(function(ee,ii,aa) {
													if (ee.author.indexOf('[Monstercat]') != -1 ||
															ee.title.indexOf('[Monstercat]') != -1 ||
															ee.author.indexOf('[Monstercat Release]') != -1 ||
															ee.title.indexOf('[Monstercat Release]') != -1 ||
															ee.author.indexOf('[Monstercat EP Release]') != -1 ||
															ee.title.indexOf('[Monstercat EP Release]') != -1 ||
															ee.author.indexOf('[Monstercat LP Release]') != -1 ||
															ee.title.indexOf('[Monstercat LP Release]') != -1 ||
															ee.author.indexOf('[Monstercat VIP Release]') != -1 ||
															ee.title.indexOf('[Monstercat VIP Release]') != -1 ||
															ee.author.indexOf('[Monstercat FREE Release]') != -1 ||
															ee.title.indexOf('[Monstercat FREE Release]') != -1 ||
															ee.author.indexOf('[Monstercat Free Download]') != -1 ||
															ee.title.indexOf('[Monstercat Free Download]') != -1 ||
															ee.author.indexOf('[Monstercat FREE EP Release]') != -1 ||
															ee.title.indexOf('[Monstercat FREE EP Release]') != -1 ||
															ee.author.indexOf('[Monstercat Official Music Video]') != -1 ||
															ee.title.indexOf('[Monstercat Official Music Video]') != -1 ||
															ee.author.indexOf('[Monstercat FREE Download Release]') != -1 ||
															ee.title.indexOf('[Monstercat FREE Download Release]') != -1) {
														setTimeout(function() {
															var cleanAuthor = ee.author.replace('[Monstercat]','')
																	.replace('[Monstercat Release]','')
																	.replace('[Monstercat EP Release]','')
																	.replace('[Monstercat LP Release]','')
																	.replace('[Monstercat VIP Release]','')
																	.replace('[Monstercat FREE Release]','')
																	.replace('[Monstercat FREE Download]','')
																	.replace('[Monstercat FREE EP Release]','')
																	.replace('[Monstercat Official Music Video]','')
																	.replace('[Monstercat FREE Download Release]','');
															var cleanTitle = ee.title.replace('[Monstercat]','')
																	.replace('[Monstercat Release]','')
																	.replace('[Monstercat EP Release]','')
																	.replace('[Monstercat LP Release]','')
																	.replace('[Monstercat VIP Release]','')
																	.replace('[Monstercat FREE Release]','')
																	.replace('[Monstercat FREE Download]','')
																	.replace('[Monstercat FREE EP Release]','')
																	.replace('[Monstercat Official Music Video]','')
																	.replace('[Monstercat FREE Download Release]','');
															$.ajax({
																type: 'PUT',
																url: '/_/playlists/'+e.id+'/media/update',
																data: JSON.stringify({
																	"id": ee.id,
																	"author": cleanAuthor,
																	"title": cleanAuthor
																}),
																success: function() {
																	pi._tool.log('Modifed: '+ee.author + ' - ' + ee.title+
																	             '\nResult: '+cleanAuthor + ' - ' + cleanTitle, 'chat');
																},
																error: function(e) {
																	pi._tool.log(e);
																},
																dataType: "json",
																contentType: "application/json"
															});
														}, delay * (a.length+i));
													}

													if (i + 1 === a.length && ii + 1 === aa.length) {
														pi._tool.log('Labels remove finished.', 'chat');
													}
												});
											});
										}, delay * i);
									});
								});
							break;

							case 'findBrokenSongs':
								pi._tool.log('This feature is not Ready yet !');
							break;

							case 'whoami':
								var me = API.getUser();
								pi._tool.log(
									'Username: ' + me.username +
									'\nID: ' + me.id +
									'\nDescription: ' + me.blurb +
									(me.level >= 5 ? '\n<a target="_blank" href="/@/'+me.username.toLowerCase().replace(/([^A-z]\s)|(\s[^A-z])/g, "").replace(" ","-").replace(/[^A-z-0-9]|\[|\]/g, "")+'">Profile</a>' : '') +
									'\nAvatar: ' + me.avatarID +
									'\nBadge: ' + me.badge +
									'\nLvl: ' + me.level +
									'\nXP: ' + me.xp +
									'\nPP: ' + me.pp,
									'chat'
								);
							break;

							case 'whois':
								var user;

								if (typeof msg == 'undefined') {
									pi._tool.log(lang.info.helpUserOrId, 'info');
								} else if (isNaN(msg)) {
									user = API.getUserByName(msg.replace('@', '').trim());
								}	else {
									user = API.getUser(msg);
								}

								if (user !== null && Object.keys(user).length > 0) {
									pi._tool.log('Username: '+ user.rawun +
										'\nID: ' +user.id +
										(typeof user.slug !== 'undefined' && user.level >= 5 ? '\n<a target="_blank" href="/@/'+user.slug+'">Profile</a>' : (user.level >= 5 ? '\n<a target="_blank" href="/@/'+user.username.toLowerCase().replace(/([^A-z]\s)|(\s[^A-z])/g, "").replace(" ","-").replace(/[^A-z-0-9]|\[|\]/g, "")+'">Profile</a>' : '')) +
										'\nlanguage: '+user.language +
										'\nAvatar: '+user.avatarID +
										'\nBadge: '+user.badge +
										'\nLvl: '+user.level +
										'\nFriend: '+user.friend+'\n', 'info', 'chat');
								} else {
									pi._tool.log('Could not get user, verify the id/pseudo', 'error', 'chat');
								}
							break;

							case 'pi':
								API.sendChat('Get Plug-It : http://wibla.free.fr/plug/script');
							break;

							case 'js':
								execute(msg);
							break;

							case 'list':
								pi._tool.log(
									'/like <3 x 5'+
									'\n/love (@user)'+
									'\n/door (@user)'+
									'\n/doorrun (@user)'+
									'\n/fire'+
									'\n/shrug'+
									'\n/eta'+
									'\n/vol [0-100]'+
									'\n/afk [message]'+
									'\n/bot [@user/id]'+
									'\n/grabed?'+
									'\n/duplicates (Excluded playlist(s),playlist\,with\,coma)'+
									'\n/whoami'+
									'\n/whois [id/pseudo]'+
									'\n/pi'+
									'\n/js [javaScript code]'+
									'\n/reload'+
									'\n/kill'+
									'\n/list', 'chat');
							break;

							case 'reload':
								pi._reload();
							break;

							case 'kill':
								pi.menu('off');
							break;

							default:
								if (sessionStorage.getItem('helpCommands') === 'false') {
									pi._tool.log(lang.log.help, 'info', 'chat');
									sessionStorage.setItem('helpCommands', true);
								}
							break;
						}
					},
					earn: function(amount) {
						// contains = {pp:0, xp:0};
						if (settings.gainNotification) {
							let gain;
							if (amount.pp === 0) {
								gain = amount.xp + 'xp.\n'+
								'Total: ' + API.getUser().xp + 'xp';
							} else if (amount.xp === 0) {
								gain = amount.pp + 'pp.\n'+
								'Total: ' + API.getUser().pp + 'pp';
							} else {
								gain = amount.xp+' xp and '+amount.pp+' pp.\n'+
								'Total: ' + API.getUser().xp + 'xp\n' +
								API.getUser().pp + 'pp';
							}

							pi._tool.log('You earned ' + gain, 'chat');
						}
					},
					friendJoin: function(friend) {
						// contains = {userObject};
					},
					grabUpdate: function(grab) {
						/* contains = {
							user: {userObject}
						}; */

						pi.voteAlert(grab);
						/*
							for (var i = 0; i < woots.length; i++) {
								if (woots[i].id == grab.id) {
									// Prevent forced woot event
									var index = woots.indexOf(woots[i]);
									if (index >= 0) woots.splice(index, 1);
								}
							}
							grabs.push(grab.user);
						*/
					},
					guestJoin: function(totalGuest) {
						// contains = 0;
						pi._tool.log(lang.log.guestJoin+totalGuest, 'chat');
					},
					guestLeave: function(totalGuest) {
						// contains = 0;
						pi._tool.log(lang.log.guestLeave+totalGuest, 'chat');
					},
					historyUpdate: function(medias) {
						/* conatins = [
							{
								media: {
									author,
									cid,
									duration,
									format,
									id,
									image,
									title
								},
								score: {
									grabs,
									listeners,
									negative,
									positive
								},
								user: {
									id,
									username
								}
							}
						]; */

						if (settings.historyAlert) {
						var histo = API.getHistory();
						var media = API.getMedia();
						var dj = API.getDJ();
						var callback = API.hasPermission(null, API.ROLE.BOUNCER) ? function() {API.moderateForceSkip();} : null;

						// i = 1 to jump the first item being the current song
						for (var i = 1; i < histo.length; i++) {
							if (media.format == histo[i].media.format && media.cid == histo[i].media.cid) {
								pi._tool.log(
									pi._tool.replaceString(
										 lang.warn.inHistory,
										{
											dj: dj.username,
											author: histo[i].media.author,
											title: histo[i].media.title,
											historydj: histo[i].user.username,
											turns: (i-1),
											// Yes, I know this part is not translated, maybe you could help me !
											skip: (API.hasPermission(null, API.ROLE.BOUNCER) ? '\nClick here to force skip.' : null)
										}
									),
									'warn',
									'chat',
									callback
								);
							}
						}
					}
					},
					modSkip: function(mod) {
						// contains = 'username';
					},
					scoreUpdate: function(score) {
						/* contains = [{
							positive: 0,
							negative: 0,
							grabs: 0
						}]; */

						woots = API.getUsers().filter(x => x.vote == 1);
						grabs = API.getUsers().filter(x => x.grab);
						mehs  = API.getUsers().filter(x => x.vote == -1);
					},
					userJoin: function(join) {
						// contains: {userObject};

						if (settings.userJoin) {
							pi._tool.log(join.username + (settings.userInfo ? ' Lvl:'+join.level+'|'+'Id:'+join.id : '') + ' joined !', 'chat');
						}
					},
					userLeave: function(leave) {
						// contains: {userObject};

						if (settings.userLeave) {
							pi._tool.log(leave.username + (settings.userInfo ? ' Lvl:'+leave.level+'|'+'Id:'+leave.id : '') + ' left !', 'chat');
						}
					},
					userSkip: function(user) {
						// contains = "username";
					},
					voteUpdate: function(vote) {
						/* contains = {
							vote: 1,
							user: {userObject}
						}; */

						pi.voteAlert(vote);

						/*
							if (vote.vote == 1) {
								for (var i = 0; i < mehs.length; i++) {
									// If user changes vote from meh to woot
									if (mehs[i].id == vote.user.id) {
										// remove user from mehs list
										var index = mehs.indexOf(mehs[i]);
										if (index >= 0) mehs.splice(index, 1);
									}
								}
								woots.push(vote.user);
							} else if (vote.vote == -1) {
								for (var i = 0; i < woots.length; i++) {
									// If user changes vote from woot to meh
									if (woots[i].id == vote.user.id) {
										// remove user from woots list
										var index = woots.indexOf(woots[i]);
										if (index >= 0) woots.splice(index, 1);
									}
								}
								mehs.push(vote.user);
							}
						*/
					},
					waitListUpdate: function(waitList) {
						/* contains = [
							{userObject}
						]; */
					}
				},
				_DOMEvent: {
					chatAutocompletion: function(e) {
						if ($(this).data("lastval") !== this.value) {
							$(this).data("lastval", this.value);
							 /* if (this.value.charAt(0) === '/') {
								$("#chat-suggestion").css({'height':342, 'display':'block'});
								$("#chat-suggestion-items").append($(
									'<div class="chat-suggestion-item online emo" data-index="0" style="background: transparent;">'+
										'<div class="image">'+
											'<span class="emoji-outer emoji-sizer"><span data-emoji-name="sagittarius" class="emoji-inner extplug-emoji-sagittarius" style="background-position:2.5% 82.5%;background-size:4100%"></span></span>'+
										'</div>'+
										'<span class="value">:sagittarius:</span>'+
										'<div class="chat-suggestion-item-line"></div>'+
									'</div>'
								));
							} */
						}
					},
					collideRanks: function() {
						let groupDetect = setInterval(function() {
							let group = $('.group');
							if (!group.length) return;
							else {
								$('.group').css('cursor', 'pointer');
								$('.group').on('click', function() {
									$(this).nextUntil('.group').slideToggle();
								});
								clearInterval(groupDetect);
							}
						}, 10);
					},
					keyboardShortcuts: function(e) {
						if (settings.keyboardShortcuts) {
							switch (e.key) {
								case '+':
									if (!$('#chat-input').hasClass('focused')) {
										API.setVolume(API.getVolume()+5);
										pi._tool.setPlugSettings('volume', API.getVolume());
									}
								break;
								case '-':
									if (!$('#chat-input').hasClass('focused')) {
										API.setVolume(API.getVolume()-5);
										pi._tool.setPlugSettings('volume', API.getVolume());
									}
								break;
								case 'h':
									if (!$('#chat-input').hasClass('focused')) {
										pi.menu('video');
									}
								break;
								case 'l':
									if (e.ctrlKey) {
										e.preventDefault();
										pi.betterClearChat(settings.betterClearChatLimit);
									}
								break;
								case 'b':
									if (e.ctrlKey) {
										e.preventDefault();
										var targetUser = API.getUserByName($('#user-rollover .username')[0].innerText);
										if (targetUser && API.hasPermission(null, API.ROLE.MANAGER)) {
											if (sessionStorage.getItem('FastBan Warn')) {
												$.ajax({
													type: 'POST',
													url: '/_/bans/add',
													data: JSON.stringify({
														"userID": targetUser.id,
														"reason": 1,
														"duration": 'f'
													}),
													error: function(e) {
														console.log(e);
													},
													dataType: 'json',
													contentType: 'application/json'
												});
											} else {
												pi._tool.log(lang.warn.fastBan, 'warn', 'chat', function() {
													sessionStorage.setItem('FastBan Warn', true);
													// Emulating ctrl + b will be just as long.. (haven't found a way to make trigger works with jQuery)
													$.ajax({
														type: 'POST',
														url: "/_/bans/add",
														data: JSON.stringify({
															"userID":targetUser.id,
															"reason":1,
															"duration": "f"
														}),
														error: function(e) {
															console.log(e);
														},
														dataType: "json",
														contentType: "application/json"
													});
												});
											}
										} else pi._tool.log(lang.info.FastBanHelp, 'info', 'chat');
									}
								break;
								case 'w':
								case 'm':
									if (!$('#chat-input').hasClass('focused')) {
										let now = new Date().getTime();
										// Avoid spamming woot/meh
										if (now - cooldown.voteShortcut >= 5000 && $("input:focus").length === 0) {
											cooldown.voteShortcut = now;
											if (e.key === 'w') $('#woot').click();
											else $('#meh').click();
										}
									}
								break;
								/*case 'g':
									pi._tool.getPlaylists(function(data) {
										$.ajax({
											type: 'POST',
											url: "/_/grabs",
											data: JSON.stringify({
												playlistID: data.data.filter(x => x.active)[0].id,
												historyID: API.getMedia().id
											}),
											error: function(e) {
												console.log(e);
											},
											dataType: "json",
											contentType: "application/json"
										});
									});
								break;*/
								case 'ArrowRight':
									if (e.ctrlKey && API.getDJ().id === API.getUser().id) $.post("/_/booth/skip/me");
								break;
								case 'Tab':
									e.preventDefault();
									$('#chat-input-field').focus();
								break;
								case 'Escape':
									if ($('#chat-input-field').is(':focus')) {
										$('#chat-input-field').blur();
									}
								break;
							}
						}
					},
					levelPercentage: function() {
						let bar = $('#footer-user .info .meta .bar .value')[0];
						if (bar.innerText.indexOf('%') == -1) {
							bar.innerHTML = bar.innerHTML.replace(/\s[0-9]*%/g, '') + ' ' + $('#footer-user .info .progress')[0].style.width;
						}

						/* Until I know how to redefine core functions, this is bad
						 * let profileBar = $('#the-user-profile .experience.section .xp .value')[0];
						 * if (profileBar) {
						 *	profileBar.innerHTML = profileBar.innerHTML.replace(/ [0-9]*%/g, '') + ' ' + $('#the-user-profile .experience .progress')[0].style.width;
						 * }
						 */
					},
					navWarn: function(e) {
						var dialogText = lang.log.leaving;

						if (settings.navWarn) {
							(e || window.event).returnValue = dialogText;
							return dialogText;
						}
					},
					updateRoomSettings: function(e, request, settings, data) {
						if (settings.url == '/_/rooms/update' &&
						    settings.type === 'POST' &&
						    settings.data &&
							  settings.data.indexOf('description') !== -1) {
							console.log("e", e, '\nrequest', request, '\nsettings', settings);
							roomSettings = {};
							pi._tool.getRoomSettings();
						}
					},
					volumeWheel: function(e) {
						e.preventDefault();
						// If ctrlKey pressed thinner iteration
						var i = e.ctrlKey ? 1 : 5;

						if (e.originalEvent.deltaY > 0) API.setVolume(API.getVolume()-i);
						else if (e.originalEvent.deltaY < 0) API.setVolume(API.getVolume()+i);

						pi._tool.setPlugSettings('volume', API.getVolume());
					}
				},
				_load: function() {
					updateStatus('Initalizating API & Events listener', 3);
					// Add custom events to the API
					pi._extendAPI();
					// Bind events to their handler
					for (var event in pi._event) {
						API.on(event, pi._event[event]);
					}
					window.onbeforeunload = pi._DOMEvent.navWarn;
					$(window).on('keydown', pi._DOMEvent.keyboardShortcuts);
					$('#volume, #playback').on('mousewheel', pi._DOMEvent.volumeWheel);
					$('#footer-user .info .meta .bar .value').on('DOMSubtreeModified', pi._DOMEvent.levelPercentage);
					$('.button.staff').on('click', pi._DOMEvent.collideRanks);
					$("#chat-input-field").on('input', pi._DOMEvent.chatAutocompletion);
					$(document).on('ajaxSuccess', pi._DOMEvent.updateRoomSettings);
					// Execute it at least once, avoid to wait a gain of XP
					pi._DOMEvent.levelPercentage();

					// Retrieve user settings if available
					updateStatus('Loading user settings', 4);
					var ls = localStorage.getItem('pi-settings');

					if (typeof ls === 'string') {
						var userSettings = JSON.parse(ls);

						for (var item in settings) {
							// Adding new elements on update release
							if (typeof userSettings[item] === 'undefined') {
								userSettings[item] = settings[item];
							}
						}
						for (var userItem in userSettings) {
							// Checking if user has more settings than necessary
							if (typeof settings[userItem] === 'undefined') {
								delete userSettings[userItem];
							}
						}
						localStorage.setItem('pi-settings', JSON.stringify(userSettings));
						settings = userSettings;
					} else {
						pi._tool.saveSettings();
					}

					// Those settings are available even after reload
					sessionStorage.setItem('modSkipWarn', false);
					sessionStorage.setItem('modQuitWarn', false);
					sessionStorage.setItem('trustWarn', false);
					sessionStorage.setItem('fastBanWarn', false);
					sessionStorage.setItem('helpCommands', false);

					// setInterval
					window.friendsOnline = setInterval(function() {
						if (settings.unfriended) {
							pi._tool.getFriends(function(friendsNow) {
								// Not using sessionStorage here to be able to track
								// at any time, even after reboot
								var friends = localStorage.getItem('pi-friends');

								if (friends !== null) {
									friends = JSON.parse(friends);

									if (friendsNow.length < friends.length) {
										var unfriends = friends.filter(user => {
											let inArray = false;

											for (var i = 0; i < friendsNow.length; i++) {
												if (friendsNow[i].id === user.id) inArray = true;
											}

											return !inArray;
										});

										unfriends.forEach(function(friend) {
											pi._tool.log(friend.username + " has unfriended you :'(", 'info', 'chat');
										});
									}
								}

								localStorage.setItem('pi-friends', JSON.stringify(friendsNow));
							});
						}

						pi._tool.getFriends(
							function(friends) {
								var friendsOnline = [];
								for (var i = 0; i < friends.length; i++) {
									if (typeof friends[i].status == 'undefined') friendsOnline.push(friends[i]);
								}

								// Display how many friends are online next to friends request count
								var count = $('#friends-button > span')[0].innerText.replace(/[0-9]*\//g,'');
								count = friendsOnline.length + '/' + count;
								$('#friends-button > span')[0].innerText = count;

								// Notification for friend connect/disconnected
								if (settings.friendConnect || settings.friendDisconnect) {
									var storage = sessionStorage.getItem('friendsOnline');
									if (storage === null) sessionStorage.setItem('friendsOnline', JSON.stringify(friendsOnline));
									else {
										storage = JSON.parse(storage);

										for (var i = 0; i < friendsOnline.length; i++) {
											var isInArray = false;

											for (var j = 0; j < storage.length; j++) {
												if (friendsOnline[i].id == storage[j].id) {
													isInArray = true;
													if (friendsOnline[i].room.id !== storage[j].room.id &&
												 	    settings.friendRoomChange) {
														if (friendsOnline[i].room.slug == 'dashboard') friendsOnline[i].room.name = 'dashboard';
														pi._tool.log(pi._tool.replaceString(lang.log.friendRoomChange, {friend: friendsOnline[i].username, link: friendsOnline[i].room.slug, name: friendsOnline[i].room.name}), 'chat');
													}
												}
											}

											if (!isInArray && settings.friendConnect) {
												if (typeof friendsOnline[i].room.name === 'undefined') {
													friendsOnline[i].room.name = 'dashboard';
												}
												pi._tool.log(pi._tool.replaceString(lang.log.friendConnect, {friend: friendsOnline[i].username, link: friendsOnline[i].room.slug, name: friendsOnline[i].room.name}), 'chat');
											}
										}
										for (var i = 0; i < storage.length; i++) {
											var isInArray = false;

											for (var j = 0; j < friendsOnline.length; j++) {
												if (storage[i].id == friendsOnline[j].id) isInArray = true;
											}

											if (!isInArray && settings.friendDisconnect) {
												pi._tool.log(pi._tool.replaceString(lang.log.friendDisconnect, {friend: storage[i].username}), 'chat');
											}
										}

										sessionStorage.setItem('friendsOnline', JSON.stringify(friendsOnline));
									}
								}
							}
						);
					}, 30*1000);
					window.roomURL = location.pathname;
					window.checkIfRoomChanged = setInterval(function() {
						if (location.pathname !== window.roomURL) {
							window.roomURL = location.pathname; // If not set, script will reload infinitely
							clearInterval(window.checkIfRoomChanged);
							pi._reload('roomChange');
						}
					}, 2*1000);
					if (typeof thisCommit !== "undefined") {
						window.checkIfUpdatesAvailable = setInterval(function() {pi._tool.checkForUpdates();}, 30*60*1000);
					}
					// Creating DOM elements
					updateStatus('Creating script environement', 5);
					// Menu icon
					$('#app').append($('<div id="pi-logo"><div id="icon"></div></div>'));
					// SoundCloud visualizer's custom iframe
					$('#playback-container').append($(
						'<iframe id="pi-frame" frameborder="0" src=""></iframe>'
					).css({
						"display": "none",
						"position": "absolute",
						"top": "0",
						"left": "0",
						"z-index": "5",
						"width": "100%",
						"height": "100%"
					}));
					// Custom room background
					$('.room-background').after($('<div id="pi-background"></div>').css({
						"display": "none",
						"position": "absolute",
						"top": (Math.min(54, ((Math.max(638, window.innerHeight)) - 54 - 800))),
						"left": (Math.max(1150, window.innerWidth) - 345 - 1600) / 2,
						"width": "1600px",
						"height": "900px",
						"background": "url("+settings.bg+") no-repeat"
					}));
					// Menu itself
					$('#app').append($(
						'<div id="pi-menu" style="display: none;">'+
							'<ul>'+
							'<h2>'+lang.menu.titles.general+'</h2>'+
							'<ul style="display: none;">'+
								'<li id="pi-woot">'+lang.menu.aw+'</li>'+
								'<li id="pi-join">'+lang.menu.aj+'</li>'+
								'<li id="pi-keyShortcut">'+lang.menu.ks+'</li>'+
								'<li id="pi-chatCommands">'+lang.menu.cc+'</li>'+
								'<li id="pi-mutemeh">'+lang.menu.mm+'</li>'+
								'<li id="pi-afkResponder">'+lang.menu.ar+'</li>'+
								'<li id="pi-afkMessage"><input type="text" placeholder="AFK responder message"/></li>'+
								'<li id="pi-navWarn">'+lang.menu.nw+'</li>'+
								'<li id="pi-showVotes">'+lang.menu.sv+'</li>'+
								'<li id="pi-betterClearChatLimit"><label for="betterClearLimit">Clear chat limit</label><input type="number" min="0" max="512" step="1" value="'+settings.betterClearChatLimit+'" name="betterClearLimit"/></li>'+
								'<li id="pi-chatLimit"><label for="chatLimit">Chat limit</label><input type="number" min="1" max="512" step="1" value="'+settings.chatLimit+'" name="chatLimit"/></li>'+
							'</ul>'+
							'<h2>'+lang.menu.titles.customisation+'</h2>'+
							'<ul style="display: none;">'+
								'<li id="pi-video">'+lang.menu.hv+'</li>'+
								'<li id="pi-soundcloudVisu">'+lang.menu.scv+'</li>'+
								'<li id="pi-css">'+lang.menu.cs+'</li>'+
								'<li id="pi-bg">'+lang.menu.cb+'</li>'+
								'<li id="pi-old-chat">'+lang.menu.oc+'</li>'+
								'<li id="pi-old-footer">'+lang.menu.of+'</li>'+
								'<li id="pi-small-history">'+lang.menu.sm+'</li>'+
							'</ul>'+
							'<h2>'+lang.menu.titles.moderation+'</h2>'+
							'<ul style="display: none;">'+
								'<li id="pi-userInfo">'+lang.menu.ui+'</li>'+
								'<li id="pi-lengthA">'+lang.menu.sl+'</li>'+
								'<li id="pi-songLength"><input type="text" placeholder="Song limit in seconds"/></li>'+
								'<li id="pi-historyA">'+lang.menu.ha+'</li>'+
							'</ul>'+
							'<h2>'+lang.menu.titles.notifications+'</h2>'+
							'<ul style="display: none;">'+
								'<li id="pi-systemNotifications">'+lang.menu.sn+'</li>'+
								'<li id="pi-boothAlert">'+lang.menu.ba+'</li>'+
								'<li id="pi-boothPosition"><label for="boothPosition">Booth position</label><input type="number" min="0" max="512" step="1" value="'+settings.boothPosition+'" name="boothPosition"/></li>'+
								'<li id="pi-userJoin">'+lang.menu.uj+'</li>'+
								'<li id="pi-userLeave">'+lang.menu.ul+'</li>'+
								'<li id="pi-userWoot">'+lang.menu.uw+'</li>'+
								'<li id="pi-userGrab">'+lang.menu.ug+'</li>'+
								'<li id="pi-userMeh">'+lang.menu.um+'</li>'+
								'<li id="pi-guestJoin">'+lang.menu.gj+'</li>'+
								'<li id="pi-guestLeave">'+lang.menu.gl+'</li>'+
								'<li id="pi-friendRoomChange">'+lang.menu.frc+'</li>'+
								'<li id="pi-friendConnect">'+lang.menu.fc+'</li>'+
								'<li id="pi-friendDisconnect">'+lang.menu.fd+'</li>'+
								'<li id="pi-unfriended">'+lang.menu.uf+'</li>'+
								'<li id="pi-gainNotification">'+lang.menu.gn+'</li>'+
							'</ul>'+
							'<h2>'+lang.menu.titles.about+'</h2>'+
								'<p style="display: none;">'+
									'Plug-It '+pi._tool.getReadableVersion()+'.<br>'+
									'Developed by: <a target="_blank" href="https://twitter.com/WiBla7" target="blank">@WiBla7</a><br>'+
									'<a target="_blank" href="https://chrome.google.com/webstore/detail/plug-it-extension/bikeoipagmbnkipclndbmfkjdcljocej">'+lang.menu.rate+'</a><br>'+
									'<a target="_blank" href="https://crowdin.com/project/plug-it">'+lang.menu.translate+'</a><br>'+
									'<a target="_blank" href="https://github.com/Plug-It/pi/issues">'+lang.menu.bug+'</a><br>'+
									'<span id="pi-off">'+lang.menu.s+'</span>'+
								'</p>'+
							'</ul>'+
						'</div>'
					));
					// Menu css
					$('head').append($('<link id="pi-menu-CSS" rel="stylesheet" type="text/css" href="'+url.styles.menu_css+'">'));
					// DelChat icon
					$('#chat-header').append(
						'<div id="pi-delchat" class="chat-header-button">'+
							'<i class="icon pi-delchat"></i>'+
						'</div>'
					);
					// Moderation toolbar
					if (API.hasPermission(null, API.ROLE.BOUNCER)) {
						// Moderation tools
						$('#playback-container').append($(
							'<div id="pi-rmvDJ">'+
								'<img src="https://raw.githubusercontent.com/Plug-It/pi/pre-release/images/other/romveDJ.png" alt="button remove from wait-list" />'+
							'</div>'+
							'<div id="pi-skip">'+
								'<img src="https://raw.githubusercontent.com/Plug-It/pi/pre-release/images/other/skip.png" alt="button skip" />'+
							'</div>'
						));
					}
					// Click Event Binding
					$('#pi-logo, #pi-menu').on('click', function(e) {
						if (e.target.id === 'pi-logo' || e.target.id === 'icon') {
							$('#pi-menu').toggle(250);
						} else {
							pi.menu(e.target.id.replace('pi-', ''));
						}
					});
					$('#pi-menu h2').on('click', function() {
						$(this).next().slideToggle();
					});
					$('#pi-betterClearChatLimit input').on('change', function() {
						settings.betterClearChatLimit = parseInt(this.value);
					});
					$('#pi-chatLimit input').on('change', function() {
						settings.chatLimit = parseInt(this.value);
					});
					$('#pi-afkMessage input').on('change', function() {
						settings.afkMessage = this.value;
					});
					$('#pi-songLength input').on('change', function() {
						settings.songLength = parseInt(this.value);
					});
					$('#pi-boothPosition input').on('change', function() {
						settings.boothPosition = parseInt(this.value);
					});
					$(window).on('resize', function() {
						//let PLAYLIST_OFFSET = 108;
						let MIN_WIDTH = 1150;
						let MIN_HEIGHT = 638;
						let CHAT_WIDTH = 345;
						let BAR_HEIGHT = 54;
						// let BAR_WIDTH = CHAT_WIDTH + BAR_HEIGHT;
						let availWidth = Math.max(MIN_WIDTH, window.innerWidth) - CHAT_WIDTH;
						let availHeight = Math.max(MIN_HEIGHT, window.innerHeight);
						let n = availHeight - BAR_HEIGHT - 800;
						let bgTop = Math.min(BAR_HEIGHT, n);

						if (!pi._tool.getPlugSettings().videoOnly) {
							$('#pi-background').css('left', (availWidth - 1600) / 2)
							.css('top', bgTop).width(1600).height(900);
						} else {
							$('#pi-background').css('left', 0)
							.css('top', BAR_HEIGHT).width(availWidth).height(availHeight - BAR_HEIGHT * 2);
						}
					});
					$('#pi-menu input').on('blur', function() {pi._tool.saveSettings});
					$('#pi-rmvDJ').on('click', function() {pi.removeDJ();});
					$('#pi-skip').on('click', function() {pi.forceSkip();});
					$('#pi-delchat').on('click', function() {
						pi.betterClearChat(settings.betterClearChatLimit);
					});
					// Tooltips
					$('#now-playing-media').on('mouseenter', function() {
						pi._tool.tooltip(true, 'left', $(this).offset().left,0, this.innerText);
					});
					$('#pi-rmvDJ').on('mouseenter', function() {
						let x = $(this).offset().left + ($(this).width()/2);
						let y = $(this).offset().top - ($(this).height());
						pi._tool.tooltip(true, 'left', x,y, lang.tooltips.rmvDJ);
					});
					$('#pi-skip').on('mouseenter', function() {
						let x = $(this).offset().left + ($(this).width()/2);
						let y = $(this).offset().top - ($(this).height());
						pi._tool.tooltip(true, 'left', x,y, lang.tooltips.skip);
					});
					$('#pi-delchat').on('mouseenter', function() {
						let x = $(this).offset().left + ($(this).width()/2);
						let y = $(this).offset().top - ($(this).height());
						pi._tool.tooltip(true, 'right', x,y, lang.tooltips.clearChat);
						// Since tootlip is point on the right but x & y are from top left,
						// instead of calculating the width of the tooltip (which depends on the translation),
						// just apply a translate effect, much easier.
						$('#tooltip').css({transform: 'translate(-100%, 0)'});
					});
					$('#now-playing-media, #pi-rmvDJ, #pi-skip, #pi-delchat').on('mouseleave', function() {pi._tool.tooltip();});
					// Show votes
					$("#woot, #grab, #meh").on('mouseenter', function() {
						if (settings.showVotes) {
							let votes;
							switch (this.id) {
								case 'woot': votes = woots; break;
								case 'grab': votes = grabs; break;
								case 'meh':  votes = mehs;  break;
								default: votes = []; break;
							}
							pi._tool.showVotes(true, this.id, votes);
						}
					});
					$("#woot, #grab, #meh").on('mouseleave', function(e) {
						// do not remove element if moving from #votes to #pi-votes
						if (!$(e.toElement).closest('#pi-votes').length) pi._tool.showVotes(false);
					});
					// Fully loaded
					pi.dom = {
						// Menu
						// General
						woot: $('#pi-woot')[0],
						join: $('#pi-join')[0],
						keyShortcut: $('#pi-keyShortcut')[0],
						chatCommands: $('#pi-chatCommands')[0],
						betterMeh: $('#pi-mutemeh')[0],
						afkResponder: $('#pi-afkResponder')[0],
						afkMessage: $('#pi-afkMessage')[0],
						navWarn: $('#pi-navWarn')[0],
						showVotes: $('#pi-showVotes')[0],
						betterClearChatLimit: $('#pi-betterClearChatLimit')[0],
						chatLimit: $('#pi-chatLimit')[0],
						// Customisation
						video: $('#pi-video')[0],
						soundcloudVisu: $('#pi-soundcloudVisu')[0],
						css: $('#pi-css')[0],
						bg: $('#pi-bg')[0],
						oldChat: $('#pi-old-chat')[0],
						oldFooter: $('#pi-old-footer')[0],
						smallHistory: $('#pi-small-history')[0],
						// Moderation
						userInfo: $('#pi-userInfo')[0],
						lengthA: $('#pi-lengthA')[0],
						songLength: $('#pi-songLength')[0],
						historyAlert: $('#pi-historyA')[0],
						// Notifications
						systemNotifications: $('#pi-systemNotifications')[0],
						boothAlert: $('#pi-boothAlert')[0],
						boothPosition: $('#pi-boothPosition')[0],
						userJoin: $('#pi-userJoin')[0],
						userLeave: $('#pi-userLeave')[0],
						userWoot: $('#pi-userWoot')[0],
						userGrab: $('#pi-userGrab')[0],
						mehA: $('#pi-userMeh')[0],
						guestJoin: $('#pi-guestJoin')[0],
						guestLeave: $('#pi-guestLeave')[0],
						friendRoomChange: $('#pi-friendRoomChange')[0],
						friendConnect: $('#pi-friendConnect')[0],
						friendDisconnect: $('#pi-friendDisconnect')[0],
						unfriended: $('#pi-unfriended')[0],
						gainNotification: $('#pi-gainNotification')[0],
						// About
						off: $('#pi-off')[0],
						// Mod Bar
						rmvDJ: $('#pi-rmvDJ')[0],
						skip: $('#pi-skip')[0],
						// Other
						DelChat: $('#pi-delchat')[0],
						// Plug
						stream: $('#playback-container')[0]
					};

					delete pi._load; // Init only once
					pi._tool.log(pi._tool.replaceString(lang.log.loaded, pi.version) + ' ' + (new Date().getTime() - startTime) + 'ms');
					// If userSettings is undefined: first time we run the script
					if (!userSettings) {
						pi._tool.log(lang.log.help, 'info', 'chat');
						pi._tool.log(lang.log.preRelease, 'warn', 'chat');
					}
					// Initialise the menu
					pi.menu('init');
					// Delete load status
					$('#pi-status').css({opacity:'0'});
					setTimeout(function() {$('#pi-status').remove();}, 250);

					pi._tool.getRoomSettings();
				},
				_reload: function(reason) {
					if (typeof reason === 'string' && reason === 'roomChange') {
						pi._tool.log(lang.info.roomChange, 'info');
					} else {
						pi._tool.log(lang.log.reloading);
					}

					pi._close();
					$.getScript(scriptURL);
				},
				_close: function() {
					// Unbind API events
					for (var event in pi._event) {
						API.off(event, pi._event[event]);
					}

					// Allow to reload
					window.scriptURL = url.script;
					window.onbeforeunload = null;

					clearInterval(friendsOnline);
					clearInterval(checkIfRoomChanged);
					clearInterval(checkIfUpdatesAvailable);

					delete friendsOnline;
					delete roomURL;
					delete checkIfRoomChanged;
					delete checkIfUpdatesAvailable;

					// Unbind events BEFORE removing elements
					$(window).off('keydown', pi._DOMEvent.keydown);
					$('#volume, #playback').off('mousewheel', pi._DOMEvent.mousewheel);
					$('.button.staff').off('click', pi._DOMEvent.collideRanks);
					$("#chat-input-field").off('input', pi._DOMEvent.chatAutocompletion);
					$(document).off('ajaxSuccess', pi._DOMEvent.updateRoomSettings);
					$('.group').css('cursor', '');

					$(".room-background").show();
					$('*[id*="pi-"]').each(function() {
						this.remove();
					});

					$('#now-playing-media, #pi-rmvDJ, #pi-skip, #pi-delchat, #woot, #grab, #meh').off('mouseenter');
					$('#now-playing-media, #pi-rmvDJ, #pi-skip, #pi-delchat, #woot, #grab, #meh').off('mouseleave');
					// Preventing making the video definitly desapear
					if (!settings.showVideo) {
						pi.menu('showVideo');
						settings.showVideo = false;
					}
					sessionStorage.removeItem('modQuitWarn');
					sessionStorage.removeItem('modSkipWarn');
					sessionStorage.removeItem('trustWarn');
					sessionStorage.removeItem('fastBanWarn');
					sessionStorage.removeItem('helpCommands');

					pi._extendAPI('reverse');

					delete pi;
				},
				_extendAPI: function(reverse) {
					if (!reverse) {
						API.GUEST_JOIN = 'guestJoin';
						API.GUEST_LEAVE = 'guestLeave';
						API.EARN = 'earn';
						var totalGuest = $('.guest-count')[0].innerText;
						var PPThen = API.getUser().pp;
						var XPThen = API.getUser().xp;

						API.moderateForceQuit = function() {
							if (API.hasPermission(null, API.ROLE.BOUNCER)) {
								$.ajax({
									url: '/_/booth/remove/'+API.getDJ().id,
									method: 'DELETE'
								});
							}
						};
						API.getUserByName = function(name) {
							if (typeof name == 'undefined') {
								console.error('A name must be provided !');
								return undefined;
							} else {
								var users = API.getUsers();
								name = name.toLowerCase();
								for (var i = 0; i < users.length; i++) {
									if (name == users[i].rawun.toLowerCase()) return users[i];
								}
								return null;
							}
						};
						API.getAnyUser = function(id, callback) {
							if (isNaN(id) || typeof callback !== 'function') return;
							$.ajax({
								url: 'https://plug.dj/_/users/'+id,
								success: function(data) {
									callback(data.data[0]);
								},
								error: function(e) {
									console.error(e);
								}
							});
						};
						API.addFriendByID = function(id) {
							if (isNaN(id)) return;
							$.ajax({
								type: 'POST',
								url: "/_/friends",
								data: JSON.stringify({
									"id": id
								}),
								error: function(e) {
									console.error(e);
								},
								dataType: "json",
								contentType: "application/json"
							});
						};
						API.gift = function(id, amount) {
							if (isNaN(id) || isNaN(amount)) return;
							else if ($('#g-recaptcha-response').val() === 0) return console.error('You must fill in the captcha.');
							$.ajax({
								type: 'POST',
								url: "/_/gift",
								data: JSON.stringify({
									"id": id,
									"amount": amount,
									"response": $('#g-recaptcha-response').val()
								}),
								error: function(e) {
									console.error(e);
								},
								dataType: "json",
								contentType: "application/json"
							});
						};

						totalGuest = totalGuest.length ? parseInt(totalGuest) : 0;
						$('.guest-count').on('DOMSubtreeModified', function(e) {
							var thisCount = e.currentTarget.innerText.length ? parseInt(e.currentTarget.innerText) : 0;

							// Stupid plug sets .guest-count to '' whenever someone join/leave
							// After 50ms, if count changed, false positive.
							// /!\ Very slim possibility for two guests to join/leave
							setTimeout(function() {
								var countCheck = e.currentTarget.innerText.length ? parseInt(e.currentTarget.innerText) : 0;
								if (thisCount !== countCheck) return;

								if (thisCount > totalGuest && settings.guestJoin) API.trigger(API.GUEST_JOIN, thisCount);
								else if (thisCount < totalGuest && settings.guestLeave) API.trigger(API.GUEST_LEAVE, thisCount);

								totalGuest = thisCount;
							}, 50);
						});
						$('#footer-user .info').on('DOMSubtreeModified', function(e) {
							var PPNow = API.getUser().pp;
							var XPNow = API.getUser().xp;
							var PPEarned = 0;
							var XPEarned = 0;

							if (PPNow > PPThen) PPEarned = PPNow - PPThen;
							if (XPNow > XPThen) XPEarned = XPNow - XPThen;
							if (PPEarned || XPEarned) API.trigger(API.EARN, {pp:PPEarned,xp:XPEarned});

							PPThen = PPNow;
							XPThen = XPNow;
						});
						$('#footer-user .bar .value').on('DOMSubtreeModified', function() {
							let value = $('#footer-user .bar .value')[0];
							if (value.innerText.indexOf('%') === -1) {
								value.innerText += " " + $('#footer-user .bar .progress')[0].style.width;
							}
						});
					}
					else {
						$('.guest-count').off('DOMSubtreeModified');
						$('#footer-user .info').off('DOMSubtreeModified');
						$('#footer-user .bar .value').off('DOMSubtreeModified');

						delete API.moderateForceQuit;
						delete API.getUserByName;
						delete API.getAnyUser;
						delete API.gift;
						delete API.GUEST_JOIN;
						delete API.GUEST_LEAVE;
						delete API.EARN;
					}
				},
				_tool: {
					applyRoomSettings: function() {
						for (var script in roomSettings) {
							for (var rule in roomSettings[script]) {
								if (typeof roomSettings[script][rule].import !== 'undefined') {
									roomSettings[rule] = roomSettings[script][rule].import[0];
									roomSettings.rule = roomSettings[script][rule].rule;
								} else if (rule === 'rules') {
									for (var rule2 in roomSettings[script][rule]) {
										if (roomSettings[rule] === undefined) roomSettings[rule] = {}

										if (typeof roomSettings[script][rule][rule2] === 'string') {
											roomSettings[rule][rule2] = (roomSettings[script][rule][rule2] === 'true');
										} else {
											roomSettings[rule][rule2] = roomSettings[script][rule][rule2];
										}
									}
								} else {
									roomSettings[rule] = roomSettings[script][rule];
								}
							}

							delete roomSettings[script];
						}

						if (typeof roomSettings.css !== 'undefined') {
							let $roomStyle = $('#pi-room-style');

							// In case of update, remove previous menu item
							if ($roomStyle.length) $roomStyle.remove();

							$roomStyle = $('<li id="pi-room-style">'+roomSettings.room+' style</li>');
							pi.dom.roomStyle = $roomStyle[0];
							pi.dom.roomStyle.className = settings.roomStyle ? 'pi-on' : 'pi-off';
							$('#pi-css').before($roomStyle);

							if (settings.roomStyle) {
								pi.toggleStyle('roomStyle');
								pi._tool.log('This room is using a custom style made by '+ roomSettings.author +', you can disable it via the menu.');
							}
						}
					},
					checkForUpdates: function(isForced) {
						getLastCommit('https://api.github.com/repos/Plug-It/pi/commits/pre-release', function(data) {
							if (thisCommit.sha !== data.sha) {
								if (isForced) {
									pi._tool.log(lang.log.forcingReload);
									pi._reload();
								}
								else pi._tool.log('An update is available:\n'+data.commit.message+'\n\nClick here to reload.', 'info', 'chat', function(){pi._reload();});
							}
						});
					},
					getFriends: function(callback) {
						/* Sadly, this is the only way to get friends
						 * It's ugly, I know. In order to update, you
						 * have to make a call every x sec/min.
						 * You can thank plug.
						 */
						$.ajax({
							url: '/_/friends',
							success: function(data) {
								callback(data.data);
							}
						});
					},
					getPlaylist: function(id, callback) {
						if (isNaN(id) || typeof callback !== 'function') return;

						$.ajax({
							url: '/_/playlists/'+id+'/media',
							success: function(data) {
								// let playlists = JSON.parse(localStorage.getItem('pi-playlists'));

								callback(data.data);
							}
						});
					},
					getPlaylists: function(callback) {
						if (typeof callback !== 'function') return;
						/*
						let playlists = JSON.parse(localStorage.getItem('pi-playlists'));
						let now = new Date().getTime;
						if (playlists === null || now - playlists.date > 86400000) {
							$.ajax({
								url: '/_/playlists',
								success: function(data) {
									var cache = {
										date: now,
										playlists: data.data
									};
									localStorage.setItem('pi-playlists', JSON.stringify(cache));
									callback(cache.playlists);
								}
							});
						} else {
							callback(playlists.playlists);
						}*/

						$.ajax({
							url: '/_/playlists',
							success: function(data) {
								callback(data.data);
							}
						});
					},
					getPlugSettings: function(id) {
						if (typeof id == 'undefined') id = API.getUser().id;
						var json = JSON.parse(localStorage.getItem('settings'));
						for (var i = 1; i < 20; i++) {
							if (typeof json[i][id] !== 'undefined') return json[i][id];
						}
					},
					getRank: function(id) {
						let result = [], user;

						if (!id) {
							user = API.getUser();
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
					getReadableVersion: function() {
						return pi.version.major+"."+pi.version.minor+"."+pi.version.patch+(pi.version.isAlpha ? ' Alpha' : '');
					},
					getRoomRules: function(which) {
						if (typeof roomSettings.rules === 'undefined') return true;
						if (typeof roomSettings.rules[which] === 'undefined') return true;
						else return roomSettings.rules[which];
					},
					getRoomSettings: function() {
						$.getJSON('/_/rooms/state', function(data) {
							data = data.data[0];
							let url = data.meta.description;
							let re = new RegExp('@(pi|p3|rcs)=(https?:\/\/[^\\@,;]*json)', 'ig');

							if (re.test(url)) {
								let match = url.match(re);

								for (var i = 0; i < match.length; i++) {
									let scriptName = match[i].slice(1, match[i].indexOf("="));

									$.ajax({
										url: match[i].replace(/@(pi|p3|rcs)=/ig, ''),
										success: function(data) {
											roomSettings[scriptName] = JSON.parse(data);
											roomSettingsLoaded();
										},
										error: function(e) {
											pi._tool.log('Failed to load '+scriptName+' room settings:\n' + e, 'error', 'console');
										}
									});
								}

								function roomSettingsLoaded() {
									if (Object.keys(roomSettings).length !== match.length) return;
									else {
										pi._tool.applyRoomSettings();
									}
								}
							}
						});
					},
					isRank: function(rank, id) {
						if (!rank) return null;
						var result = pi._tool.getRank(id);

						for (var ranks in result) {
							result[ranks] = result[ranks].toLowerCase();
							rank = rank.toLowerCase();
							if (result[ranks] == rank) return true;
						}
						return false;
					},
					loadEmote: function(which) {
						if (typeof which !== 'string') return;

						// Only 4 options, switch is not faster
						if (which === 'tasty') {
							$.ajax({
								url: url.emotes.tasty,
								success: function(data) {
									emotes.tastycat = data.emotes;
								}
							});
						} else if (which === 'twitch') {
							$.ajax({
								url: url.emotes.twitch,
								success: function(data) {
									for (var emote in data.emotes) {
										emotes.twitch[emote] = data.template.small.replace('{image_id}', data.emotes[emote].image_id);
									}
								}
							});
						} else if (which === 'twitchSub') {
							$.ajax({
								url: url.emotes.twitchSub,
								success: function(data) {
									for (var emote in data.unknown_emotes.emotes) {
										emotes.twitchSub[data.unknown_emotes.emotes[emote].code] =
											data.template.small.replace('{image_id}', data.unknown_emotes.emotes[emote].image_id);
									}
									for (var channel in data.channels) {
										for (emote in data.channels[channel].emotes) {
											emotes.twitchSub[data.channels[channel].emotes[emote].code] =
												data.template.small.replace('{image_id}', data.channels[channel].emotes[emote].image_id);
										}
									}
								}
							});
						} else if (which === 'betterTTV') {
							$.ajax({
								url: url.emotes.betterDiscord,
								success: function(data) {
									emotes.betterTTV = JSON.parse(data);
									for (var emote in emotes) {
										emotes.betterTTV[emote] = 'https://cdn.betterttv.net/emote/' + emotes.betterTTV[emote] + '/1x';
									}

									$.ajax({
										url: url.emotes.betterTTV,
										success: function(data) {
											for (var emote in data.emotes) {
												emotes.betterTTV[data.emotes[emote].regex] = "https:" + data.emotes[emote].url;
											}
										}
									});
								}
							});
						}
					},
					log: function(txt, type, where, callback) {
						/* Has to be set when popup is created, not on every log
							requires to know when that popup is made
						var popup = window.open('','plugdjpopout');*/
						switch(type) {
							case 'error': txt = 'Error: ' + txt; break;
							case 'warn':  txt = 'Warn: '  + txt; break;
							case 'info':  txt = 'Info: '  + txt; break;
							case 'debug': txt = 'Debug: ' + txt; break;

							case 'chat':
							case 'console':
							case 'both':
								where = type; type = 'log';
							break;

							default: type = 'log'; break;
						}

						if (typeof where === 'undefined' || where === 'chat' || where === 'both') {
							var timestamp = pi._tool.getPlugSettings().chatTimestamps;
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
							var $logBox = $(
								'<div class="cm pi-'+type+' deletable">'+
									'<div class="delete-button" style="display: none;top: initial !important;">Delete</div>'+
										'<div class="badge-box">'+
											'<i class="bdg bdg-piLogo"></i>'+
										'</div>'+
										'<div class="msg">'+
											'<div class="from Plug-It">'+
											'<i class="icon icon-pi"></i>'+
											'<span class="un">[Plug-It]</span>'+
											'<span class="timestamp" style="display: '+ (timestamp ? 'inline-block' : 'none') +';">'+time+'</span>'+
										'</div>'+
										'<div class="text cid-undefined">'+pi._tool.parseHTML(txt)+'</div>'+
									'</div>'+
								'</div>'
							);
							// Delete button
							$logBox.on('mouseenter', function() {
								$logBox.find('.delete-button')[0].style.display = 'block';
							});
							$logBox.on('mouseleave', function() {
								$logBox.find('.delete-button')[0].style.display = 'none';
							});
							$logBox.find('.delete-button').on('click', function() {
								$logBox.remove();
							});
							// Callback
							if (typeof callback === 'function' && (where === 'chat' || where === 'both')) {
								$logBox.css('cursor', 'pointer');
								$logBox.on('click', function() {
									callback();
									this.remove();
								});
							}
							// Make the chat scroll to custom log
							var $chat = $("#chat-messages");
							// Only if chat is overflowing & already scrolled to bottom
							if ($chat.height() + $chat.scrollTop() == $chat[0].scrollHeight && $chat[0].scrollHeight > $chat.height()) {
								var scrollIntoView = setInterval(function() {
									if ($($logBox).length > 0) {
										$chat.scrollTop($chat[0].scrollHeight);
										clearInterval(scrollIntoView);
									}
								}, 5);
							}
							$('#chat-messages').append($logBox);

							/*
							 * Can be used for future self-desctruct mode
							 *
							 * setTimeout(function(){$($logBox).remove();}, 30*1000);
							 *
							 */

							// $('#chat-messages', popup.document).append($logBox);
							// Prevents message from merging, awaiting a better solution..
							API.chatLog('Don\'t pay attention to this message please.');
							if ($('.cm.log:last').length) $('.cm.log:last')[0].remove();
							// if ($('.cm.log:last', popup.document).length) $('.cm.log:last', popup.document)[0].remove();
						}
						if (typeof where == "undefined" || where == 'console' || where == 'both') {
							console[type]('%c[%cPlug-It%c]%c','color: #EEE','color: #ABDA55','color: #EEE','',txt);
						}
					},
					modal: function(set, type, callback) {
						if (set) {
							var $dialog;

							switch(type) {
								case 'test':
									$dialog = $(
										'<div id="dialog-media-update" class="dialog">'+
											'<div class="dialog-frame">'+
												'<span class="title">Set background\'s image</span>'+
												'<i class="icon icon-dialog-close"></i>'+
											'</div>'+

											'<div class="dialog-body">'+
												'<div class="dialog-input-container" style="position:relative;top:10px;">'+
													'<span class="dialog-input-label">URL</span>'+
													'<div class="dialog-input-background">'+
														'<input type="text" placeholder=".jpg .png .gif.." name="url">'+
													'</div>'+
													'<p style="position:relative;top:55px;">'+
														'Type :<br>'+
														'"default" for plug\'s default background<br>'+
														'"reset" for script\'s default background'+
													'</p>'+
												'</div>'+
											'</div>'+

											'<div class="dialog-frame">'+
												'<div class="button cancel"><span>Cancel</span></div>'+
												'<div class="button submit"><span>Save</span></div>'+
											'</div>'+
										'</div>'
									);
								break;

								case 'custom-bg':
									$dialog = $(
										'<div id="dialog-media-update" class="dialog">'+
											'<div class="dialog-frame">'+
												'<span class="title">Set background\'s image</span>'+
												'<i class="icon icon-dialog-close"></i>'+
											'</div>'+

											'<div class="dialog-body">'+
												'<div class="dialog-input-container" style="position:relative;top:10px;">'+
													'<span class="dialog-input-label">URL</span>'+
													'<div class="dialog-input-background">'+
														'<input name="url" type="text" placeholder=".jpg .png .gif.." value="'+settings.bg+'">'+
													'</div>'+
													'<p style="position:relative;top:55px;">'+
														'Type :<br>'+
														'"default" for plug\'s default background<br>'+
														'"reset" for script\'s default background'+
													'</p>'+
												'</div>'+
											'</div>'+

											'<div class="dialog-frame">'+
												'<div class="button cancel"><span>Cancel</span></div>'+
												'<div class="button submit"><span>Save</span></div>'+
											'</div>'+
										'</div>'
									);
								break;
							}

							function submit() {
								callback($dialog.find('input[name="url"]')[0].value);
								pi._tool.modal(false);
							}

							$dialog.find('.dialog-frame i, .button.cancel').on('click', function() {pi._tool.modal(false)});
							$dialog.find('.button.submit').on('click', submit);
							$dialog.find('input[name="url"]').on('submit', submit);

							$('#dialog-container').append($dialog);
							$('#dialog-container')[0].style.display = "block";
						} else if (!set) {
							$('#dialog-container')[0].style.display = "none";
							$('#dialog-container *').each(function() {this.remove();});
						}
					},
					notify: function(title, content, events) {
						var options = {
							body: content,
							icon: "https://raw.githubusercontent.com/Plug-It/extension/master/icon128.png"
						};
						var n = new Notification(title,options);
						for (var type in events) {
							n[type] = events[type];
						}
					},
					parseHTML: function(txt) {
						if (typeof txt !== 'string') return;

						txt = txt.split('\n');
						for (var i = 0; i < txt.length; i++) {
							if (i !== txt.length-1) {
								txt[i] += '<br>';
							}
						}
						return txt.join('');
					},
					// Thanks Burkes for this (slightly modified)
					replaceString: function(string, object) {
						if (typeof string !== 'string' || typeof object !== 'object') return string;

						for (var key in object) {
							string = string.split('%%'+key.toUpperCase()+'%%').join(object[key]);
						}

						return string;
					},
					saveSettings: function() {
						localStorage.setItem('pi-settings', JSON.stringify(settings));
					},
					setPlugSettings: function(option, value) {
						// Only make ajax call if option is whitelisted
						var whiteList = ['videoOnly','chatTimestamps','emoji','tooltips','chatImages','notifyDJ','notifyScore','notifyFriendJoin','nsfw','friendAvatarsOnly'];
						for (var i = 0; i < whiteList.length; i++) {
							if (option == whiteList[i]) {
								var data = {};
								data[option] = value;
								$.ajax({
									type: 'PUT',
									url: '/_/users/settings',
									data: JSON.stringify(data),
									error: function(e) {
										pi._tool.log(e.responseJSON.data[0], 'error', 'console');
									},
									dataType: 'json',
									contentType: 'application/json'
								});
							}
						}

						var json = JSON.parse(localStorage.getItem('settings'));
						var id = API.getUser().id;
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
					showVotes: function(set, type, votes) {
						if (set) {
							// reset
							if ($('#pi-votes').length) pi._tool.showVotes(false);
							var list = '';

							if (votes.length !== 0) {
								for (var i = 0; i < votes.length; i++) {
									list += '<li>'+votes[i].rawun+'</li>\n';
								}
							}
							var $votes = $(
								'<div id="pi-votes" class="'+type+'">'+
									'<div id="header">'+$('#'+type+' .label')[0].innerText.replace('!','')+'s</div>'+
									'<ul>'+list+'</ul>'+
								'</div>'
							);
							$votes.on('mouseleave', function() {this.remove();});
							$('#vote').append($votes);
						} else {
							var piVotes = $('#pi-votes');
							while (piVotes.length) {
								piVotes.remove();
								piVotes = $('#pi-votes');
							}
						}
					},
					tooltip: function(set, type, x,y, txt) {
						if (!pi._tool.getPlugSettings().tooltips) return;
						if (set) {
							if ($('#tooltip').length) $('#tooltip').remove();;
							var $tooltip = $(
								'<div id="tooltip" class="'+type+'" style="top: '+y+'px; left: '+x+'px;">'+
									'<span>'+txt+'</span>'+
									'<div class="corner"></div>'+
								'</div>'
							);
							$('body').append($tooltip);
						}
						else {
							// Trickery in case they could be multiple #tooltip to remove all of them
							var $next = $('#tooltip').next();
							if ($next.length) {
								while ($next[0].id == 'tooltip') {
									$('#tooltip').next().remove();
									$next = $('#tooltip').next();
								}
							}
							$('#tooltip').remove();
						}
					}
				},
				afk: function(msg) {
					if (typeof originalPlaceholder == 'undefined') window.originalPlaceholder = $("#chat-input-field")[0].placeholder;

					if (settings.afk) {
						$("#chat-input-field")[0].disabled = true;
						$("#chat-input-field")[0].placeholder = 'Turn off AFK responder to chat !';
						pi.dom.afkResponder.className = 'pi-on';
					} else {
						$("#chat-input-field")[0].disabled = false;
						$("#chat-input-field")[0].placeholder = originalPlaceholder;
						pi.dom.afkResponder.className = 'pi-off';
					}
				},
				askBG: function() {
					pi._tool.modal(true, 'custom-bg', function(answer) {
						if (answer === "reset") {
							pi.changeBG(false, url.images.background);
						} else if (answer === "default") {
							pi.changeBG(true);
						} else if (answer.length > 0) {
							settings.bg = answer;
							pi.changeBG(false);
						}
					});
				},
				autojoin: function() {
					var dj = API.getDJ();

					if (settings.autoDJ && pi._tool.getRoomRules('allowAutojoin')) {
						if (typeof dj !== 'undefined') {
							if (dj.id !== API.getUser().id && API.getWaitListPosition() === -1) {
								switch (API.djJoin()) {
									case 1:
										pi._tool.log(lang.error.autoJoin1, 'error', 'chat');
									break;
									case 2:
										pi._tool.log(lang.error.autoJoin2, 'error', 'chat');
									break;
									case 3:
										pi._tool.log(lang.error.autoJoin3, 'error', 'chat');
									break;
								}
							}
						} else {
							API.djJoin();
						}
					}
				},
				autowoot: function() {
					if (settings.autoW && !$('#meh').is('.selected') &&
						pi._tool.getRoomRules('allowAutowoot')) {
						$('#woot')[0].click();
					}
				},
				betterClearChat: function(x) {
					let messages = $('#chat-messages > div').toArray();

					if (x < messages.length) {
						// jQuery.each() does not passes the array
						messages.forEach(function(e,i,a) {
							if (i + x < a.length) $(e).remove();
						});
					}
				},
				changeBG: function(isDefault, src) {
					if (isDefault) {
						$('.room-background').show();
						$('#pi-background').hide();

						if ($('i.torch').length) {
							$('i.torch').show();
							$('i.torch.right').show();
						}

						pi.dom.bg.className = 'pi-off';
					} else {
						if (typeof src === 'undefined' && !settings.bg.length) {
							src = url.images.background;
						} else if (typeof src === undefined && settings.bg.length) {
							src = settings.bg;
						} else {
							src = (typeof src === "string" ? src : url.images.background);
						}

						$('.room-background').hide();
						$('#pi-background').show();
						$('#pi-background').css('background', 'url('+src+') no-repeat');

						if ($('i.torch').length) {
							$('i.torch').hide();
							$('i.torch.right').hide();
						}

						pi.dom.bg.className = 'pi-on';
					}

					pi._tool.saveSettings();
				},
				eta: function(log) {
					let eta;

					if (API.getUser().id == API.getDJ().id) {
						eta = lang.info.youPlay;
					} else if (API.getWaitListPosition() == -1) {
						eta = lang.info.notInWaitList;
					} else if (API.getWaitListPosition() == 0) {
						eta = API.getTimeRemaining();
						if (eta >= 3600) {
							var etaH = Math.floor(eta/60);
							var etaM = eta%60;
							eta = etaH+'h'+etaM+'m '+lang.log.eta;
						} else if (eta >= 60) {
							var etaM = Math.floor(eta/60);
							var etaS = eta%60;
							etaS < 10 ? etaS = '0'+etaS : '';
							eta = etaM+'m'+etaS+'s '+lang.log.eta;
						} else {
							eta = eta+'s '+lang.log.eta;
						}
					} else {
						eta = (API.getWaitListPosition())*4*60;
						eta += API.getTimeRemaining();
						if (eta >= 3600) {
							var etaH = Math.floor(eta/60/60);
							var etaM = eta%60;
							eta = etaH+'h'+etaM+'m '+lang.log.eta;
						} else {
							var etaM = Math.floor(eta/60);
							var etaS = eta%60;
							eta = etaM+'m'+etaS+'s '+lang.log.eta;
						}
					}

					if (log) pi._tool.log(eta, 'info', 'chat');
					return eta;
				},
				forceSkip: function() {
					if (sessionStorage.getItem('modSkipWarn') == 'false') {
						sessionStorage.setItem('modSkipWarn', 'true');
						pi._tool.log(lang.warn.confirmSkip, 'warn', 'chat');
					} else {
						sessionStorage.setItem('modSkipWarn', 'false');;
						API.moderateForceSkip();
					}
				},
				hideStream: function() {
					if (settings.showVideo) {
						$(pi.dom.stream).css({visibility:'visible', height:'281px'});
						if (API.hasPermission(null,API.ROLE.BOUNCER)) {
							$([pi.dom.rmvDJ, pi.dom.skip]).css('top', '281px');
						}
						$('#playback-controls, #no-dj').css('visibility', 'visible');
						pi.dom.video.className = 'pi-off';
					} else {
						$(pi.dom.stream).css({visibility:'hidden', height:'0'});
						if (API.hasPermission(null,API.ROLE.BOUNCER)) {
							$([pi.dom.rmvDJ, pi.dom.skip]).css('top', '0');
						}
						$('#playback-controls, #no-dj').css('visibility', 'hidden');
						pi.dom.video.className = 'pi-on';
					}
				},
				menu: function(choice) {
					switch(choice) {
						case 'woot':
							settings.autoW = !settings.autoW;
							pi.dom.woot.className = settings.autoW ? 'pi-on' : 'pi-off';
							pi.autowoot();
						break;
						case 'join':
							settings.autoDJ = !settings.autoDJ;
							pi.dom.join.className = settings.autoDJ ? 'pi-on' : 'pi-off';
							pi.autojoin();
						break;
						case 'keyShortcut':
							settings.keyboardShortcuts = !settings.keyboardShortcuts;
							pi.dom.keyShortcut.className = settings.keyboardShortcuts ? 'pi-on' : 'pi-off';
						break;
						case 'chatCommands':
							settings.chatCommands = !settings.chatCommands;
							pi.dom.chatCommands.className = settings.chatCommands ? 'pi-on' : 'pi-off';
						break;
						case 'mutemeh':
							settings.betterMeh = !settings.betterMeh;
							pi.muteMeh();
						break;
						case 'afkResponder':
							settings.afk = !settings.afk;
							pi.afk();
						break;
						case 'navWarn':
							settings.navWarn = !settings.navWarn;
							pi.dom.navWarn.className = settings.navWarn ? 'pi-on' : 'pi-off';
						break;
						case 'showVotes':
							settings.showVotes = !settings.showVotes;
							pi.dom.showVotes.className = settings.showVotes ? 'pi-on' : 'pi-off';
						break;
						case 'video':
							settings.showVideo = !settings.showVideo;
							pi.hideStream();
						break;
						case 'soundcloudVisu':
							settings.scVisu = !settings.scVisu;
							pi.dom.soundcloudVisu.className = settings.scVisu ? 'pi-on' : 'pi-off';
							pi.soundcloudVisu();
						break;
						case 'room-style':
							settings.roomStyle = !settings.roomStyle;
							pi.dom.roomStyle.className = settings.roomStyle ? 'pi-on' : 'pi-off';
							pi.toggleStyle('roomStyle');
						break;
						case 'css':
							settings.CSS = !settings.CSS;
							pi.dom.css.className = settings.CSS ? 'pi-on' : 'pi-off';
							pi.toggleStyle('customStyle');
						break;
						case 'bg':
							pi.askBG();
						break;
						case 'old-chat':
							settings.oldChat = !settings.oldChat;
							pi.dom.oldChat.className = settings.oldChat ? 'pi-on' : 'pi-off';
							pi.toggleStyle('oldChat');
						break;
						case 'old-footer':
							settings.oldFooter = !settings.oldFooter;
							pi.dom.oldFooter.className = settings.oldFooter ? 'pi-on' : 'pi-off';
							pi.toggleStyle('oldFooter');
						break;
						case 'small-history':
							settings.smallHistory = !settings.smallHistory;
							pi.dom.smallHistory.className = settings.smallHistory ? 'pi-on' : 'pi-off';
							pi.toggleStyle('smallHistory');
						break;
						case 'userInfo':
							settings.userInfo = !settings.userInfo;
							pi.dom.userInfo.className = settings.userInfo ? 'pi-on' : 'pi-off';
						break;
						case 'lengthA':
							settings.songLimit = !settings.songLimit;
							pi.dom.lengthA.className = settings.songLimit ? 'pi-on' : 'pi-off';
						break;
						case 'historyA':
							settings.historyAlert = !settings.historyAlert;
							pi.dom.historyAlert.className = settings.historyAlert ? 'pi-on' : 'pi-off';
						break;
						case 'systemNotifications':
							settings.systemNotifications = !settings.systemNotifications;
							pi.dom.systemNotifications.className = settings.systemNotifications ? 'pi-on' : 'pi-off';
							if (settings.systemNotifications && Notification.permission == 'default') {
								Notification.requestPermission(function(status){
									if (Notification.permission !== status) Notification.permission = status;
								});
							}
						break;
						case 'boothAlert':
							settings.boothAlert = !settings.boothAlert;
							pi.dom.boothAlert.className = settings.boothAlert ? 'pi-on' : 'pi-off';
						break;
						case 'userJoin':
							settings.userJoin = !settings.userJoin;
							pi.dom.userJoin.className = settings.userJoin ? 'pi-on' : 'pi-off';
						break;
						case 'userLeave':
							settings.userLeave = !settings.userLeave;
							pi.dom.userLeave.className = settings.userLeave ? 'pi-on' : 'pi-off';
						break;
						case 'userWoot':
							settings.userWoot = !settings.userWoot;
							pi.dom.userWoot.className = settings.userWoot ? 'pi-on' : 'pi-off';
						break;
						case 'userGrab':
							settings.userGrab = !settings.userGrab;
							pi.dom.userGrab.className = settings.userGrab ? 'pi-on' : 'pi-off';
						break;
						case 'userMeh':
							settings.userMeh = !settings.userMeh;
							pi.dom.mehA.className = settings.userMeh ? 'pi-on' : 'pi-off';
						break;
						case 'guestJoin':
							settings.guestJoin = !settings.guestJoin;
							pi.dom.guestJoin.className = settings.guestJoin ? 'pi-on' : 'pi-off';
						break;
						case 'guestLeave':
							settings.guestLeave = !settings.guestLeave;
							pi.dom.guestLeave.className = settings.guestLeave ? 'pi-on' : 'pi-off';
						break;
						case 'friendRoomChange':
							settings.friendRoomChange = !settings.friendRoomChange;
							pi.dom.friendRoomChange.className = settings.friendRoomChange ? 'pi-on' : 'pi-off';
						break;
						case 'friendConnect':
							settings.friendConnect = !settings.friendConnect;
							pi.dom.friendConnect.className = settings.friendConnect ? 'pi-on' : 'pi-off';
						break;
						case 'friendDisconnect':
							settings.friendDisconnect = !settings.friendDisconnect;
							pi.dom.friendDisconnect.className = settings.friendDisconnect ? 'pi-on' : 'pi-off';
						break;
						case 'unfriended':
							settings.unfriended = !settings.unfriended;
							pi.dom.unfriended.className = settings.unfriended ? 'pi-on' : 'pi-off';
						break;
						case 'gainNotification':
							settings.gainNotification = !settings.gainNotification;
							pi.dom.gainNotification.className = settings.gainNotification ? 'pi-on' : 'pi-off';
						break;

						case 'init':
							// Init menu item's class
							// General
							pi.dom.woot.className = settings.autoW ? 'pi-on' : 'pi-off';
							pi.autowoot();
							pi.dom.join.className = settings.autoDJ ? 'pi-on' : 'pi-off';
							pi.autojoin();
							pi.dom.keyShortcut.className = settings.keyboardShortcuts ? 'pi-on' : 'pi-off';
							pi.dom.chatCommands.className = settings.chatCommands ? 'pi-on' : 'pi-off';
							pi.muteMeh();
							pi.dom.afkResponder.className = settings.afk ? 'pi-on' : 'pi-off';
							pi.dom.afkMessage.children[0].value = settings.afkMessage;
							pi.afk();
							pi.dom.navWarn.className = settings.navWarn ? 'pi-on' : 'pi-off';
							pi.dom.showVotes.className = settings.showVotes ? 'pi-on' : 'pi-off';
							pi.dom.betterClearChatLimit.children[0].value = settings.betterClearChatLimit;
							pi.dom.chatLimit.children[0].value = settings.chatLimit;
							// Customisation
							pi.hideStream();
							pi.dom.soundcloudVisu.className = settings.scVisu ? 'pi-on' : 'pi-off';
							pi.dom.css.className = settings.CSS ? 'pi-on' : 'pi-off';
							pi.toggleStyle('customStyle');
							settings.bg.length ? pi.changeBG(false, settings.bg) : void 0;
							pi.dom.oldChat.className = settings.oldChat ? 'pi-on' : 'pi-off';
							pi.toggleStyle('oldChat');
							pi.dom.oldFooter.className = settings.oldFooter ? 'pi-on' : 'pi-off';
							pi.toggleStyle('oldFooter');
							pi.dom.smallHistory.className = settings.smallHistory ? 'pi-on' : 'pi-off';
							pi.toggleStyle('smallHistory');
							// Moderation
							pi.dom.userInfo.className = settings.userInfo ? 'pi-on' : 'pi-off';
							pi.dom.lengthA.className = settings.songLimit ? 'pi-on' : 'pi-off';
							pi.dom.songLength.children[0].value = settings.songLength;
							pi.dom.historyAlert.className = settings.historyAlert ? 'pi-on' : 'pi-off';
							// Notifications
							pi.dom.systemNotifications.className = settings.systemNotifications ? 'pi-on' : 'pi-off';
							pi.dom.boothAlert.className = settings.boothAlert ? 'pi-on' : 'pi-off';
							pi.dom.boothPosition.children[0].value = settings.boothPosition;
							pi.dom.userJoin.className = settings.userJoin ? 'pi-on' : 'pi-off';
							pi.dom.userLeave.className = settings.userLeave ? 'pi-on' : 'pi-off';
							pi.dom.userWoot.className = settings.userWoot ? 'pi-on' : 'pi-off';
							pi.dom.userGrab.className = settings.userGrab ? 'pi-on' : 'pi-off';
							pi.dom.mehA.className = settings.userMeh ? 'pi-on' : 'pi-off';
							pi.dom.guestJoin.className = settings.guestJoin ? 'pi-on' : 'pi-off';
							pi.dom.guestLeave.className = settings.guestLeave ? 'pi-on' : 'pi-off';
							pi.dom.friendRoomChange.className = settings.friendRoomChange ? 'pi-on' : 'pi-off';
							pi.dom.friendConnect.className = settings.friendConnect ? 'pi-on' : 'pi-off';
							pi.dom.friendDisconnect.className = settings.friendDisconnect ? 'pi-on' : 'pi-off';
							pi.dom.unfriended.className = settings.unfriended ? 'pi-on' : 'pi-off';
							pi.dom.gainNotification.className = settings.gainNotification ? 'pi-on' : 'pi-off';
						break;

						case 'off':
							pi._close();
						break;
					}

					pi._tool.saveSettings();
				},
				muteMeh: function() {
					var restoreVol = function() {
						if (!$('#woot').hasClass('disabled')) {
							API.setVolume(pi._tool.getPlugSettings().volume);
							API.off(API.ADVANCE, restoreVol);
							$('#woot').off('click', restoreVol);
						}
					};
					var mute = function() {
						if (!$('#meh').hasClass('disabled')) {
							API.setVolume(0);
							API.on(API.ADVANCE, restoreVol);
							$('#woot').on('click', restoreVol);
						}
					};

					if (settings.betterMeh) {
						$('#meh').on('click', mute);
						pi.dom.betterMeh.className = 'pi-on';
					} else {
						$('#meh').off('click', mute);
						pi.dom.betterMeh.className = 'pi-off';
					}
				},
				removeDJ: function() {
					if (sessionStorage.getItem('modQuitWarn') == 'false') {
						sessionStorage.setItem('modQuitWarn', 'true');;
						pi._tool.log(lang.warn.confirmEject, 'warn', 'chat');
					} else {
						sessionStorage.setItem('modQuitWarn', 'false');;
						API.moderateForceQuit();
					}
				},
				songLimit: function() {
					if (settings.songLimit) {
						if (API.getMedia() !== undefined) {
							if (API.getMedia().duration > settings.songLength) {
								// notif.play();
								pi._tool.log(pi._tool.replaceString(lang.warn.songLimit, {max:settings.songLength}), 'warn', 'chat');
							}
						}
					}
				},
				soundcloudVisu: function() {
					let $scFrame = $('#sc-frame');
					let $myFrame = $('#pi-frame');
					let song = API.getMedia();

					if (song.format === 1 && $('#pi-frame').is(':visible')) {
						return $myFrame.hide();
					} else if (song.format === 1) {
						return;
					}

					if (settings.scVisu && !pi._tool.getPlugSettings().streamDisabled) {
						let randomVisu = Math.floor(Math.random()*url.visu.length);
						$scFrame.hide();
						$myFrame.show();
						$myFrame[0].src = url.visu[randomVisu];
					} else {
						$scFrame.show();
						$myFrame.hide();
					}
				},
				toggleStyle: function(which) {
					switch(which) {
						case 'roomStyle':
							if (settings.roomStyle) {
								var $roomLink = $('<link id="pi-custom-room-style" rel="stylesheet" type="text/css" href="'+roomSettings.css+'">');
								$('head').append($roomLink);
							} else {
								$('#pi-custom-room-style').remove();
							}
						break;

						case 'customStyle':
							if (settings.CSS) {
								$('head').append($('<link id="pi-CSS" rel="stylesheet" type="text/css" href="'+url.styles.blue_css+'">'));
								pi.changeBG(false);
							} else {
								$('#pi-CSS').remove();
								pi.changeBG(true);
							}
						break;

						case 'oldChat':
							if (settings.oldChat) {
								$('head').append($('<link id="pi-oldchat-CSS" rel="stylesheet" type="text/css" href="'+url.styles.old_chat+'">'));
							}
							else
								$('#pi-oldchat-CSS').remove();

							// You found an easter egg !
							window.WiBla = {
								listen: 'always',
								rulesTheWorld: 'not yet :troll:',
								isOnFire: function() {
									console.log(
										"%c                '@@             `.     @'          \n"+
										"%c     @@         @@@   @,    :'@@@@@#   @@          \n"+
										"%c     @@         @@;  +@@   @@@@@@@@@  ,@@          \n"+
										"%c    +@@    `    @@   :@+   @@@;  `@@  @@@          \n"+
										"%c    @@@   @@.   @@         @@`  `@@'  @@.          \n"+
										"%c    @@    @@   ;@@   @,   .@@ `@@@+   @@     ;@@@` \n"+
										"%c   +@@   ;@@   @@+  @@@   @@@@@@@    ,@@    @@@@@@ \n"+
										"%c   @@+   @@@   @@   @@:   @@@@@@,    @@@   @@@@@@; \n"+
										"%c   @@   ;@@;  :@@   @@    @@@@@@@@   @@.  #@@, @@  \n"+
										"%c  '@@   @@@,  @@.  ,@@   +@@   ,@@.  @@   @@; :@@  \n"+
										"%c  @@@  @@@@, `@@   @@@   @@;    @@  :@@  ,@@ ,@@@  \n"+
										"%c  @@; :@@@@+ @@`   @@,   @@   #@@@  @@@  @@@#@@@;  \n"+
										"%c  @@.`@@ ;@@@@@    @@   +@@@@@@@'   @@'  ;@@@@@@   \n"+
										"%c  @@@@@   @@@@     @@   +@@@@@'     @@,   @@@ @@   \n"+
										"%c  :@@@     @:      ',               `#             ",
										"color: hsl(210,0%,0%);   text-shadow: 0 0 20px",
										"color: hsl(210,5%,5%);   text-shadow: 0 0 20px",
										"color: hsl(210,10%,10%); text-shadow: 0 0 20px",
										"color: hsl(210,15%,15%); text-shadow: 0 0 20px",
										"color: hsl(210,20%,20%); text-shadow: 0 0 20px",
										"color: hsl(210,25%,25%); text-shadow: 0 0 20px",
										"color: hsl(210,30%,30%); text-shadow: 0 0 20px",
										"color: hsl(210,35%,35%); text-shadow: 0 0 20px",
										"color: hsl(210,40%,40%); text-shadow: 0 0 20px",
										"color: hsl(210,45%,45%); text-shadow: 0 0 20px",
										"color: hsl(210,50%,50%); text-shadow: 0 0 20px",
										"color: hsl(215,50%,50%); text-shadow: 0 0 20px",
										"color: hsl(220,50%,50%); text-shadow: 0 0 20px",
										"color: hsl(225,50%,50%); text-shadow: 0 0 20px",
										"color: hsl(230,50%,50%); text-shadow: 0 0 20px");
								}
							}
						break;

						case 'oldFooter':
							if (settings.oldFooter) {
								$('head').append($('<link id="pi-oldfooter-CSS" rel="stylesheet" type="text/css" href="'+url.styles.old_footer+'">'));
							} else {
								$('#pi-oldfooter-CSS').remove();
							}
						break;

						case 'smallHistory':
							if (settings.smallHistory) {
								$('head').append($('<link id="pi-smallHistory-CSS" rel="stylesheet" type="text/css" href="'+url.styles.small_history+'">'));
							} else {
								$('#pi-smallHistory-CSS').remove();
							}
						break;
					}
				},
				voteAlert: function(data) {
					if (typeof data.vote == 'undefined' && data.user.grab && settings.userGrab) {
						pi._tool.log(data.user.username + (settings.userInfo ? ' Lvl:'+data.user.level+'|'+'Id:'+data.user.id : '') + lang.log.grabbed, 'chat');
					} else if (data.vote == 1 && !data.user.grab && settings.userWoot) {
						pi._tool.log(data.user.username + (settings.userInfo ? ' Lvl:'+data.user.level+'|'+'Id:'+data.user.id : '') + lang.log.wooted, 'chat');
					} else if (data.vote == -1 && settings.userMeh && pi._tool.getRoomRules('allowShowingMehs')) {
						pi._tool.log(data.user.username + (settings.userInfo ? ' Lvl:'+data.user.level+'|'+'Id:'+data.user.id : '') + lang.log.meh, 'chat');
					}
				}
			};

			pi._load();
		}
	}
	else console.error('You are trying to run Plug-It outside of plug.dj !');
})();

// Placed outside of closure to ensure eval can't access private vars
function execute(code) {
	if (sessionStorage.getItem('trustWarn') == 'false') {
		sessionStorage.setItem('trustWarn', 'true');
		pi._tool.log(executeWarn, 'warn', 'chat', function() {execute(code)});
	} else {
		try {eval(code);} catch(err){pi._tool.log(err+'', 'error', 'chat');}
	}
}
