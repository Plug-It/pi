/*
	Plug-It - Heavily customise your Plug.dj experience.

	Developed by: WiBla <contact.wibla@gmail.com>
	Copyright (c) 2014-2017 WiBla.

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
	along with this program. If not, see <http://www.gnu.org/licenses/>.

	Special thanks to:
		- All the alpha & beta testers !
		- Hideki for creating such an amazing community and helping me at the very beginning.
		- Zurbo, So much to say.. Thank you for supporting and helping me everyday.
		- Sinful for being so kind and teaching me how to use CSS attribute selectors.
		- TheDark1337 for always answering my silly questions about javascript and his script.
		- Dano-em for making me love jQuery.
		- The creators & maintainers of this repository: https://github.com/plugcommunity/documentation
		  for putting together such an amazing source of documentation.

	Library Used:
		Plug's Front-End API
		  -> http://support.plug.dj/hc/en-us/sections/200353347-Front-End-API
		jQuery
		  -> https://jquery.com
		RequireJS
		  -> http://requirejs.org
		ExtPlug Socket Intercept
			-> https://github.com/extplug/ExtPlug/blob/master/src/plugins/SocketEventsPlugin.js

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
			- Playlist mixing
		TastyPlug https://tastyplug.tastycat.org/
			- Menu UI & UX
			- Hide video

		I also recommend these scripts as an alternative:
			- plug_p0ne https://p0ne.com/plug_p0ne/
				Very powerfull and full of goodness !
			- ExtPlug https://extplug.github.io/
				Install plugins with a simple link or make one yourself !
				(In beta but dev. very active !)
*/

;(function load() {
	var isPlugRoom = /(http(?:s)?:\/\/(?:[a-z]+\.)*plug\.dj\/)(?!about$|ba$|forgot-password$|founders$|giftsub\/\d|jobs$|legal$|merch$|partners$|plot$|privacy$|purchase$|subscribe$|team$|terms$|press$|_\/|@\/|!\/)(.+)/i;
	if (isPlugRoom.test(location.href)) {
		if (typeof pi !== 'undefined') pi._reload();
		else if (plugReady()) {
			// Status (can be used to debug)
			$('.app-header').after($(
				'<div id="pi-status">'+
					'<img height="30px" src="https://raw.githubusercontent.com/Plug-It/pi/pre-release/img/other/icon-54.png">'+
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
				case 'cs': lang = 'cs'; break;
				case 'de': lang = 'de'; break;
				case 'et': lang = 'et'; break;
				case 'fr': lang = 'fr'; break;
				case 'nl': lang = 'nl'; break;
				case 'pl': lang = 'pl'; break;
				case 'pt': lang = 'pt'; break;
				case 'sl': lang = 'sl'; break;
				case 'sv': lang = 'sv'; break;
				default: lang = 'en'; break;
			}
			$.ajax({
				dataType: 'json',
				url: 'https://rawgit.com/Plug-It/pi/pre-release/lang/'+lang+'.json',
				success: function(data) {
					lang = data;
				},
				error: function(e) {
					console.log('[Plug-It] Error while loading translation:\n', e);
					API.chatLog('[Plug-It] Error while loading translation: ' + e.statusText + '. Check the console for more info.');
				}
			});

			// Load script ranks
			updateStatus('Loading script ranks', 2);
			$.ajax({
				dataType: 'json',
				url: 'https://rawgit.com/Plug-It/pi/pre-release/json/ranks.json',
				success: function(data) {
					ranks = data;
					init();
				},
				error: function(e) {
					console.log('[Plug-It] Error while loading script ranks:\n', e);
					API.chatLog('[Plug-It] Error while loading script ranks: ' + e.statusText + '. Check the console for more info.');
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
			const delay = (API.getUser().gRole >= API.ROLE.MANAGER ? 200 : 3500);
			const CHAT_INTERCEPT_STRING = `Plug-It Socket Intercept: ${Math.random()}`;
			const YTAPIkey = 'AIzaSyC8pk0f57a_UcAIbHdrvRhsmHSG1KZk2SM';
			const url = {
				script: 'https://rawgit.com/Plug-It/pi/pre-release/js/pi.js',
				styles: {
					blue_css: 'https://rawgit.com/Plug-It/pi/pre-release/css/blue.css',
					menu_css: 'https://rawgit.com/Plug-It/pi/pre-release/css/menu.css',
					popout: 'https://rawgit.com/Plug-It/pi/pre-release/css/popout.css',
					popout_blue: 'https://rawgit.com/Plug-It/pi/pre-release/css/popout-blue.css',
					custom_ranks: 'https://rawgit.com/Plug-It/pi/pre-release/css/custom-ranks.css',
					old_chat: 'https://rawgit.com/Plug-It/pi/pre-release/css/old-chat.css',
					old_footer: 'https://rawgit.com/Plug-It/pi/pre-release/css/old-footer.css',
					small_history: 'https://rawgit.com/Plug-It/pi/pre-release/css/small-history.css',
					small_friends: 'https://rawgit.com/Plug-It/pi/pre-release/css/small-friends.css',
					small_playlists: 'https://rawgit.com/Plug-It/pi/pre-release/css/small-playlists.css'
				},
				images: {
					background: 'https://raw.githubusercontent.com/Plug-It/pi/pre-release/img/background/non-official/Plug-It-old.jpg'
				},
				sounds: {
					// https://www.freesound.org/people/TheGertz/sounds/235911/
					notification:  'https://raw.githubusercontent.com/Plug-It/pi/pre-release/sounds/notification.wav',
					// https://www.freesound.org/people/soneproject/sounds/255102/
					jingle:        'https://raw.githubusercontent.com/Plug-It/pi/pre-release/sounds/jingle.wav'
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
				autoHideLogs: false,
				autoHideLogsAfter: 10,
				betterMeh: false,
				navWarn: false,
				afk: false,
				afkMessage: null,
				showVotes: false,
				betterClearChatLimit: 5,
				chatLimit: 512,
				skipNextMediaInHistory: false,
				// Customisation
				showVideo: true,
				scVisu: false,
				roomStyle: true,
				CSS: false,
				customRanks: false,
				languageFlags: false,
				friendsIcons: false,
				customBG: false,
				customBGURL: null,
				oldChat: false,
				oldFooter: false,
				smallHistory: false,
				smallFriends: false,
				smallPlaylists: false,
				// Moderation
				showDeletedMsg: false,
				confirmDelete: false,
				gRoleCmdSelfDel: true,
				userInfo: false,
				stuckSkip: false,
				songLimit: false,
				songLength: 420, // Blaze-it
				historyAlert: false,
				// Notifications
				systemNotifications: false,
				songStats: false,
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
				friendEventsList: {
					whiteList: {
						active: false
					},
					blacklist: {
						active: true,
						users: {
							"3537523": {
								roomChange: false,
								connect: false,
								disconnect: false,
								unfriended: true,
							}
						}
					}
				},
				gainNotification: false,
				minimumGain: {
					xp: 1,
					pp: 2,
				},
				userLevelUp: false,
				// Custom Roles
				bot: [5285179],
				discordbot: [20852061]
			};
			var roomSettings = {};
			var cooldown = {
				'afkResponder': startTime - 60*1000,
				'voteShortcut': startTime - 5000
			};
			var emotes = {};
			var modules = {};
			var session = {
				unread: false, // used to notify on unread messages + window blurred
				floodAPI: false,
				woots: API.getUsers().filter(x => x.vote == 1),
				grabs: API.getUsers().filter(x => x.grab),
				mehs:  API.getUsers().filter(x => x.vote == -1),
				chat: []
			};

			// Prototypes
			Number.prototype.spaceOut = function() {
				if (isNaN(this) || this < 999) return this;
				return (this).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
			};
			function meldBefore(object, property, cb) {
				const originalFunction = object[property];

				object[property] = function wrapped() {
					cb(arguments[0]);
					originalFunction.call(object, arguments[0]);
				}

				return {
					remove: function() {
						object[property] = originalFunction;
					}
				};
			};
			// gives the user all permissions client-side temporarily, to make sure that
			// a chat message will actually be passed to the socket.
			function sudo(cb) {
				const originalUser = modules.user.toJSON();
				modules.user.set({
					id: 1,
					guest: false,
					level: 50,
					role: API.ROLE.HOST,
					gRole: API.ROLE.HOST,
				}, { silent: true });

				const originalRoom = _.pick(modules.room.toJSON(), 'joined', 'minChatLevel');
				modules.room.set({
					joined: true,
					minChatLevel: 0,
				}, { silent: true });

				// this forces the chat slowmode cooldown timer to always return 0, thus
				// working around slowmode
				const originalMax = Math.max;
				Math.max = () => 0;

				cb();

				Math.max = originalMax;
				modules.room.set(originalRoom, { silent: true });
				modules.user.set(originalUser, { silent: true });
			}
			function getSocket() {
				// If RCS is loaded and already has a reference to the WebSocket, just use
				// that.
				if (window.rcs && window.rcs.plugSock &&
					window.rcs.plugSock.sock instanceof WebSocket) {
					return window.rcs.plugSock.sock;
				}

				const send = WebSocket.prototype.send;
				let socket;
				WebSocket.prototype.send = function sendIntercept(data) {
					if (this.url.indexOf('plug.dj') !== -1 && data.indexOf(CHAT_INTERCEPT_STRING) !== -1) {
						socket = this;
						WebSocket.prototype.send = send;
					} else {
						send.call(this, data);
					}
				};
				sudo(() => {
					modules.chatFacade.sendChat(CHAT_INTERCEPT_STRING);
				});

				// restore even if it didn't work
				WebSocket.prototype.send = send;

				return socket;
			}

			window.pi = {
				version: {
					major: 1,
					minor: 0,
					patch: 0,
					pre: 28
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
								media: {},
								score: {
									grabs: x,
									positive: y,
									negative: z
								}
							}
						}; */

						pi.autojoin();

						// Checking if a media is playing
						if (!song.dj || !song.media) return;

						if (API.getUser().id !== song.dj.id) {
							setTimeout(function() {
								pi.autowoot();
							}, Math.ceil((Math.random()*10)*1000));
						}

						pi.songLimit();
						pi.soundcloudVisu(song.media);

						if (settings.songStats) {
							pi._tool.log(
								pi._tool.replaceString(lang.info.songStats, {
									dj: song.lastPlay.dj.username,
									author: song.lastPlay.media.author,
									title: song.lastPlay.media.title,
									woots: song.lastPlay.score.positive,
									grabs: song.lastPlay.score.grabs,
									mehs: song.lastPlay.score.negative
								}), 'info chat'
							);
						}

						if (settings.stuckSkip && API.hasPermission(null, API.ROLE.BOUNCER)) {
							setTimeout(function() {
								// verifying the song is the same AND setting is still enbaled
								if (song.media.cid === API.getMedia().cid && settings.stuckSkip) {
									API.sendChat(lang.userchat.songStuck);
									API.moderateForceSkip();
								}
							}, song.media.duration*1000 + 5000);
						}

						// Checking if the next media is in room history
						// This is on a timeout because this can happen:
						// http://i.imgur.com/kAy7QRN.png (only when after
						// your own play due to playlist refreshing,
						// thanks ReAnna fot this info BTW !)
						setTimeout(function() {
							if (settings.skipNextMediaInHistory && API.getWaitListPosition() === 0 && API.getNextMedia().inHistory &&!floodAPI) {
								$.ajax({
									url: '/_/playlists/'+API.getActivePlaylist().id+'/media/move',
									type: 'PUT',
									data: JSON.stringify({
										beforeID: -1,
										ids: [API.getNextMedia().media.id]
									}),
									success: function() {
										pi._tool.log(lang.info.nextMediaSkip, 'info chat');
									},
									error: function() {
										pi._tool.log(lang.warn.nextMediaInHistory, 'warn chat');
									},
									dataType: 'json',
									contentType: 'application/json'
								});
							}
						}, 10000);

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

						if (msg.type === 'log') return;
						// This message node
						let selector = '#chat [data-cid="'+msg.cid+'"]';
						let sender = API.getUser(msg.uid);

						// Second message from the same user, things that only are set once
						if ($(selector).length) {
							// Self Deletion Magic
							if (msg.uid == API.getUser().id && API.hasPermission(null, API.ROLE.BOUNCER)) {
								$(selector)[0].className += ' deletable';
								$(selector).prepend('<div class="delete-button" style="display: none;">'+lang.glossary.delete+'</div>');
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
							// Deletion confirmation
							if (settings.confirmDelete) {
								$(selector + ' .delete-button').off('click');
								$(selector + ' .delete-button').on('click', function(e) {
									e.preventDefault();
									if (e.shiftKey) return API.moderateDeleteChat(msg.cid);
									pi._tool.modal(true, 'confirmDelete', function() {
										API.moderateDeleteChat(msg.cid);
									}, msg);
								});
							}
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

						// Server chat commands
						if (['Dev', 'Community Manager'].indexOf(pi._tool.getRank(sender.id)) !== -1) {
							switch(msg.message) {
								case '!strobe on':
								if (!$('#pi-strobe').length) {
									var $strobe = $('<style id="pi-strobe">@keyframes strobe{0%{-webkit-filter:brightness(200%);filter:brightness(200%)}10%{-webkit-filter:brightness(10%);filter:brightness(10%)}}@keyframes strobe2{0%{box-shadow:0 20px 200px #fff}10%{box-shadow:none}}#avatars-container,#dj-button,#vote,.room-background,#pi-background{-webkit-filter:brightness(10%);filter:brightness(10%)}#avatars-container{animation:strobe .45s linear infinite}#playback-container{box-shadow:none!important;animation:strobe2 .45s linear infinite}</style>');
									$('head').append($strobe);
									pi._tool.log(pi._tool.replaceString(lang.log.strobeOn, {user: sender.username}), 'chat');
								}
								break;
								case '!strobe off':
								if ($('#pi-strobe').length) {
									$('#pi-strobe')[0].remove();
									pi._tool.log(pi._tool.replaceString(lang.log.strobeOff, {user: sender.username}), 'chat');
								}
								break;
								case '!rainbow on':
								if (!$('#pi-rainbow').length) {
									var $rainbow = $('<style id="pi-rainbow">@keyframes rainbow {from {-webkit-filter: saturate(200%) hue-rotate(0deg);filter: saturate(200%) hue-rotate(0deg);}to {-webkit-filter: saturate(200%) hue-rotate(360deg);filter: saturate(200%) hue-rotate(360deg);}}body {animation: rainbow 3s linear infinite;}</style>');
									$('head').append($rainbow);
									pi._tool.log(pi._tool.replaceString(lang.log.rainbowOn, {user: sender.username}), 'chat');
								}
								break;
								case '!rainbow off':
								if ($('#pi-rainbow').length) {
									$('#pi-rainbow')[0].remove();
									pi._tool.log(pi._tool.replaceString(lang.log.rainbowOff, {user: sender.username}), 'chat');
								}
								break;
							}
						}
						// !joindisable & !afkdisable
						// Different codeStyle because direcrly inspired by p3
						let a = msg.type === 'mention' && API.hasPermission(msg.uid, API.ROLE.BOUNCER);
						let b = msg.message.indexOf('@') < 0 && (API.hasPermission(msg.uid, API.ROLE.MANAGER) || ['Dev', 'Community Manager'].indexOf(pi._tool.getRank(sender.id)) !== -1)
						if (a || b) {
							if (msg.message.indexOf('!joindisable') > -1 && settings.autoDJ) {
								pi.menu('join');
								API.sendChat(`@${msg.un} Auto-join disabled!`);
							} else if (msg.message.indexOf('!afkdisable') > -1 && settings.afk) {
								pi.menu('afkResponder');
								API.sendChat(`@${msg.un} AFK responder disabled!`);
							}
						}
						// Auto AFK responder with 60s cooldown (prevents spam)
						if (((msg.sound && msg.sound === "mention") || msg.type == 'mention') &&
						    msg.uid !== API.getUser().id &&
						    settings.afk &&
						    pi._tool.getRoomRules('allowAutorespond') &&
						    (new Date().getTime() - cooldown.afkResponder)/1000/60 > 1) {
							if (settings.afkMessage.length) API.sendChat('@'+msg.un + ' [AFK]: '+settings.afkMessage);
							else API.sendChat(pi._tool.replaceString(lang.userchat.afkResponder, {mention: msg.un}));
							cooldown.afkResponder = new Date().getTime();
						}
						// System notifications on mention and window blured
						else if (((msg.sound && msg.sound === "mention") || msg.type == 'mention') &&
							settings.systemNotifications && !document.hasFocus() && !settings.afk) {
							pi._tool.notify(
								pi._tool.replaceString(lang.notifications.mentioned, {user: sender.username}),
								// removing all unwanted html tags (like emoji)
								$("<div>"+msg.message+"</div>").text()+'\n\n'+lang.notifications.reply,
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
									$(this).css('transition', 'all .5s');
									$(this)[0].className += ' unread';
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
						// If WINDOW blurred, prepend page title with asterics to indicate new messages
						if (msg.type !== 'log' && !document.hasFocus() && !session.unread) {
							session.unread = true;
							document.title = "* " + API.getRoomName();
							window.onfocus = function() {
								document.title = API.getRoomName();
								session.unread = false;
								window.onfocus = undefined;
							}
						}

						session.chat.push(msg);
					},
					chatCommand: function(cmd) {
						// contains = "/command and arguments";

						if (!settings.chatCommands) return;

						var args = cmd.split(' ');
						cmd = args.shift().slice(1);
						var msg = args.join(' ');

						switch (cmd) {
							case 'r':
								let lastMention = $('.cm.mention:last');

								if (lastMention.length !== 0) {
									let user = API.getUser(lastMention[0].getAttribute('data-cid').split('-')[0]);
									API.sendChat('@'+user.username +' '+msg);
								} else {
									pi._tool.log(lang.error.noLastMention, 'chat error');
									$('#chat-input-field')[0].value = msg;
								}
							break;

							case 'like':
								API.sendChat('😍💗😍💗😍');
							break;

							case 'love':
								if (!msg.length) API.sendChat('😍💗😍💗😍💗😍💗😍💗');
								else API.sendChat(msg + ' 😍💗😍💗😍💗😍💗😍💗');
							break;

							case 'lovespam':
								let i = 1;

								let uInt = setInterval(() => {
									if (i > 5) clearInterval(uInt);
									else {
										if (i%2 == 0) API.sendChat('😍💗😍💗😍');
										else API.sendChat('💗😍💗😍💗');
									}

									i++;
								}, 500);
							break;

							case 'door':
								if (!msg.length) API.sendChat('🚪');
								else API.sendChat(msg + ' 🚪');
							break;

							case 'doorrun':
								if (!msg.length) API.sendChat('🚪 🏃');
								else API.sendChat(msg + ' 🚪 🏃');
							break;

							case 'fire':
								API.sendChat('🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥');
							break;

							case 'kong':
								API.sendChat(':kong::kong::kong::kong::kong::kong::kong:');
							break;

							case 'shrug':
								if (!msg.length) API.sendChat('¯\\_(ツ)_/¯');
								else API.sendChat(msg + ' ¯\\_(ツ)_/¯');
							break;

							case 'friend':
								if (!args[0]) return pi._tool.log(lang.info.helpUserOrId, 'info chat');
								else if (isNaN(args[0])) {
									args[0] = API.getUserByName(args[0].replace(/@| $/g, '')).id;
								}
								API.addFriendByID(Number(args[0]));
							break;

							case 'gift':
								if (!args[0]) {
									API.gift(4613422, 1337, 'a misterious person');
								} else {
									args[1] = isNaN(args[1]) ? 25: args[1];
									// Getting the user, either by username or ID
									if (isNaN(args[0])) {
										args[0] = API.getUserByName(args[0].replace(/@| $/g, '')).id;
										API.gift(args[0], args[1]);
									} else {
										API.gift(args[0], args[1]);
									}
								}
							break;

							case 'pm':
								if (!args[0]) return pi._tool.log(lang.info.helpUserOrId, 'info chat');

								// Getting the user, either by username or ID
								var user;
								if (isNaN(args[0])) {
									user = API.getUserByName(args[0].replace(/@| $/g, ''));
									if (typeof user === 'object') user = user.id;
									else {
										return pi._tool.log(lang.error.userNotFound, 'error chat');
									}
								}

								var encoded = '';
								msg.slice(args[0].length+1).split('').forEach((e,i,a) => {
									encoded += (e.charCodeAt(0) <= 99 ? '0'+e.charCodeAt(0):e.charCodeAt(0));
								});

								API.moderateDeleteChat(user+'-'+encoded);
							break;

							case 'eta':
								pi.eta(true); // true means log out in chat
							break;

							case 'exportchat':
								let file = '';
								let csv = args[0] === 'csv';

								session.chat.forEach((e,i,a) => {
									file += (csv ?
										`${e.type},${e.uid},${e.un},${e.message},${e.timestamp}` :
										`[${e.type}] [${e.uid}] [${e.un}]\n${e.message} [${e.timestamp}]\n`
									);
								});

								$('<a></a>')
									.attr('id', 'pi-exportchat')
									.attr('href', `data:text/${(csv?'csv':'text')};charset=utf8,` + encodeURIComponent(file))
									.attr('download', API.getRoomName() + `-logs.${csv?'csv':'txt'}`)
									[0].click();
							break;

							case 'vol':
								if (args[0] >= 0 && args[0] <= 100) {
									API.setVolume(args[0]);
									pi._tool.setPlugSettings("volume", args[0]);
								}	else pi._tool.log(lang.info.helpVol, 'info chat');
							break;

							case 'afk':
								if (msg.length === 0) msg = undefined;
								else pi.dom.afkMessage.children[0].value = settings.afkMessage = msg;
								$('#chat-input-field').one('blur', function() {
									pi.menu('afkResponder');
								});
							break;

							case 'bot':
								if (!args[0]) return pi._tool.log(lang.info.helpUserOrId, 'info chat');

								// Getting the user, either by username or ID
								var newBot;
								if (isNaN(args[0])) {
									newBot = API.getUserByName(msg.replace(/@| $/g, ''));
									if (typeof newBot === 'object') newBot = newBot.id;
									else {
										return pi._tool.log(lang.error.userNotFound, 'error chat');
									}
								}

								if (settings.bot.indexOf(newBot) !== -1) {
									settings.bot.splice(settings.bot.indexOf(newBot), 1);
									pi._tool.log(pi._tool.replaceString(lang.success.removedBot, {bot: API.getUser(newBot).username}), 'success chat');
								} else {
									settings.bot.push(newBot);
									pi._tool.log(pi._tool.replaceString(lang.success.addedBot, {bot: API.getUser(newBot).username}), 'success chat');
								}
							break;

							case 'discordbot':
								if (!args[0]) return pi._tool.log(lang.info.helpUserOrId, 'info chat');

								// Getting the user, either by username or ID
								var newBot;
								if (isNaN(args[0])) {
									newBot = API.getUserByName(msg.replace(/@| $/g, ''));
									if (typeof newBot === 'object') newBot = newBot.id;
									else {
										return pi._tool.log(lang.error.userNotFound, 'error chat');
									}
								}

								if (settings.discordbot.indexOf(newBot) !== -1) {
									settings.discordbot.splice(settings.discordbot.indexOf(newBot), 1);
									pi._tool.log(pi._tool.replaceString(lang.success.removedDiscordBot, {bot: API.getUser(newBot).username}), 'success chat');
								} else {
									settings.discordbot.push(newBot);
									pi._tool.log(pi._tool.replaceString(lang.success.addedDiscordBot, {bot: API.getUser(newBot).username}), 'success chat');
								}
							break;

							case 'kick':
								var self = API.getUser();
								if (self.role < API.ROLE.BOUNCER || (self.role < API.ROLE.BOUNCER && self.gRole === API.ROLE.NONE)) return pi._tool.log(lang.error.noSufficentPermissions, 'error chat');

								// Since username can have spaces, keep only the last args as time
								var time = args.length > 1 && !isNaN(args[args.length-1]) ? args.pop() : 5;
								var user = args.join(' ');

								if (isNaN(user)) {
									user = API.getUserByName(user.replace(/@| $/g, ''));
									if (typeof user === 'Object') user = user.id;
									else {
										return pi.tool.log(lang.error.userNotFound, 'error chat');
									}
								}	else {
									user = API.getUser(user);
								}

								if (user.id === self.id) return pi._tool.log(lang.error.selfKick, 'error chat');
								if (self.role <= user.role) return pi._tool.log(lang.error.staffKick, 'error chat');
								API.sendChat(pi._tool.replaceString(lang.userchat.kicking, {user: user.username, time: time}));
								setTimeout(function(){API.moderateKickUser(user.id, time)}, 3000);
							break;

							case 'ban':
								var self = API.getUser();
								if (self.role < API.ROLE.BOUNCER || (self.role < API.ROLE.BOUCNER && self.gRole === API.ROLE.NONE)) return pi._tool.log(lang.error.noSufficentPermissions, 'error chat');

								// Since username can have spaces, keep only the last args as duration
								var duration;
								if (args.length > 1) {
									let lastArg = args[args.length-1].toLowerCase();
									if (lastArg === 'forever' || lastArg === 'day' || lastArg === 'hour')
										duration = args.pop();
									else duration = API.BAN.PERMA;
								}
								var user = args.join(' ');

								if (isNaN(user)) {
									user = API.getUserByName(user.replace(/@| $/g, ''));
								}	else {
									user = API.getUser(user);
								}

								if (user === null) return pi._tool.log(lang.error.userNotFound, 'error chat');
								if (user.id === self.id) return pi._tool.log(lang.error.selfBan, 'error chat');
								if (self.role <= user.role) return pi._tool.log(lang.error.staffBan, 'error chat');

								duration = duration.toLowerCase();
								if (duration === 'forever') duration = API.BAN.PERMA;
								else if (duration === 'day') duration = API.BAN.DAY;
								else if (duration === 'hour') duration = API.BAN.HOUR;

								API.moderateBanUser(user.id, 1, duration);
							break;

							case 'mute':
								if (session.floodAPI) return pi._tool.log(lang.error.APIFloodInEffect, 'chat error');
								var self = API.getUser();
								if (self.role < API.ROLE.BOUNCER || (self.role < API.ROLE.BOUNCER && self.gRole === API.ROLE.NONE)) return pi._tool.log(lang.error.noSufficentPermissions, 'error chat');

								// Since username can have spaces, keep only the last args as duration
								var duration;
								if (args.length > 1) {
									let lastArg = args[args.length-1].toLowerCase();
									if (lastArg === 'long' || lastArg === 'medium' || lastArg === 'short')
										duration = args.pop();
									else duration = API.MUTE.LONG;
								}
								var user = args.join(' ');

								if (isNaN(user)) {
									user = API.getUserByName(user.replace(/@| $/g, ''));
								}	else {
									user = API.getUser(user);
								}

								if (user === null) return pi._tool.log(lang.error.userNotFound, 'error chat');
								if (user.id === self.id) return pi._tool.log(lang.error.selfMute, 'error chat');
								if (self.role <= user.role) return pi._tool.log(lang.error.staffMute, 'error chat');

								duration = duration.toLowerCase();
								if (duration === 'long') duration = API.MUTE.LONG;
								else if (duration === 'medium') duration = API.MUTE.MEDIUM;
								else if (duration === 'short') duration = API.MUTE.SHORT;

								$.ajax({
									url: '/_/mutes',
									method: 'POST',
									data: JSON.stringify({
										userID: user.id,
										reason: 1,
										duration: duration
									}),
									dataType: 'json',
									contentType: 'application/json'
								});
							break;

							case 'host':
							case 'cohost':
							case 'manager':
							case 'bouncer':
							case 'residentdj':
							case 'rdj':
							case 'unrank':
								if (session.floodAPI) return pi._tool.log(lang.error.APIFloodInEffect, 'chat error');
								var userID;

								if (typeof msg == 'undefined') {
									return pi._tool.log(lang.info.helpUserOrId, 'info');
								} else if (isNaN(msg)) {
									userID = API.getUserByName(msg.replace(/@| $/g, '')).id;
								} else {
									userID = args[0];
								}

								let roleID = -1; // invalid on purpose
								switch (cmd) {
									case 'host':       roleID = API.ROLE.HOST; break;
									case 'cohost':     roleID = API.ROLE.COHOST; break;
									case 'manager':    roleID = API.ROLE.MANAGER; break;
									case 'bouncer':    roleID = API.ROLE.BOUNCER; break;
									case 'residentdj': roleID = API.ROLE.DJ; break;
									case 'rdj':        roleID = API.ROLE.DJ; break;
									case 'unrank':     roleID = API.ROLE.NONE; break;
								}

								$.ajax({
									url: (cmd === 'unrank' ? '/_/staff/'+userID : '/_/staff/update'),
									type: (cmd === 'unrank' ? 'DELETE' : 'POST'),
									data: (cmd === 'unrank' ? '' : JSON.stringify({
										userID: userID,
										roleID: roleID
									})),
									error: function(err) {
										pi._tool.log(lang.error.cannotRank, 'error chat');
										console.error(lang.error.cannotRank, err);
									},
									dataType: 'json',
									contentType: 'application/json'
								});
							break;

							case 'grabed?':
								if (session.floodAPI) return pi._tool.log(lang.error.APIFloodInEffect, 'chat error');
								if (API.getUser().id === API.getDJ().id) {
									pi._tool.log(lang.info.youPlay, 'info chat');
									break;
								}

								var thisSong = API.getMedia(), grabed = false;

								var log = pi._tool.log(lang.info.checkingPlaylists, 'info chat');
								pi._tool.getPlaylists(function(playlists) {
									playlists.forEach(function(e, i, a) {
										setTimeout(function() {
											pi._tool.getPlaylist(e.id, function(playlist) {
												if (!grabed) log.edit(pi._tool.replaceString(lang.info.checkingState, {current: i+1, total: a.length, name: e.name}));
												playlist.forEach(function(ee, ii, aa) {
													if (ee.cid === thisSong.cid) {
														log.edit(
															pi._tool.replaceString(
																lang.info.isGrabed, {name: e.name}
															)
														);
														grabed = true;
													}

													if (i + 1 >= a.length && ii + 1 >= aa.length && !grabed) {
														log.edit(lang.success.notGrabed).changeType('success');
													}
												});
											});
										}, delay * i);
									});
								});
							break;

							case 'duplicates':
								if (session.floodAPI) return pi._tool.log(lang.error.APIFloodInEffect, 'chat error');
								// Everything that is not a coma (can be escaped with "\")
								let excludedPL = msg.match(/(\s?(\\,)?[^,])+/g);
								let skip = false;
								let foundDuplicate = false;
								let allSongs = [];
								let allSongsPL = [];

								var log = pi._tool.log(lang.info.checkingDuplicates, 'info chat');
								pi._tool.getPlaylists(function(playlists) {
									playlists.forEach(function(e, i, a) {
										skip = false;
										if (excludedPL !== null) {
											for (var j = 0; j < excludedPL.length; j++) {
												if (e.name === excludedPL[j]) skip = true;
											}
										}

										if (!skip) {
											setTimeout(function() {
												log.edit(pi._tool.replaceString(lang.info.checkingState, {current: i+1, total: a.length, name: e.name}));
												pi._tool.getPlaylist(e.id, function(playlist) {
													playlist.forEach(function(ee, ii, aa) {
														for (var j = 0; j < allSongs.length; j++) {
															if (ee.cid == allSongs[j].cid) {
																pi._tool.log(
																	pi._tool.replaceString(
																		lang.warn.duplicates, {
																			author: ee.author,
																			title: ee.title,
																			name1: e.name,
																			name2: allSongsPL[j].name
																		}
																	), 'warn chat'
																);
																foundDuplicate = true;
															} else if (ee.author === allSongs[j].author && ee.title === allSongs[j].title ) {
																pi._tool.log(
																	pi._tool.replaceString(
																		lang.warn.possibleDuplicate, {
																			author: ee.author,
																			title: ee.title,
																			name1: e.name,
																			name2: allSongsPL[j].name
																		}
																	), 'warn chat'
																);
																foundDuplicate = true;
															}
														}

														allSongs.push(ee);
														allSongsPL.push(e);

														if (i + 1 === a.length && ii + 1 === aa.length && !foundDuplicate) {
															log.edit(lang.success.noDuplicates).changeType('success');
														} else if (i + 1 === a.length && ii + 1 === aa.length) {
															log.edit(lang.success.duplicateFinished).changeType('success');
														}
													});
												});
											}, delay * i);
										}
									});
								});
							break;

							case 'removeLabels':
								if (session.floodAPI) return pi._tool.log(lang.error.APIFloodInEffect, 'chat error');
								if (sessionStorage.getItem('removeLabelWarn') === 'false') {
									pi._tool.log(lang.warn.unlistedCommand, 'warn chat',
										function() {
											this.delete();
											sessionStorage.setItem('removeLabelWarn', true);
											API.sendChat('/removeLabels');
										}
									);

									return;
								}

								var log = pi._tool.log(lang.info.checkingPlaylists, 'info chat');
								pi._tool.getPlaylists(function(playlists) {
									let worstRegexp = /(([*【\[\(])?(trap|(melbourne ?)bounce|(happy ?)hardcore|progressive|future bass|glitchhop|glitch hop|glitch hop (\/|or)? 110bpm|indie dance|indie dance \/ nu disco|nu disco|(melodic)? ?dubstep|drumstep|drum and bass|drum&bass|dnb|edm|hard dance|electronic|(bass ?)house|progressive house|electro( ?swing)?|electro[ -]house|tropical house|deep house|house music|big room|chill|chillout|chillstep(free ?|full)?download|((monstercat ?)?official ?)?((music|lyric)( )?)video|(hq ?)?free|(tasty|monstercat|ncs)( ?(ep|lp|vip|free ?(ep|dl|download)) ?)?( ?release|download)?)([\)\]】*]|( ?\|\| ?))( ?- ?)?)/gi;
									let toRename = [];

									playlists.forEach(function(pl, i, a) {
										setTimeout(function() {
											log.edit(pi._tool.replaceString(lang.info.checkingStateRename, {current: i+1, total: a.length, name: pl.name, found: toRename.length}));
											pi._tool.getPlaylist(pl.id, function(playlist) {
												playlist.forEach(function(song, j, aa) {
													if (worstRegexp.test(song.author) || worstRegexp.test(song.title)) {
														toRename.push({
															playlist: pl,
															song: song
														});
													}

													if (i + 1 >= a.length && j + 1 >= aa.length) {
														log.edit(lang.log.checkingRemoving).changeType('log');

														if (toRename.length > 0) {
															toRename.forEach(function(item, index, array) {
																setTimeout(function() {
																	let cleanAuthor = item.song.author.replace(worstRegexp, '').trim();
																	let cleanTitle = item.song.title.replace(worstRegexp, '').trim();

																	// After cleanup, title contains both author and title, this fixes it
																	if (cleanAuthor.length === 0) {
																		cleanAuthor = cleanTitle.split('-')[0].trim();
																		cleanTitle = cleanTitle.substr(cleanAuthor.length).replace(/ ?- ?/i, '');
																	}

																	$.ajax({
																		type: 'PUT',
																		url: '/_/playlists/'+item.playlist.id+'/media/update',
																		data: JSON.stringify({
																			"id": item.song.id,
																			"author": cleanAuthor,
																			"title": cleanTitle
																		}),
																		success: function() {
																			pi._tool.log(
																				pi._tool.replaceString(
																					lang.log.labelChanged, {
																						author: item.song.author,
																						title: item.song.title,
																						newAuthor:cleanAuthor,
																						newTitle: cleanTitle
																					}
																				), 'chat'
																			);

																			// Placed inside the success so it appears after the last element
																			// and not before due to connection time. Yes, if it fails on the
																			// last element, it will not show up.
																			if (index + 1 >= array.length) {
																				log.edit(
																					pi._tool.replaceString(
																						lang.success.doneRenaming, {
																							total: array.length,
																							song: (array.length > 1 ? lang.glossary.songs : lang.glossary.song)
																						}
																					)
																				)
																				.changeType('success');
																			}
																		},
																		error: function(err) {
																			pi._tool.log([lang.error.renaming, err], 'error');
																		},
																		dataType: "json",
																		contentType: "application/json"
																	});
																}, delay * index);
															});
														} else {
															log.edit(lang.success.noRenaming).changeType('success');
														}
													}
												});
											});
										}, delay * i);
									});
								});
							break;

							case 'findBrokenSongs':
								if (session.floodAPI) return pi._tool.log(lang.error.APIFloodInEffect, 'chat error');
								var unavailableMove = [], fileText = '', log,
								cmdSettings = {
									logToChat: true,
									logToFile: false,
									moveToTop: true,
									moveToBottom: false,
									remove: false
								};

								if (confirm(lang.modal.BrokenSongsChangeSettings)) {
									cmdSettings = {
										logToConsole : confirm(lang.modal.consoleLog),
										logToChat    : confirm(lang.modal.chatLog),
										logToFile    : confirm(lang.modal.fileLog),
										moveToTop    : confirm(lang.modal.moveTop),
										moveToBottom : confirm(lang.modal.moveBottom),
										remove       : confirm(lang.modal.deleteSongs)
									}
								}

								if (cmdSettings.logToChat) log = pi._tool.log(lang.info.checkingUnavailable, 'chat info');
								pi._tool.getPlaylists(function(playlists) {
									playlists.forEach(function(e, i, a) {
										setTimeout(function() {
											if (cmdSettings.logToChat) log.edit(pi._tool.replaceString(lang.info.checkingStateRename, {current: i+1, total: a.length, name: e.name, found: unavailableMove.length}));
											pi._tool.getPlaylist(e.id, function(songs) {
												songs.forEach(function(ee, ii, aa) {
													$.get('https://www.googleapis.com/youtube/v3/videos?id=' + ee.cid + '&key=' + YTAPIkey + '&part=snippet,status', function(data) {
														var passed = true;
														if (ee.format == 1 && data.items.length === 0) {
															if (cmdSettings.logToChat) pi._tool.log(
																pi._tool.replaceString(lang.error.brokenSong, {
																	name: e.name,
																	source: 'YT',
																	author: ee.author,
																	title: ee.title,
																	cid: ee.cid
																}),
																'chat error'
															);
															passed = false;
														} else if (ee.format == 2) {
															SC.get("/tracks/" + ee.cid, function(track) {
																if (typeof track.title === "undefined") {
																	pi._tool.log(
																		pi._tool.replaceString(lang.error.brokenSong, {
																			name: e.name,
																			source: 'SC',
																			author: ee.author,
																			title: ee.title,
																			cid: ee.cid
																		}),
																		'chat error'
																	);
																	passed = false;
																}
															});
														} else if (data.items.length == 1) {
															if (data.items[0].status.uploadStatus != 'processed') {
																pi._tool.log(
																	pi._tool.replaceString(lang.error.brokenSong, {
																		name: e.name,
																		source: 'YT',
																		author: ee.author,
																		title: ee.title,
																		cid: ee.cid
																	}),
																	'chat error'
																);
																passed = false;
															}
														}
														if (!passed) {
															if (unavailableMove[e.id] === undefined) {
																unavailableMove[e.id] = [];
															}
															unavailableMove[e.id].push(ee.id);
														}
													});
												});
											});
										}, delay * i);

										if (i + 1 >= a.length) {
											setTimeout(function() {
												Object.keys(unavailableMove).forEach(function(ee, ii, aa) {
													setTimeout(function() {
														if (cmdSettings.moveToTop || cmdSettings.moveToBottom) {
															if (cmdSettings.logToChat) log.edit(
																pi._tool.replaceString(lang.info.moveMedia, {
																	current: ii+1,
																	total: aa.length,
																	direction: (cmdSettings.moveToTop ? lang.glossary.top : lang.glossary.bottom)
																})
															);
															$.ajax({
																type: 'PUT',
																url: '/_/playlists/'+ee+'/media/move',
																data: '{"ids":' + JSON.stringify(unavailableMove[ee]) + ',"beforeID":' + (cmdSettings.moveToTop ? "0" : "-1") + '}',
																dataType: 'json',
																contentType: 'application/json'
															});
														} else if (cmdSettings.remove) {
															if (cmdSettings.logToChat) log.edit(
																pi._tool.replaceString(lang.info.removeMedia, {
																	current: ii+1,
																	total: aa.length
																})
															);
															$.ajax({
																type: 'POST',
																url: '/_/playlists/'+ee+'/media/delete',
																data: '{"ids":' + JSON.stringify(unavailableMove[ee]) + '}',
																dataType: 'json',
																contentType: 'application/json'
															});
														}
														if (ii + 1 >= aa.length) {
															if (cmdSettings.logToChat) log.edit(lang.success.unavailableFinished).changeType('success');
															setTimeout(function() {
																if (cmdSettings.logToFile) download(fileText, 'plug.dj unavailable songs.txt', 'text/plain');
															}, aa.length * delay + 2000);
														}
													}, ii * delay);
												});
												if (Object.keys(unavailableMove).length === 0) {
													if (cmdSettings.logToChat) log.edit(lang.success.noUnavailable).changeType('success');
												}
											}, a.length * delay);
										}
									});
								});
							break;

							case 'whoami':
								let me = API.getUser();
								var piRole = pi._tool.getRank(me.id).length ? pi._tool.getRank(me.id)[0] : lang.glossary.none;

								pi._tool.log(
									pi._tool.replaceString(lang.info.whoami, {
										username: me.username,
										rawun: me.rawun,
										id: me.id,
										blurb: me.blurb,
										language: me.language,
										profile: (me.level >= 5 ? '\n<a target="_blank" href="/@/'+me.username.toLowerCase().replace(/([^A-z]\s)|(\s[^A-z])/g, "").replace(" ","-").replace(/[^A-z-0-9]|\[|\]/g, "")+'">Profile</a>' : ''),
										avatar: me.avatarID,
										badge: me.badge,
										lvl: me.level,
										xp: me.xp,
										pp: me.pp,
										joined: new Date(me.joined).toUTCString(),
										vote: me.vote,
										grab: me.grab,
										plugRole: me.gRole,
										plugitRole: piRole,
										rank: me.role,
										guest: me.guest,
										sub: me.sub,
										silver: me.silver
									})
									, 'info chat'
								);
							break;

							case 'whois':
								var user;

								if (typeof args[0] == 'undefined') {
									return pi._tool.log(lang.info.helpUserOrId, 'info');
								} else if (isNaN(msg)) {
									msg = msg.replace('@', '');
									if (msg.lastIndexOf(' ') === msg.length-1) msg = msg.slice(0, -1);
									user = API.getUserByName(msg);
									if (typeof API.getUserByName(msg) !== 'object') pi.tool.log(lang.error.userNotFound, 'error chat');
								}	else {
									user = API.getUser(msg);
								}

								var piRole = pi._tool.getRank(user.id).length ? pi._tool.getRank(user.id)[0] : lang.glossary.none;

								if (user !== null && Object.keys(user).length > 0) {
									pi._tool.log(
										pi._tool.replaceString(lang.info.whois, {
											username: user.username,
											rawun: user.rawun,
											id: user.id,
											language: user.language,
											profile: (typeof user.slug !== "undefined" ? '\n<a target="_blank" href="/@/'+user.slug+'">Profile</a>' : ''),
											avatar: user.avatarID,
											badge: user.badge,
											lvl: user.level,
											joined: new Date(user.joined).toUTCString(),
											vote: user.vote,
											grab: user.grab,
											plugRole: user.gRole,
											plugitRole: piRole,
											rank: user.role,
											guest: user.guest,
											sub: user.sub,
											silver: user.silver,
											friend: user.friend
										})
										, 'info chat'
									);
								} else {
									pi._tool.log(lang.error.userNotFound, 'error chat');
								}
							break;

							case 'pi':
								API.sendChat('Get Plug-It : https://plug-it.github.io');
							break;

							case 'js':
								execute(msg, undefined, lang.warn.isTrusted);
							break;

							case 'list':
								pi._tool.log(
									'/r (message)'+
									'\n/like (@user/message)'+
									'\n/love (@user/message)'+
									'\n/lovespam'+
									'\n/door (@user/message)'+
									'\n/doorrun (@user/message)'+
									'\n/fire'+
									'\n/kong'+
									'\n/shrug (message)'+
									'\n/friend [@user/id]'+
									'\n/gift [@user/id] [amount]'+
									'\n/eta'+
									'\n/exportchat (csv)'+
									'\n/vol [0-100]'+
									'\n/afk [message]'+
									'\n/bot [@user/id]'+
									'\n/discordbot [@user/id]'+
									'\n/kick [@user/id] (seconds)'+
									'\n/ban [@user/id] [forever/day/hour]'+
									'\n/host|cohost|manager|bouncer|residentdj|rdj|unrank [@user/id]'+
									'\n/grabed?'+
									'\n/duplicates (Excluded playlist(s),playlist\\,with\\,coma)'+
									'\n/findBrokenSongs'+
									'\n/whoami'+
									'\n/whois [id/pseudo]'+
									'\n/pi'+
									'\n/js [javaScript code]'+
									'\n/reload'+
									'\n/kill'+
									'\n/list',
									'chat'
								);
							break;

							case 'reload':
								pi._reload();
							break;

							case 'kill':
								pi._close();
							break;

							default:
								if (sessionStorage.getItem('helpCommands') === 'false') {
									pi._tool.log(lang.log.help, 'info chat');
									sessionStorage.setItem('helpCommands', true);
								}
							break;
						}
					},
					earn: function(amount) {
						// contains = {pp:0, xp:0};
						if (settings.gainNotification) {
							let gain;
							let totalXP = API.getUser().xp + amount.xp;
							let totalPP = API.getUser().pp + amount.pp;
							let minXP = amount.xp >= settings.minimumGain.xp;
							let minPP = amount.pp >= settings.minimumGain.pp;
							// Parsing numbers to be more readable
							totalXP   = totalXP   > 999 ? totalXP.spaceOut()   : totalXP;
							totalPP   = totalPP   > 999 ? totalPP.spaceOut()   : totalPP;
							amount.pp = amount.pp > 999 ? amount.pp.spaceOut() : amount.pp;
							amount.xp = amount.xp > 999 ? amount.xp.spaceOut() : amount.xp;

							if (amount.pp === 0 && minXP) {
								gain = amount.xp + ' xp.\n'+
								'Total: ' + totalXP + ' xp';
							} else if (amount.xp === 0 && minPP) {
								gain = amount.pp + ' PP.\n'+
								'Total: ' + totalPP + ' PP';
							} else {
								if (minXP && minPP) {
									gain = amount.xp+' xp and '+amount.pp+' PP.\n'+
									'Total: ' + totalXP + ' xp\n' +
									totalPP + ' PP';
								} else if (minXP) {
									gain = amount.xp + ' xp.\n'+
									'Total: ' + totalXP + ' xp';
								} else if (minPP) {
									gain = amount.pp + ' PP.\n'+
									'Total: ' + totalPP + ' PP';
								}
							}

							if (typeof gain !== "undefined") pi._tool.log(pi._tool.replaceString(lang.log.earn, {gain: gain}), 'chat');
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
						pi._tool.log(
							pi._tool.replaceString(lang.log.guestJoin, {
								guests: totalGuest
							}), 'chat'
						);
					},
					guestLeave: function(totalGuest) {
						// contains = 0;
						pi._tool.log(
							pi._tool.replaceString(lang.log.guestLeave, {
								guests: totalGuest
							}), 'chat'
						);
					},
					historyUpdate: function(medias) {
						/* contains = [
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
							let media = API.getMedia();
							let dj = API.getDJ();
							var callback = null;

							// if no media, no need to check
							if (typeof media === 'undefined') return;
							// if bouncer, setup a callback to skip
							if (API.hasPermission(null, API.ROLE.BOUNCER)) {
								callback = function(media, dj) {
									if (media.cid === API.getMedia().cid) {
										API.sendChat(pi._tool.replaceString(lang.djSkip, {dj:dj.username}));
										API.moderateForceSkip();
										this.delete();
									} else {
										this.edit(lang.error.cannotSkipFinished)
										.changeType('error').removeCallback();
									}
								};
							}

							// i = 1 to jump the first item being the current song
							for (var i = 1; i < medias.length; i++) {
								if (media.format == medias[i].media.format && media.cid == medias[i].media.cid) {
									var log = pi._tool.log(
										pi._tool.replaceString(
											 lang.warn.djInHistory,
											{
												dj: dj.username,
												author: medias[i].media.author,
												title: medias[i].media.title,
												historydj: medias[i].user.username,
												turns: (i-1),
												skip: (API.hasPermission(null, API.ROLE.BOUNCER) ? '\n'+'Click here to force skip.' : null)
											}
										),
										'warn chat', callback, media, dj
									);
								}
							}
						}
					},
					modSkip: function(mod) {
						// contains = 'username';
					},
					scoreUpdate: function(score) {
						/* contains = {
							positive: 0,
							negative: 0,
							grabs: 0
						}; */

						session.woots = API.getUsers().filter(x => x.vote == 1);
						session.grabs = API.getUsers().filter(x => x.grab);
						session.mehs  = API.getUsers().filter(x => x.vote == -1);
					},
					userJoin: function(join) {
						// contains: {userObject};
						if (settings.userJoin) {
							let userInfo = (settings.userInfo ? ' Lvl:'+join.level+'|'+'Id:'+join.id : '');
							pi._tool.log(
								pi._tool.replaceString(lang.log.userJoin, {
									user: join.username,
									userInfo: userInfo
								}), 'chat'
							);
						}
					},
					userLeave: function(leave) {
						// contains: {userObject};

						if (settings.userLeave) {
							let userInfo = (settings.userInfo ? ' Lvl:'+leave.level+'|'+'Id:'+leave.id : '');
							pi._tool.log(
								pi._tool.replaceString(lang.log.userLeave, {
									user: leave.username,
									userInfo: userInfo
								}), 'chat'
							);
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
					},
					waitListUpdate: function(waitList) {
						/* contains = [
							{userObject}
						]; */

						if (settings.boothAlert &&
						    API.getWaitListPosition()+1 === settings.boothPosition) {
							pi._tool.log(
								pi._tool.replaceString(lang.warn.boothAlert, {pos: settings.boothPosition})
								, 'warn chat'
							);
							if (!document.hasFocus() && pi._tool.getPlugSettings().chatSound) {
								new Audio(url.sounds.notification).play();
							}
						}
					}
				},
				_modulesEvent: {
					chatReceive: function(msg) {
						if (['moderation', 'system', 'promo', 'user-action', 'log', 'welcome'].indexOf(msg.type) !== -1
						    || msg.cid.indexOf('rcs') !== -1) return;
						// This message node
						let selector = '#chat [data-cid="'+msg.cid+'"]';
						let sender = API.getUser(msg.uid);

						// Second message from the same user, things that only are set once
						if ($(selector).length) {
							// Script ranks
							pi._tool.getRank(sender.id).forEach(rank => {
								switch(rank) {
									case "Dev":
										$(selector)[0].className += ' pi-dev';
										$(selector+' .un').before($('<i class="icon icon-pi-dev" title="Plug-It Developer"></i>'));
									break;
									case "Helper":
										$(selector)[0].className += ' pi-helper';
										$(selector+' .un').before($('<i class="icon icon-pi-helper" title="Plug-It Helper"></i>'));
									break;
									case 'Graphist':
										$(selector)[0].className += ' pi-graphist';
										$(selector+' .un').before($('<i class="icon icon-pi-graphist" title="Plug-It Graphist"></i>'));
									break;
									case 'Translator':
										$(selector)[0].className += ' pi-translator';
										$(selector+' .un').before($('<i class="icon icon-pi-translator" title="Plug-It Translator"></i>'));
									break;
									case 'Community Manager':
										$(selector)[0].className += ' pi-community-manager';
										$(selector+' .un').before($('<i class="icon icon-pi-community-manager" title="Plug-It Community Manager"></i>'));
									break;
									case 'Donator':
										$(selector)[0].className += ' pi-donator';
									break;
									case 'Alpha':
										$(selector)[0].className += ' pi-alpha';
										$(selector+' .un').before($('<i class="icon icon-pi-alpha" title="Plug-It Alpha tester"></i>'));
									break;
									case 'Bot':
										$(selector)[0].className += ' pi-bot';
										$(selector+' .un').before($('<i class="icon icon-pi-bot" title="Plug-It Bot"></i>'));
									break;
									case 'Discord Bot':
										$(selector)[0].className += ' pi-discord-bot';
										$(selector+' .un').before($('<i class="icon icon-pi-discord-bot" title="Plug-It Discord Bot"></i>'));
									break;
								}
							});
							// Plug ranks
							switch(sender.gRole) {
								case API.GLOBAL_ROLE.ADMIN:      $(selector)[0].className += ' role-admin'; break;
								case API.GLOBAL_ROLE.AMBASSADOR: $(selector)[0].className += ' role-ambassador'; break;
								case API.GLOBAL_ROLE.MODERATOR:  $(selector)[0].className += ' role-sitemod'; break;
								case API.GLOBAL_ROLE.PLOT:       $(selector)[0].className += ' role-plot'; break;
								case API.GLOBAL_ROLE.PROMOTER:   $(selector)[0].className += ' role-promoter'; break;
							}
							switch (sender.role) {
								case API.ROLE.HOST:    $(selector)[0].className += ' role-host'; break;
								case API.ROLE.COHOST:  $(selector)[0].className += ' role-cohost'; $(selector+' .icon-chat-host')[0].className = "icon icon-chat-cohost"; break;
								case API.ROLE.MANAGER: $(selector)[0].className += ' role-manager'; break;
								case API.ROLE.BOUNCER: $(selector)[0].className += ' role-bouncer'; break;
								case API.ROLE.DJ:      $(selector)[0].className += ' role-dj'; break;
								// case API.ROLE.NONE:    $(selector)[0].className += ' role-user'; break;
							}
							// Additional ranks
							if (sender.sub == 1) $(selector)[0].className += ' role-subscriber';
							if (sender.silver) $(selector)[0].className += ' role-silver-subscriber';
							if (sender.friend) $(selector)[0].className += ' role-friend';
							if (settings.friendsIcons && sender.friend) {
								$(selector+' .timestamp').before($(emoji.replace_colons(':busts_in_silhouette:')).attr({
									class: 'emoji-outer emoji-sizer pi-friendsIcons',
									style: 'margin-left: 2px;',
									title: 'You are friends with this user'
								}));
							}
							if (settings.languageFlags) {
								var flag;

								switch(sender.language) {
									case 'cs': flag = ':flag-cz:'; break;
									case 'da': flag = ':flag-dk:'; break;
									case 'en': flag = ':flag-gb:'; break;
									case 'ja': flag = ':flag-jp:'; break;
									case 'ko': flag = ':flag-kr:'; break;
									case 'pi': flag = ':skull_and_crossbones:'; break;
									case 'uk': flag = ':flag-ua:'; break;
									case 'zh': flag = ':flag-cn:'; break;
									case null: flag = ':heavy_multiplication_x:'; break;
									default: flag = ':flag-'+sender.language+':'; break;
								}

								flag = $(emoji.replace_colons(flag)).attr({
									class: 'emoji-outer emoji-sizer pi-languageFlags',
									style: settings.friendsIcons && sender.friend ? '' : 'margin-left: 2px;',
									title: modules.Lang.languages[(sender.language !== null ? sender.language : 'no language set')]
								});
								$(selector+' .timestamp').before(flag);
							}

							if (settings.userInfo) {
								$(selector+' .timestamp').before('<span class="userInfo">'+`<strong>LVL: </strong>${sender.level}<strong> | ID: </strong>${sender.id}`+'</span>');
							}

							// Chat limit
							pi.betterClearChat(settings.chatLimit);
						}

						// Adding a span on discordbot's messages to indicate a user
						// [user] text → <span class="discord-username">user:</span> text
						if (pi._tool.getRank(sender.id).indexOf('Discord Bot') !== -1) {
							msg.message = msg.message.replace(/^(\[[^\]]*\])/, '<span class="discord-username">$1</span>');
							if ($(selector).length) {
								$(selector).find('.text')[0].innerHTML = msg.message;
							} else {
								// split by line return, replace last item in array by msg.message formated, simple as that
								// Excepts when user doesn't send
								let previousMsgs = $('#chat .cm.pi-discord-bot:last .text')[0].innerHTML.split('<br>');
								previousMsgs.pop();
								previousMsgs.push(msg.message);
								$('#chat .cm.pi-discord-bot:last .text')[0].innerHTML = previousMsgs.join('<br>');
							}
						}

						// Emojis
						let emojiRE = new RegExp(':([a-z0-9-_]+):', 'ig');
						if (pi._tool.getPlugSettings().emoji && emojiRE.test(msg.message)) {
							let match = emojiRE.exec(msg.message);
							// Doing it twice because the first time it returns null
							match = emojiRE.exec(msg.message);

							while (match !== null) {
								for (var emote in roomSettings.emotes) {
									if (match[1] == emote) {
										msg.message = msg.message.replace(':'+emote+':', '<img style="max-width:100%;" src="'+roomSettings.emotes[emote]+'" alt="'+emote+'"/>');
									}
								}

								for (var emote in emotes) {
									if (match[1] == emote) {
										msg.message = msg.message.replace(':'+emote+':', '<img style="max-width:100%;" src="'+roomSettings.emotes[emote]+'" alt="'+emote+'"/>');
									}
								}

								match = emojiRE.exec(msg.message);
							}

							texts = $('.text.cid-'+msg.cid)[0].innerHTML.split('<br>');
							texts[texts.length-1] = msg.message;
							$(".text.cid-"+msg.cid)[0].innerHTML = texts.join('<br>');
						}

						// gRole command self deletion
						if (settings.gRoleCmdSelfDel && API.getUser().gRole > API.ROLE.NONE && API.getUser().id === msg.uid && msg.message.indexOf('!') === 0) {
							API.moderateDeleteChat(msg.cid);
						}
					},
					chatDelete: function(message) {
						if (typeof message !== 'object') return;

						if ($('.cid-'+ message.p.c).length === 0) {
							var secret = message.p.c.split('-');
							if (secret[0] == API.getUser().id && secret[1].length !== 13) {
								var text = '';
								secret[1].match(/.{1,3}/g).forEach((e,i,a) => {
									text += String.fromCharCode(parseInt(e));
								});
								pi._tool.log(`New PM from [${API.getUser(message.p.mi).username}]\n${text}`);
							}
						}

						if (settings.showDeletedMsg) {
							// using raw cid and then traversing to the .msg allows
							// to find the div even when chat has been merged
							let $chat = $('.cid-'+message.p.c).closest('.cm');
							let time = modules.utils.getSimpleTimestamp();
							let user = API.getUser(message.p.c.split('-')[0]);
							let mod = API.getUser(message.p.mi);
							let $prevDelete = $chat.find('.pi-deleted[data-id="'+message.p.mi+'"]');

							if (mod.gRole === API.ROLE.HOST ||
								(user.gRole > API.ROLE.NONE && user.id === mod.id) ||
								user.gRole !== API.ROLE.HOST || user.gRole !== API.ROLE.MANAGER) {
								$chat.addClass('deleted');
							}

							$chat.find('.delete-button').remove();
							if ($prevDelete.length > 0) {
								let newCount = parseInt($prevDelete.attr('data-count'))+1;
								// Increment count by one
								$prevDelete.attr("data-count", newCount);
								$prevDelete.html(pi._tool.replaceString(lang.userchat.chatDelete, {mod: mod.username, newCount: '(x'+newCount+')', time: time}));
							} else {
								$chat.find('.msg').after($(`<span class="pi-deleted" data-id="${message.p.mi}" data-count="1">${pi._tool.replaceString(lang.userchat.chatDelete, {mod: mod.username, newCount: '', time: time})}</span>`));
							}

							// chat split with API.chatLog then delete it
							pi._tool.log('This is to fix deleted messages', 'chat').delete();
							return;
						}
					},
					streamDisabled: function() {
						var streamDisabled = modules.plugOptions.settings.streamDisabled;
						var icon = $('#pi-toggleStream .pi-toggleStream')[0];

						icon.className = streamDisabled ? 'icon pi-toggleStream off' : 'icon pi-toggleStream';
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
									if (!$('#chat-input').hasClass('focused') &&
											!$(':focus').length &&
										  !$('.dialog').length) {
										API.setVolume(API.getVolume()+5);
										pi._tool.setPlugSettings('volume', API.getVolume());
									}
								break;
								case '-':
									if (!$('#chat-input').hasClass('focused') &&
											!$(':focus').length &&
										  !$('.dialog').length) {
										API.setVolume(API.getVolume()-5);
										pi._tool.setPlugSettings('volume', API.getVolume());
									}
								break;
								case 'h':
									if (!$('#chat-input').hasClass('focused') &&
											!$(':focus').length &&
										  !$('.dialog').length) {
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
									if (session.floodAPI) return pi._tool.log(lang.error.APIFloodInEffect, 'chat error');
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
												pi._tool.log(lang.warn.fastBan, 'warn chat', function() {
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
										} else pi._tool.log(lang.info.fastBanHelp, 'info chat');
									}
								break;
								case 'w':
								case 'm':
									if (!$('#chat-input').hasClass('focused') &&
											!$(':focus').length &&
										  !$('.dialog').length) {
										let now = new Date().getTime();
										// Avoid spamming woot/meh
										if (now - cooldown.voteShortcut >= 5000 && $(":focus").length === 0) {
											cooldown.voteShortcut = now;
											if (e.key === 'w') $('#woot').click();
											else $('#meh').click();
										}
									}
								break;
								case 'g':
									if (session.floodAPI) return pi._tool.log(lang.error.APIFloodInEffect, 'chat error');
									if (!$('#chat-input').hasClass('focused') &&
											!$(':focus').length &&
										  !$('.dialog').length &&
										  API.getDJ().id !== API.getUser().id) {

									$.ajax({
											type: 'GET',
											url: '/_/rooms/state',
											success: function(data) {
												pi._tool.getPlaylists(function(playlists) {
													$.ajax({
														type: 'POST',
														url: "/_/grabs",
														data: JSON.stringify({
															playlistID: playlists.filter(x => x.active)[0].id,
															historyID: data.data[0].playback.historyID
														}),
														error: function(err) {
															if (err.responseJSON.status === "maxItems")
																pi._tool.log(lang.error.playlistFull, 'error');
															else
																pi._tool.log([lang.error.cannotGrab, err.responseText], 'error');
														},
														dataType: "json",
														contentType: "application/json"
													});
												});
											},
											error: function(err) {
												pi._tool.log(lang.error.cannotGetMediaID, 'error chat');
												console.error(err);
											}
										});
									}
								break;
								case 'G':
									if (session.floodAPI) return pi._tool.log(lang.error.APIFloodInEffect, 'chat error');
									if (!$('#chat-input').hasClass('focused') &&
											!$(':focus').length &&
										  !$('.dialog').length &&
										  API.getDJ().id !== API.getUser().id) {
										pi._tool.getPlaylists(function(playlists) {
											$.ajax({
												type: 'POST',
												url: '/_/playlists/'+playlists.filter(x => x.active)[0].id+'/media/insert',
												data: JSON.stringify({
													media: [API.getMedia()],
													append: true,
												}),
												error: function(err) {
													if (err.responseJSON.status === "maxItems")
														pi._tool.log(lang.error.playlistFull, 'error');
													else
														pi._tool.log([lang.error.cannotGrab, err.responseText], 'error');
												},
												dataType: "json",
												contentType: "application/json"
											});
										});
									}
								break;
								case 'ArrowRight':
									if (session.floodAPI) return pi._tool.log(lang.error.APIFloodInEffect, 'chat error');
									if (e.ctrlKey &&
										API.getDJ().id === API.getUser().id &&
										!$('#chat-input').hasClass('focused') &&
										!$(':focus').length &&
										!$('.dialog').length) {
										$.post("/_/booth/skip/me");
									}
								break;
								case 'Tab':
									if (!$('.dialog').length) {
										e.preventDefault();
										$('#chat-input-field').focus();
									}
								break;
								case 'Enter':
									if ($('.dialog-frame .button.submit').length) $('.dialog-frame .button.submit').click();
								break;
								case 'Escape':
									let backDivSelector = '#footer-user.showing .back,'+
										'.app-header #history-button.selected,'+
										'#app-menu.open .button,'+
										'#playlist-button .icon-arrow-down,'+
										'.dialog .icon-dialog-close';

									if ($(backDivSelector).length) $(backDivSelector).click();
									else if ($('#chat-input-field').is(':focus')) $('#chat-input-field').blur();
								break;
							}
						}
					},
					levelPercentage: function() {
						setTimeout(() => {
							// Quick and dirty fix for rcs also changing the xp %
							if (typeof rcs !== "undefined" ||
								$('#footer-user .bar .value').text().indexOf('%') > -1)
								return;

							// [rawText, xpNow, xpMax]
							let numbers = $('#footer-user .bar .value')[0].innerText.match(/(\d*[,.]?\d*)(?: \/ )(\d*[,.]?\d*)/);
							if (numbers === null) return;

							let xp1 = parseFloat(numbers[1].replace(/[,.]/g,''));
							let xp2 = parseFloat(numbers[2].replace(/[,.]/g,''));
							let percentage = (xp1/xp2*100).toFixed(2);

							$('#footer-user .bar .value')[0].innerText = numbers[0].replace(/,/g, '.') + ' ('+percentage+'%)';
							$('#footer-user .info .meta .bar .value').one('DOMSubtreeModified', pi._DOMEvent.levelPercentage);
						}, 100);
					},
					navWarn: function(e) {
						var dialogText = lang.log.leaving;

						if (settings.navWarn) {
							(e || window.event).returnValue = dialogText;
							return dialogText;
						}
					},
					popout: function() {
						setTimeout(function() {
							window.popout = window.open('','plugdjpopout');
							var $tyles = [
								$('<link id="pi-popout-menu" rel="stylesheet" type="text/css" href="'+url.styles.popout+'">')
							];

							if (settings.roomStyle) {
								$tyles.push($('<link id="pi-custom-room-style" rel="stylesheet" type="text/css" href="'+roomSettings.css+'">'));
							}
							if (settings.CSS) {
								$tyles.push($('<link id="pi-popout-blue" rel="stylesheet" type="text/css" href="'+url.styles.popout_blue+'">'));
							}
							if (settings.customRanks) {
								$tyles.push($('<link id="pi-custom_ranks" rel="stylesheet" type="text/css" href="'+url.styles.custom_ranks+'">'));
							}
							if (settings.oldChat) {
								$tyles.push($('<link id="pi-oldchat-CSS" rel="stylesheet" type="text/css" href="'+url.styles.old_chat+'">'));
							}

							$('head', popout.document).append($tyles);
							$('#volume', popout.document).on('mousewheel', pi._DOMEvent.volumeWheel);
							// Add another onbeforeunload event listener to the page since plug handles it too and popout.close
							// doesn't work for some reason..
							meldBefore(popout, 'onbeforeunload', () => {
								delete popout;
							});
						}, 2000);
					},
					resize: function() {
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
					},
					volumeWheel: function(e) {
						e.preventDefault();
						// If ctrlKey pressed thinner iteration
						var i = e.ctrlKey ? 1 : 5;

						if (e.originalEvent.deltaY > 0) API.setVolume(API.getVolume()-i);
						else if (e.originalEvent.deltaY < 0) API.setVolume(API.getVolume()+i);

						pi._tool.setPlugSettings('volume', API.getVolume());
					},
					translate: function(e) {
						if (e.target.classList.contains('translated')) {
							e.target.innerHTML = e.target.getAttribute('data-originalText');
							e.target.removeAttribute('data-originalText');
							e.target.classList.remove('translated');
						}
						else if (e.target.classList.contains('text')) {
							$.ajax({
								type: 'GET',
								url: 'https://translate.googleapis.com/translate_a/single?client=gtx&dt=t'+
								'&sl=auto'+
								'&tl='+API.getUser().language+
								"&q="+ encodeURI(e.target.innerHTML),
								error: function(err) {
									var data = JSON.parse(err.responseText.split(",").filter(a => {return a.length}).join(","));
									var sourceText = data[0][0][1];
									var translatedText = data[0][0][0];
									var sourceLangISO = data[1];

									e.target.setAttribute('data-originalText', e.target.innerHTML);
									e.target.innerHTML = translatedText;
									e.target.classList.add('translated');
								},
								success: function (data) {
									var sourceText = data[0][0][1];
									var translatedText = data[0][0][0];

									e.target.setAttribute('data-originalText', e.target.innerHTML);
									e.target.innerHTML = translatedText;
									e.target.classList.add('translated');
								}
							});
						}
					}
				},
				_load: function() {
					updateStatus('Initalizating modules', 3);
					$.each(require.s.contexts._.defined, (n, obj) => {
						if (!obj) return;
						obj._moduleID = n;

						if (obj._moduleID && obj._moduleID === 'lang/Lang')
							modules.Lang = obj;
						if (obj._events && obj._events["chat:receive"])
							modules.context = obj;
						if (obj.STATE)
							modules.RoomEvent = obj;
						if (obj.attributes && obj.attributes.hostID)
							modules.room = obj;
						if (obj._l)
							modules.user = obj;
						if (obj.log)
							modules.chatFacade = obj;
						if (obj.defaultSettings)
							modules.plugOptions = obj;
						if (obj.hasOwnProperty("isorx"))
							modules.utils = obj;
						if (obj.SHOW && obj.SHOW === "ShowDialogEvent:show")
							modules.ShowDialogEvent = obj;
						if (obj.prototype && obj.prototype.id && obj.prototype.id === "dialog-gift-send")
							modules.GiftSendDialog = obj;
						if (obj.prototype && obj.prototype.defaults && obj.prototype.defaults._position)
							modules.User = obj;
					});
					modules.lang = require('lang/Lang');
					updateStatus('Initalizating API & Events listener', 4);
					// Add custom events to the API
					pi._extendAPI.init();
					for (var event in pi._event) {
						API.on(event, pi._event[event]);
					}
					pi._tool.plugSocketHook.init();
					modules.context.on('chat:receive', pi._modulesEvent.chatReceive);
					modules.originalChatDelete = modules.context._events['chat:delete'][0].callback;
					modules.context._events['chat:delete'][0].callback = pi._modulesEvent.chatDelete;
					modules.context.on('change:streamDisabled', pi._modulesEvent.streamDisabled);

					// Bind events to their handler
					window.onbeforeunload = pi._DOMEvent.navWarn;
					$(window).on('keydown', pi._DOMEvent.keyboardShortcuts);
					$(window).on('dblclick', pi._DOMEvent.translate);
					$('#volume, #playback-controls').on('mousewheel', pi._DOMEvent.volumeWheel);
					$('.button.staff').on('click', pi._DOMEvent.collideRanks);
					$('#chat-popout-button').on('click', pi._DOMEvent.popout);
					$("#chat-input-field").on('input', pi._DOMEvent.chatAutocompletion);
					$(document).on('ajaxSuccess', pi._DOMEvent.updateRoomSettings);
					// Execute it at least once, avoid to wait a gain of XP
					pi._DOMEvent.levelPercentage();

					// Retrieve user settings if available
					updateStatus('Loading user settings', 5);
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
					if (sessionStorage.getItem('modSkipWarn') === null) {
						sessionStorage.setItem('modSkipWarn', false);
						sessionStorage.setItem('modQuitWarn', false);
						sessionStorage.setItem('trustWarn', false);
						sessionStorage.setItem('fastBanWarn', false);
						sessionStorage.setItem('helpCommands', false);
						sessionStorage.setItem('removeLabelWarn', false);
					}
					// setInterval
					window.friendsOnline = setInterval(function() {
						pi._tool.getFriends(
							function(friends) {
								if (settings.unfriended) {
									// Not using sessionStorage here to be able to track
									// at any time, even after reboot
									var friendsInStorage = localStorage.getItem('pi-friends');

									if (friendsInStorage !== null) {
										friendsInStorage = JSON.parse(friendsInStorage);

										if (friends.length < friendsInStorage.length) {
											var unfriends = friendsInStorage.filter(user => {
												let inArray = false;

												for (var i = 0; i < friends.length; i++) {
													if (friends[i].id === user.id) inArray = true;
												}

												return !inArray;
											});

											unfriends.forEach(function(friend) {
												pi._tool.log(
													pi._tool.replaceString(lang.info.unfriended, {
														friend: friend.username,
														sad: emoji.replace_colons(':cry:')
													}),
													'info chat'
												);
											});
										}
									}

									localStorage.setItem('pi-friends', JSON.stringify(friends));
								}

								var friendsOnline = [];
								for (var i = 0; i < friends.length; i++) {
									if (typeof friends[i].status == 'undefined') friendsOnline.push(friends[i]);
								}

								// Display how many friends are online next to friends request count
								var count = $('#friends-button > span')[0].innerText.replace(/[0-9]*\//g,'');
								count = friendsOnline.length + '/' + count;
								$('#friends-button > span')[0].innerText = count;

								// Notification for friend connect/disconnected/room change
								if (settings.friendConnect || settings.friendDisconnect || settings.friendRoomChange) {
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
														if (friendsOnline[i].room.slug == 'dashboard')
															pi._tool.log(
																pi._tool.replaceString(
																	lang.log.friendRoomChangeDashboard,
																	{friend: friendsOnline[i].username}
																), 'chat'
															);
														else {
															pi._tool.log(
																pi._tool.replaceString(
																	lang.log.friendRoomChange,
																	{friend: friendsOnline[i].username, link: friendsOnline[i].room.slug, name: friendsOnline[i].room.name}
																), 'chat'
															).div.find('a').on('click', {friend: friendsOnline[i]}, function(e) {
																e.preventDefault();
																let slug = e.data.friend.room.slug,
																    name = e.data.friend.room.name;
																modules.context.dispatch(new modules.RoomEvent(modules.RoomEvent.JOIN, slug, name));
															});
														}
													}
												}
											}

											if (!isInArray && settings.friendConnect) {
												if (typeof friendsOnline[i].room.name === 'undefined') {
													// Went online in dashboard, message is slightly different
													pi._tool.log(
														pi._tool.replaceString(
															lang.log.friendConnectDashboard,
															{friend: friendsOnline[i].username}
														), 'chat'
													);
												} else {
													pi._tool.log(
														pi._tool.replaceString(
															lang.log.friendConnect,
															{friend: friendsOnline[i].username, link: friendsOnline[i].room.slug, name: friendsOnline[i].room.name}
														), 'chat'
													).div.find('a').on('click', {friend: friendsOnline[i]}, function(e) {
														e.preventDefault();
														let slug = e.data.friend.room.slug,
														    name = e.data.friend.room.name;
														modules.context.dispatch(new modules.RoomEvent(modules.RoomEvent.JOIN, slug, name));
													});
												}
											}
										}
										for (var i = 0; i < storage.length; i++) {
											var isInArray = false;

											for (var j = 0; j < friendsOnline.length; j++) {
												if (storage[i].id == friendsOnline[j].id) isInArray = true;
											}

											if (!isInArray && settings.friendDisconnect) {
												pi._tool.log(
													pi._tool.replaceString(
														lang.log.friendDisconnect,
														{friend: storage[i].username}
													), 'chat'
												);
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
					// Creating DOM elements
					updateStatus('Creating script environement', 6);
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
						"background": "url("+settings.customBGURL+") no-repeat"
					}));
					// Menu itself
					$('#app').append($(
						'<div id="pi-menu" style="display: none;">'+
							'<ul>'+
								'<h2>'+lang.menu.general.title+'</h2>'+
								'<ul style="display: none;">'+
									'<li id="pi-woot">'+lang.menu.general.autoWoot+'</li>'+
									'<li id="pi-join">'+lang.menu.general.autoJoin+'</li>'+
									'<li id="pi-keyShortcut">'+lang.menu.general.keyboardShortcuts+'</li>'+
									'<li id="pi-chatCommands">'+lang.menu.general.chatCommands+'</li>'+
									'<li id="pi-autoHideLogs">'+lang.menu.general.autoHideLogs+'</li>'+
									'<li id="pi-autoHideLogsAfter">'+
										'<label for="autoHideLogsAfter">'+lang.menu.general.autoHidelogsLabel+'</label>'+
										'<input type="number" min="1" max="3600" step="1" value="'+settings.autoHideLogsAfter+'" name="autoHideLogsAfter"/>'+
									'</li>'+
									'<li id="pi-mutemeh">'+lang.menu.general.muteMeh+'</li>'+
									'<li id="pi-afkResponder">'+lang.menu.general.afkResponder+'</li>'+
									'<li id="pi-afkMessage">'+
										'<input type="text" placeholder="'+lang.menu.general.afkResponderPlaceholder+'"/>'+
									'</li>'+
									'<li id="pi-navWarn">'+lang.menu.general.navigationWarn+'</li>'+
									'<li id="pi-showVotes">'+lang.menu.general.showVotes+'</li>'+
									'<li id="pi-betterClearChatLimit">'+
										'<label for="betterClearLimit">'+lang.menu.general.clearChatLimitLabel+'</label>'+
										'<input type="number" min="0" max="512" step="1" value="'+settings.betterClearChatLimit+'" name="betterClearLimit"/>'+
									'</li>'+
									'<li id="pi-chatLimit">'+
										'<label for="chatLimit">'+lang.menu.general.chatLimitLabel+'</label>'+
										'<input type="number" min="1" max="512" step="1" value="'+settings.chatLimit+'" name="chatLimit"/>'+
									'</li>'+
									'<li id="pi-skipNextMediaInHistory">'+lang.menu.general.skipNextMediaHistory+'</li>'+
								'</ul>'+
								'<h2>'+lang.menu.customisation.title+'</h2>'+
								'<ul style="display: none;">'+
									'<li id="pi-video">'+lang.menu.customisation.hideVideo+'</li>'+
									'<li id="pi-soundcloudVisu">'+lang.menu.customisation.scVisu+'</li>'+
									'<li id="pi-css">'+lang.menu.customisation.customStyle+'</li>'+
									'<li id="pi-customRanks">'+lang.menu.customisation.customRanks+'</li>'+
									'<li id="pi-languageFlags">'+lang.menu.customisation.languageFlags+'</li>'+
									'<li id="pi-friendsIcons">'+lang.menu.customisation.friendsIcons+'</li>'+
									'<li id="pi-bg">'+lang.menu.customisation.customBG+'</li>'+
									'<li id="pi-old-chat">'+lang.menu.customisation.oldChat+'</li>'+
									'<li id="pi-old-footer">'+lang.menu.customisation.oldFooter+'</li>'+
									'<li id="pi-small-history">'+lang.menu.customisation.smallHistory+'</li>'+
									'<li id="pi-small-friends">'+lang.menu.customisation.smallFriends+'</li>'+
									'<li id="pi-small-playlists">'+lang.menu.customisation.smallPlaylists+'</li>'+
								'</ul>'+
								'<h2>'+lang.menu.moderation.title+'</h2>'+
								'<ul style="display: none;">'+
									'<li id="pi-showDeletedMsg">'+lang.menu.moderation.showDeletedMsg+'</li>'+
									'<li id="pi-confirmDelete">'+lang.menu.moderation.confirmChatDeletion+'</li>'+
									'<li id="pi-userInfo">'+lang.menu.moderation.userInformation+'</li>'+
									'<li id="pi-stuckSkip">'+lang.menu.moderation.skipStuckSongs+'</li>'+
									'<li id="pi-lengthA">'+lang.menu.moderation.songLimit+'</li>'+
									'<li id="pi-songLength">'+
										'<input type="text" placeholder="'+lang.menu.moderation.songLimitPlaceholder+'"/>'+
									'</li>'+
									'<li id="pi-historyA">'+lang.menu.moderation.historyAlert+'</li>'+
								'</ul>'+
								'<h2>'+lang.menu.notifications.title+'</h2>'+
								'<ul style="display: none;">'+
									'<li id="pi-systemNotifications">'+lang.menu.notifications.systemNotifications+'</li>'+
									'<li id="pi-songStats">'+lang.menu.notifications.songStats+'</li>'+
									'<li id="pi-boothAlert">'+lang.menu.notifications.boothAlert+'</li>'+
									'<li id="pi-boothPosition">'+
										'<label for="boothPosition">'+lang.menu.notifications.boothPositionLabel+'</label>'+
										'<input type="number" min="1" max="50" step="1" value="'+settings.boothPosition+'" name="boothPosition"/>'+
									'</li>'+
									'<li id="pi-userJoin">'+lang.menu.notifications.userJoin+'</li>'+
									'<li id="pi-userLeave">'+lang.menu.notifications.userLeave+'</li>'+
									'<li id="pi-userWoot">'+lang.menu.notifications.userWoot+'</li>'+
									'<li id="pi-userGrab">'+lang.menu.notifications.userGrab+'</li>'+
									'<li id="pi-userMeh">'+lang.menu.notifications.userMeh+'</li>'+
									'<li id="pi-guestJoin">'+lang.menu.notifications.guestJoin+'</li>'+
									'<li id="pi-guestLeave">'+lang.menu.notifications.guestLeave+'</li>'+
									'<li id="pi-friendRoomChange">'+lang.menu.notifications.friendRoomChange+'</li>'+
									'<li id="pi-friendConnect">'+lang.menu.notifications.friendConnect+'</li>'+
									'<li id="pi-friendDisconnect">'+lang.menu.notifications.friendDisconnect+'</li>'+
									'<li id="pi-unfriended">'+lang.menu.notifications.unfriended+'</li>'+
									'<li id="pi-gainNotification">'+lang.menu.notifications.gainNotification+'</li>'+
									'<li id="pi-gainNotificationMinXP">'+
										'<label for="gainNotificationMinXP">'+lang.menu.notifications.gainNotificationMinXPLabel+'</label>'+
										'<input type="number" min="1" max="1000" step="1" value="'+settings.minimumGain.xp+'" name="gainNotificationMinXP"/>'+
									'</li>'+
									'<li id="pi-gainNotificationMinPP">'+
										'<label for="gainNotificationMinPP">'+lang.menu.notifications.gainNotificationMinPPLabel+'</label>'+
										'<input type="number" min="1" step="1" value="'+settings.minimumGain.pp+'" name="gainNotificationMinPP"/>'+
									'</li>'+
									'<li id="pi-userLevelUp">'+lang.menu.notifications.userLevelUp+'</li>'+
								'</ul>'+
								'<h2>'+lang.menu.about.title+'</h2>'+
								'<p style="display: none;">'+
									'Plug-It '+pi._tool.getReadableVersion()+'.<br>'+
									pi._tool.replaceString(lang.menu.about.developedBy, {"plug-profile": '<a target="_blank" href="https://plug.dj/@/wibla" target="blank">WiBla</a><br>'})+
									pi._tool.replaceString(lang.menu.about.followUs, {twitter: '<a target="_blank" href="https://twitter.com/plugit_dj" target="blank">Twitter</a><br>'})+
									pi._tool.replaceString(lang.menu.about.joinDiscord, {discord: '<a target="_blank" href="https://discord.gg/DptCswA" target="blank">Discord</a><br>'})+
									'<a target="_blank" href="https://chrome.google.com/webstore/detail/plug-it-extension/bikeoipagmbnkipclndbmfkjdcljocej">'+lang.menu.about.rateExtension+'</a><br>'+
									'<a target="_blank" href="https://crowdin.com/project/plug-it">'+lang.menu.about.translate+'</a><br>'+
									'<a target="_blank" href="https://github.com/Plug-It/pi/issues">'+lang.menu.about.reportBug+'</a><br>'+
									'<span id="pi-off">'+lang.menu.about.shutdown+'</span>'+
								'</p>'+
							'</ul>'+
						'</div>'
					));
					// Menu css
					$('head').append($('<link id="pi-menu-CSS" rel="stylesheet" type="text/css" href="'+url.styles.menu_css+'">'));
					// DelChat icon
					$('#chat-popout-button').before(
						'<div id="pi-delchat" class="chat-header-button">'+
							'<i class="icon icon-chat"></i>'+
							'<i class="icon icon-delete"></i>'+
						'</div>'
					);
					// AFK icon
					$('#chat-popout-button').before(
						'<div id="pi-afk" class="chat-header-button">'+
							'<i class="icon pi-afk off"></i>'+
						'</div>'
					);
					// Toggle stream icon
					$('#chat-popout-button').before(
						'<div id="pi-toggleStream" class="chat-header-button">'+
							// Notice we init the icon on off state
							'<i class="icon pi-toggleStream off"></i>'+
						'</div>'
					);
					// Init toggleStream with the correct class
					if (!modules.plugOptions.settings.streamDisabled)
						$('.pi-toggleStream').removeClass('off');
					// Moderation toolbar
					window.modToolbar = {
						init: function(forced) {
							// Forced is used when user has its role changes and hasPerm will return a false result
							if (API.hasPermission(null, API.ROLE.BOUNCER) || forced) {
								if ($('#pi-rmvDJ, #pi-skip').length > 0) this.kill();
								// Moderation tools
								$('#playback-container').append($(
									'<div id="pi-rmvDJ">'+
										'<i class="icon icon-leave-waitlist"></i>'+
									'</div>'+
									'<div id="pi-skip">'+
										'<i class="icon icon-skip"></i>'+
									'</div>'
								).css({top: settings.showVideo ? '281px' : '0px'}));
								if (typeof pi.dom !== 'undefined') {
									pi.dom.skip = $('#pi-rmvDJ')[0];
									pi.dom.rmvDJ = $('#pi-skip')[0];
								}

								$('#pi-rmvDJ').on('click', function() {pi.removeDJ();});
								$('#pi-skip').on('click', function() {pi.forceSkip();});
								$('#pi-rmvDJ, #pi-skip').on('mousewheel', pi._DOMEvent.volumeWheel);
							}
						},
						kill: function() {
							$('#pi-rmvDJ, #pi-skip').remove();
							delete pi.dom.rmvDJ;
							delete pi.dom.skip;
						}
					};
					modToolbar.init();
					// Click Event Binding
					$('#pi-logo, #pi-menu').on('click', function(e) {
						if (e.target.id === 'pi-logo' || e.target.id === 'icon') {
							$('#pi-menu').toggle(250);
						} else if (e.target.tagName !== 'H2') {
							pi.menu(e.target.id.replace('pi-', ''));
						}
					});
					$('#pi-menu h2').on('click', function(e) {
						var $openMenus = $('#pi-menu h2+*:not([style*="display: none"])');
						if ($openMenus.length !== 0) {
							$openMenus.not(e.target.nextSibling).slideToggle({duration: 400,easing: 'linear'});
						}
						$(this).next().slideToggle({duration: 400,easing: 'linear'});
					});
					$('#pi-autoHideLogsAfter input').on('change', function() {
						settings.AutoHideLogsAfter = parseInt(this.value);
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
					$('#pi-gainNotificationMinXP input').on('change', function() {
						settings.minimumGain.xp = parseInt(this.value);
					});
					$('#pi-gainNotificationMinPP input').on('change', function() {
						settings.minimumGain.pp = parseInt(this.value);
					});
					$(window).on('resize', pi._DOMEvent.resize);
					$('#pi-menu input').on('blur', function() {pi._tool.saveSettings});
					$('#pi-delchat').on('click', function(e) {
						if (e.ctrlKey) {
							API.sendChat('/clear');
						} else if (e.shiftKey) {
							document.getSelection().removeAllRanges();
							$('#chat .from.Plug-It').closest('.cm').remove();
						} else {
							pi.betterClearChat(settings.betterClearChatLimit);
						}
					});
					$('#pi-afk').on('click', function(e) {
						if (e.ctrlKey) {
							let afkMsg = prompt("AFK message:", settings.afkMessage);
							if (afkMsg === null || afkMsg.length === 0) return;
							settings.afkMessage = $('#pi-afkMessage input')[0].value = afkMsg;
						}
						pi.menu('afkResponder');
					});
					$('#pi-toggleStream').on('click', function(e) {
						var streamDisabled = modules.plugOptions.settings.streamDisabled;

						streamDisabled = !streamDisabled;
						modules.plugOptions.settings.streamDisabled = streamDisabled;

						modules.context.trigger('change:streamDisabled');
						modules.plugOptions.save();
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
					$('#pi-afk').on('mouseenter', function() {
						let x = $(this).offset().left + ($(this).width()/2);
						let y = $(this).offset().top - ($(this).height());
						pi._tool.tooltip(true, 'right', x,y, lang.tooltips.afk);
						// Since tootlip is point on the right but x & y are from top left,
						// instead of calculating the width of the tooltip (which depends on the translation),
						// just apply a translate effect, much easier.
						$('#tooltip').css({transform: 'translate(-100%, 0)'});
					});
					$('#pi-toggleStream').on('mouseenter', function() {
						let x = $(this).offset().left + ($(this).width()/2);
						let y = $(this).offset().top - ($(this).height());
						pi._tool.tooltip(true, 'right', x,y, lang.tooltips.toggleStream);
						// Since tootlip is point on the right but x & y are from top left,
						// instead of calculating the width of the tooltip (which depends on the translation),
						// just apply a translate effect, much easier.
						$('#tooltip').css({transform: 'translate(-100%, 0)'});
					});
					$('#now-playing-media, #pi-rmvDJ, #pi-skip, #pi-delchat, #pi-afk, #pi-toggleStream').on('mouseleave', function() {pi._tool.tooltip();});
					// Show votes
					$("#woot, #grab, #meh").on('mouseenter', function() {
						if (settings.showVotes) {
							let votes;
							switch (this.id) {
								case 'woot': votes = session.woots; break;
								case 'grab': votes = session.grabs; break;
								case 'meh':  votes = session.mehs;  break;
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
						autoHideLogs: $('#pi-autoHideLogs')[0],
						autoHideLogsAfter: $('#pi-autoHideLogsAfter')[0],
						betterMeh: $('#pi-mutemeh')[0],
						afkResponder: $('#pi-afkResponder')[0],
						afkMessage: $('#pi-afkMessage')[0],
						navWarn: $('#pi-navWarn')[0],
						showVotes: $('#pi-showVotes')[0],
						betterClearChatLimit: $('#pi-betterClearChatLimit')[0],
						chatLimit: $('#pi-chatLimit')[0],
						skipNextMediaInHistory: $('#pi-skipNextMediaInHistory')[0],
						// Customisation
						video: $('#pi-video')[0],
						soundcloudVisu: $('#pi-soundcloudVisu')[0],
						css: $('#pi-css')[0],
						customRanks: $('#pi-customRanks')[0],
						languageFlags: $('#pi-languageFlags')[0],
						friendsIcons: $('#pi-friendsIcons')[0],
						bg: $('#pi-bg')[0],
						oldChat: $('#pi-old-chat')[0],
						oldFooter: $('#pi-old-footer')[0],
						smallHistory: $('#pi-small-history')[0],
						smallFriends: $('#pi-small-friends')[0],
						smallPlaylists: $('#pi-small-playlists')[0],
						// Moderation
						showDeletedMsg: $('#pi-showDeletedMsg')[0],
						confirmDelete: $('#pi-confirmDelete')[0],
						userInfo: $('#pi-userInfo')[0],
						stuckSkip: $('#pi-stuckSkip')[0],
						lengthA: $('#pi-lengthA')[0],
						songLength: $('#pi-songLength')[0],
						historyAlert: $('#pi-historyA')[0],
						// Notifications
						systemNotifications: $('#pi-systemNotifications')[0],
						songStats: $('#pi-songStats')[0],
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
						gainNotificationMinXP: $('#pi-gainNotificationMinXP')[0],
						gainNotificationMinPP: $('#pi-gainNotificationMinPP')[0],
						userLevelUp: $('#pi-userLevelUp')[0],
						// About
						off: $('#pi-off')[0],
						// Mod Bar
						rmvDJ: $('#pi-rmvDJ')[0],
						skip: $('#pi-skip')[0],
						// Other
						DelChat: $('#pi-delchat')[0],
						// Plug
						stream: $('#playback-container')[0],
						playback: $('#playback')[0]
					};

					delete pi._load; // Init only once
					pi._tool.log(pi._tool.replaceString(lang.log.loaded, {version: pi._tool.getReadableVersion()}) + ' ' + (new Date().getTime() - startTime) + 'ms');
					// If userSettings is undefined: first time we run the script
					if (!userSettings) {
						pi._tool.log(lang.log.help, 'info chat');
						pi._tool.log(lang.log.preRelease, 'warn chat');
					}
					// Initialise the menu & setup script
					pi.menu('init');
					pi.muteMeh();
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
					pi._tool.plugSocketHook.kill();
					modules.context.off('chat:receive', pi._modulesEvent.chatReceive);
					modules.context._events['chat:delete'][0].callback = modules.originalChatDelete;
					modules.context.off('change:streamDisabled', pi._modulesEvent.streamDisabled);
					// modules.context._events['chat:delete'].push(modules.events.chatDelete);
					delete modules;

					// Allow to reload
					window.scriptURL = url.script;
					window.onbeforeunload = null;

					clearInterval(friendsOnline);
					clearInterval(checkIfRoomChanged);

					delete friendsOnline;
					delete roomURL;
					delete checkIfRoomChanged;

					// Unbind events BEFORE removing elements
					$(window).off('keydown', pi._DOMEvent.keydown);
					$(window).off('dblclick', pi._DOMEvent.translate);
					$(window).off('resize', pi._DOMEvent.resize);
					$('#volume, #playback-controls').off('mousewheel', pi._DOMEvent.mousewheel);
					$('.button.staff').off('click', pi._DOMEvent.collideRanks);
					$('#chat-popout-button').off('click', pi._DOMEvent.popout);
					$("#chat-input-field").off('input', pi._DOMEvent.chatAutocompletion);
					$(document).off('ajaxSuccess', pi._DOMEvent.updateRoomSettings);
					$('.group').css('cursor', '');

					$(".room-background").show();
					$('[id*="pi-"], .icon[class*="pi-"]').each(function() {
						this.remove();
					});

					$('#now-playing-media, #woot, #grab, #meh').off('mouseenter');
					$('#now-playing-media, #woot, #grab, #meh').off('mouseleave');
					// Preventing making the video definitly disapear
					if (!settings.showVideo) {
						if (pi._tool.getPlugSettings().videoOnly) {
							pi.dom.playback.style.height = window.innerHeight - 185+'px';
							$(pi.dom.stream).css({visibility:'visible', height:'100%'});
						} else {
							pi.dom.playback.style.height = '271px';
							$(pi.dom.stream).css({visibility:'visible', height:'281px'});
						}
						$('#playback-controls, #no-dj').css('visibility', 'visible');
					}

					pi._extendAPI.kill();

					delete pi;
				},
				_extendAPI: {
					init: function() {
						API.GLOBAL_ROLE = {
							ADMIN: 5000,
							AMBASSADOR: 3000,
							MODERATOR: 2500,
							PLOT: 750,
							PROMOTER: 500
						};
						API.GUEST_JOIN = 'guestJoin';
						API.GUEST_LEAVE = 'guestLeave';
						API.EARN = 'earn';

						API.moderateForceQuit = function() {
							if (API.hasPermission(null, API.ROLE.BOUNCER) && API.enabled) {
								$.ajax({
									url: '/_/booth/remove/'+API.getDJ().id,
									method: 'DELETE'
								});
							}
						};
						API.getUserByName = function(name) {
							if (!API.enabled) return;
							if (typeof name == 'undefined') {
								throw new Error('A name must be provided.');
							} else {
								var user = API.getUsers().filter(u => u.username === name);
								return (user.length > 0 ? user[0] : null);
							}
						};
						API.getUserByID = function(id, callback) {
							if (!API.enabled || isNaN(id) || typeof callback !== 'function') return;
							$.ajax({
								url: '/_/users/'+id,
								success: function(data) {
									callback(data.data[0]);
								},
								error: function(e) {
									console.error(e);
								}
							});
						};
						API.addFriendByID = function(id) {
							if (isNaN(id) || !API.enabled) return;
							$.ajax({
								type: 'POST',
								url: '/_/friends',
								data: JSON.stringify({
									'id': id
								}),
								success: function() {
									API.getUserByID(id, (user) => {
										modules.context.trigger('notify', 'icon-add-friend', modules.lang.messages.friendRequest.split('%NAME%').join(user.username));
									});
								},
								error: function(e) {
									console.error(e);
								},
								dataType: 'json',
								contentType: 'application/json'
							});
						};
						API.moderateKickUser = function(id, time) {
							if (arguments.length < 2 || !API.enabled) return;

							var duration;
							if (time>=24*60*60) duration = 'f';
							else if (time>=60*60) duration = 'd';
							else duration = 'h';

							$.ajax({
								type: 'POST',
								url: '/_/bans/add',
								data: JSON.stringify({
									'userID': id,
									'reason': 1,
									'duration': duration
								}),
								dataType: 'json',
								contentType: 'application/json',
								error: function(err) {
									if (typeof err.responseJSON.data[0] !== 'undefined') {
										pi._tool.log(['Could not ban user: ', err.responseJSON.data[0]], 'error');
									} else {
										pi._tool.log(['Could not ban user: ', err], 'error');
									}
								},
								success: function() {
									pi._tool.log('User was succesfully banned for '+time+' seconds.', 'chat');

									setTimeout(function() {
										$.ajax({
											type: 'DELETE',
											url: '/_/bans/'+id,
											error: function(err) {
												pi._tool.log(['Could not unban user: ', err], 'error');
											},
											success: function() {
												pi._tool.log('User was unbanned.', 'success chat');
											}
										});
									}, time*1000);
								}
							});
						};
						API.gift = function(id, amount, customName) {
							if (isNaN(id) || isNaN(amount) || !API.enabled || API.getUser().sub < 1) return;

							var user = API.getUser(id);
							if (!user.username) {
								API.getUserByID(id, (user) => {
									customName = typeof customName === 'string' ? customName : user.username;
									amount = typeof amount == 'undefined' ? 25 : amount;
									pi._tool.showGiftDialog(id, customName, amount);
								});
							} else {
								customName = typeof customName === 'string' ? customName : user.username;
								amount = typeof amount == 'undefined' ? 25 : amount;
								pi._tool.showGiftDialog(id, customName, amount);
							}
						};
						API.getActivePlaylist = function() {
							if (!API.enabled) return;
							let currentPL, name, id, count, allPL;
							currentPL = $('#playlist-menu .row.selected');
							name = currentPL.children()[1].innerText;
							count = currentPL.children()[2].innerText;
							allPL = JSON.parse(_.find(require.s.contexts._.defined,function(m){return m&&m._read})._read())[1]['p'];

							for (var PL in allPL) {
								if (allPL[PL].name === name) {
									id = allPL[PL].id;
								}
							}

							return {
								name: name,
								id: id,
								itemCount: count
							}
						};
						API.getRoomName = function() {
							if (!API.enabled) return;
							try {
								return modules.room.get('name');
							} catch(e) {
								return $('#room-name span').text();
							}
						};
						API.moderateDeleteChat = function(cid) {
							if (API.enabled && cid) {
								$.ajax({url: '/_/chat/'+cid, method: 'DELETE'});
							}
						};
					},
					kill: function() {
						delete API.GLOBAL_ROLE;
						delete API.GUEST_JOIN;
						delete API.GUEST_LEAVE;
						delete API.EARN;

						delete API.moderateForceQuit;
						delete API.getUserByName;
						delete API.getUserByID;
						delete API.addFriendByID;
						delete API.moderateKickUser;
						delete API.gift;
						delete API.getActivePlaylist;
						delete API.getRoomName();
					}
				},
				_tool: {
					applyRoomSettings: function() {
						for (var script in roomSettings) {
							for (var rule in roomSettings[script]) {
								// Do not load room settings if "room" key != room URL
								if (rule === 'room' && roomSettings[script][rule] !== location.pathname.slice(1)) {
									return pi._tool.log('Could not load room settings: room value must match room URL.', 'error');
								}

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
								else {
									pi._tool.log(
										pi._tool.replaceString(
											lang.log.updateAvailable,
											{whatsnew: data.commit.message}
										),
										'info chat',
										function(){pi._reload();}
									);
								}
							}
						});
					},
					getFriends: function(callback) {
						/* Sadly, this is the only way to get friends
						 * It's ugly, I know. In order to update, you
						 * have to make a call every x sec/min.
						 * You can thank plug.
						 */

						if (!session.floodAPI) {
							$.ajax({
								url: '/_/friends',
								success: function(data) {
									callback(data.data);
								}
							});
						}

					},
					getPlaylist: function(id, callback) {
						if (isNaN(id) || typeof callback !== 'function' || session.floodAPI) return;
						let cache = _.find(require.s.contexts._.defined,function(m){return m&&m._read})._read();
						cache = JSON.parse(cache);
						let thisPL = cache[1]['p'][id]['items'];

						if (Object.keys(thisPL).length !== 0) {
							let data = [];
							for (var cid in thisPL) {
								data.push(cache[1]['m'][cid]);
							}
							callback(data, true); // true = cached
						} else {
							$.ajax({
								url: '/_/playlists/'+id+'/media',
								success: function(data) {
									callback(data.data, false); // false = non cached
								}
							});
						}
					},
					getPlaylists: function(callback) {
						if (typeof callback !== 'function' || session.floodAPI) return;

						$.ajax({
							url: '/_/playlists',
							success: function(data) {
								// return array sorted by playlist name
								callback(data.data.sort((a,b) => a.name.localeCompare(b.name)));
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

						// Self assignable roles
						if (settings.bot.indexOf(id) !== -1) result.push('Bot');
						if (settings.discordbot.indexOf(id) !== -1) result.push('Discord Bot');

						return result;
					},
					getReadableVersion: function() {
						let subVersion = '';

						if (pi.version.pre) {
							subVersion = ' Pre ' + pi.version.pre;
						}

						return pi.version.major+'.'+pi.version.minor+'.'+pi.version.patch+subVersion;
					},
					getRoomRules: function(which) {
						if (typeof roomSettings.rules === 'undefined') return true;
						if (typeof roomSettings.rules[which] === 'undefined') return true;
						else return roomSettings.rules[which];
					},
					getRoomSettings: function() {
						if (session.floodAPI) return;
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
											if (typeof data !== 'object') data = JSON.parse(data);
											roomSettings[scriptName] = data;
											roomSettingsLoaded();
										},
										error: function(e) {
											pi._tool.log(
												pi._tool.replaceString(
													lang.error.cannotLoadScriptRoomSettings,
													{
														script: scriptName,
														error: e
													}
												),
												'error console'
											);
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
									emotes.twitch = {};
									for (var emote in data.emotes) {
										emotes.twitch[emote] = data.template.small.replace('{image_id}', data.emotes[emote].image_id);
									}
								}
							});
						} else if (which === 'twitchSub') {
							$.ajax({
								url: url.emotes.twitchSub,
								success: function(data) {
									emotes.twitchSub = {};
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
					log: function(txt, placeType, callback, ...cbArgs) {
						let type, emoticon, time;
						if (typeof placeType === 'undefined') placeType = 'log';
						if (placeType.indexOf('log') > -1) {
							type = 'log';
							emoticon = 'log';
						}
						else if (placeType.indexOf('info') > -1) {
							type = 'info';
							emoticon = ':information_source:';
						}
						else if (placeType.indexOf('warn') > -1) {
							type = 'warn';
							emoticon = ':warning:';
						}
						else if (placeType.indexOf('error') > -1) {
							type = 'error';
							emoticon = ':exclamation:';
						}
						else if (placeType.indexOf('debug') > -1) {
							type = 'debug';
							emoticon = ':octocat:';
						}
						else if (placeType.indexOf('success') > -1) {
							type = 'success';
							emoticon = ':white_check_mark:';
						}
						else {
							type = 'log';
							emoticon = 'log';
						}

						if (placeType.indexOf('console') === -1) {
							const timestamp = pi._tool.getPlugSettings().chatTimestamps;
							if (timestamp) {
								time = new Date();
								let h = time.getHours();
								let m = time.getMinutes();
								m = m<10 ? '0'+m : m;

								if (timestamp == 12) {
									let am;

									if (h >= 12) {
										am = 'pm';
										h -= 12;
									}
									else am = 'am';

									time = h+':'+m+am;
								}
								else {
									h = h<10 ? '0'+h : h; // Add a 0 to hours only if timestamp is 24
									time = h+':'+m;
								}
							}

							var $logBox = $(
								'<div class="cm pi-'+type+' message deletable">'+
									'<div class="delete-button" style="display: none;">'+lang.glossary.delete+'</div>'+
										'<div class="badge-box">'+
											'<i class="bdg bdg-piLogo"></i>'+
										'</div>'+
										'<div class="msg">'+
											'<div class="from Plug-It">'+
											(emoticon === 'log' ? '<i class="icon icon-pi"></i>' : emoji.replace_colons(emoticon))+
											'<span class="un">[Plug-It]</span>'+
											'<span class="timestamp" style="display: '+ (timestamp ? 'inline-block' : 'none') +';">'+time+'</span>'+
										'</div>'+
										'<div class="text cid-undefined">'+(Array.isArray(txt) ? txt.join('<br />') : txt.replace(/\\n|\n/g, '<br />'))+'</div>'+
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
							// Make the chat scroll to custom log
							var $chat = $('#chat-messages');
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
							if (typeof window.popout !== 'undefined') $('#chat-messages', popout.document).append($logBox);

							function autoHideLogs() {
								if (!document.hasFocus()) {
									// This acts like a $(window).one('focus');
									window.onfocus = function() {
										setTimeout(function() {
											$($logBox).fadeOut(1000, 'linear', () => $($logBox).remove());
										}, settings.autoHideLogsAfter*1000);
										window.onfocus = undefined;
									}
								} else {
									$($logBox).fadeOut(1000, 'linear', () => $($logBox).remove());
								}
							}
							if (settings.autoHideLogs) {
								setTimeout(autoHideLogs, settings.autoHideLogsAfter*1000);
							}

							// Prevents message from merging, awaiting a better solution..
							API.chatLog('Don\'t pay attention to this message please.');
							if (typeof popout === 'undefined') {
								if ($('.cm.log:last').length) $('.cm.log:last')[0].remove();
							} else {
								if ($('.cm.log:last', popout.document).length) $('.cm.log:last', popout.document)[0].remove();
							}
						}
						if (placeType.indexOf('chat') === -1) {
							if (type === 'success') type = 'log'; // Success is not a console's method
							console[type]('%c[%cPlug-It%c]%c','color: #EEE','color: #ABDA55','color: #EEE','',txt);
						}

						// This allow the log to be edited theoricaly at any time
						// (unless autoHideLogs is enabled and/or the log has been deleted)
						if (placeType.indexOf('console') === -1) {
							let methods = {
								div: $logBox,
								text: $logBox.find('.text')[0].innerText,
								edit: function(txt) {
									$logBox.find('.text')[0].innerHTML = (Array.isArray(txt) ? txt.join('<br>') : txt.toString());
									return this;
								},
								changeType: function(newType) {
									if (newType === type) return methods;
									$logBox.toggleClass('pi-'+type + ' pi-'+newType);
									let newNode, icon;

									switch(newType) {
										case 'log':
											newNode = document.createElement('i');
											newNode.className = 'icon icon-pi';
										break;

										case 'info':
											newNode = $.parseHTML(emoji.replace_colons(':information_source:'))[0];
										break;

										case 'warn':
											newNode = $.parseHTML(emoji.replace_colons(':warning:'))[0];
										break;

										case 'error':
											newNode = $.parseHTML(emoji.replace_colons(':exclamation:'))[0];
										break;

										case 'debug':
											newNode = $.parseHTML(emoji.replace_colons(':octocat:'))[0];
										break;

										case 'success':
											newNode = $.parseHTML(emoji.replace_colons(':white_check_mark:'))[0];
										break;
									}
									icon = $logBox[0].children[2].children[0];
									icon.replaceChild(newNode,icon.firstChild);

									type = newType; // important for multiple changes
									return this;
								},
								removeCallback: function() {
									$logBox.off('click');
									$logBox.css('cursor', '');
									return this;
								},
								delete: function() {
									$logBox.remove();
									return this;
								}
							};

							// Callback
							if (typeof callback === 'function') {
								$logBox.css('cursor', 'pointer');
								$logBox.on('click', function(e) {
									callback.call(methods, ...cbArgs);
								});
							}
							return methods;
						}
					},
					modal: function(set, type, callback, data) {
						if (set) {
							var $dialog;

							switch(type) {
								case 'custom-bg':
									const defaultURL = $('.room-background').css('background-image').split('"')[1];
									$dialog = $(
										'<div id="dialog-media-update" class="dialog" style="height: auto;">'+
											'<div class="dialog-frame">'+
												'<span class="title">'+lang.modal.customBGTitle+'</span>'+
												'<i class="icon icon-dialog-close"></i>'+
											'</div>'+

											'<div class="dialog-body" style="height:300px;overflow-y:auto;">'+
												'<div class="dialog-input-container" style="position:relative;top:10px;">'+
													'<span class="dialog-input-label">URL</span>'+
													'<div class="dialog-input-background">'+
														'<input name="url" type="text" placeholder=".jpg .png .gif.." value="'+(settings.customBGURL !== null ? settings.customBGURL : 'Custom background URL')+'">'+
													'</div>'+
													'<p style="position:relative;top:55px;">'+lang.modal.additionalBackgrounds+'</p>'+
													'<figure style="position:relative;top:65px;">'+
														'<figcaption>Plug\'s original backgrounds</figcaption>'+
														'<div class="thumbnail" style="background: url('+defaultURL+') 0 0 / 150px 84px" data-src="default" alt="Plug\'s background"></div>'+
														'<div class="thumbnail" style="background-position: -150px -84px" data-src="https://dl.dropboxusercontent.com/s/x2m4e4go92ecwn5/2k13winter.jpg" alt="Plug\'s 2013 winter background"></div>'+
														'<div class="thumbnail" style="background-position: -300px -84px" data-src="https://dl.dropboxusercontent.com/s/06aezou89twexfi/2k14hw.jpg" alt="Plug\'s 2014 halloween background"></div>'+
														'<div class="thumbnail" style="background-position: -450px -84px" data-src="https://dl.dropboxusercontent.com/s/pru886rp6sfhguo/2k14minecraft.jpg" alt="Plug\'s 2014 Minecraft background"></div>'+
														'<div class="thumbnail" style="background-position: -600px -84px" data-src="https://dl.dropboxusercontent.com/s/yzwlvq9uk4vgyps/2k14tc.jpg" alt="Plug\'s 2014 TastyCat background"></div>'+
														'<div class="thumbnail" style="background-position: -750px -84px" data-src="https://dl.dropboxusercontent.com/s/dw1g3g87clubjor/2k14tiki.jpg" alt="Plug\'s 2014 Tiki background"></div>'+
														'<div class="thumbnail" style="background-position: 0 -168px" data-src="https://dl.dropboxusercontent.com/s/n0vdz30m4edpvnm/2k14winter.jpg" alt="Plug\'s 2014 winter background"></div>'+
														'<div class="thumbnail" style="background-position: -150px -168px" data-src="https://dl.dropboxusercontent.com/s/tt8385hnd61vu7t/2k15beach.jpg" alt="Plug\'s 2015 Beach background"></div>'+
														'<div class="thumbnail" style="background-position: -300px -168px" data-src="https://dl.dropboxusercontent.com/s/tdiyz39fpepdamt/2k15diner.jpg" alt="Plug\'s 2015 Diner background"></div>'+
														'<div class="thumbnail" style="background-position: -450px -168px" data-src="https://dl.dropboxusercontent.com/s/gdw01htqn3kb5ul/2k15island.jpg" alt="Plug\'s 2015 Island background"></div>'+
														'<div class="thumbnail" style="background-position: -600px -168px" data-src="https://dl.dropboxusercontent.com/s/f05ranw1gjmrekj/2k15nyc.jpg" alt="Plug\'s 2015 New York City background"></div>'+
														'<div class="thumbnail" style="background-position: -750px -168px" data-src="https://dl.dropboxusercontent.com/s/1e7isnah6dz8mks/2k15sea.jpg" alt="Plug\'s 2015 Sea background"></div>'+
														'<div class="thumbnail" style="background-position: 0 -252px" data-src="https://dl.dropboxusercontent.com/s/godmbmvf7iso1hp/2k15tasty.jpg" alt="Plug\'s 2015 Tasty background"></div>'+
													'</figure>'+

													'<figure style="position:relative;top:65px;">'+
														'<figcaption>'+lang.modal.otherChoices+'</figcaption>'+
														'<div class="thumbnail" style="background-position: 0 0" data-src="https://dl.dropboxusercontent.com/s/guglxeg29z8xdyc/Plug-It.jpg" alt="Plug-It background"></div>'+
														'<div class="thumbnail" style="background-position: -150px 0" data-src="https://dl.dropboxusercontent.com/s/okazf75swvx5n3r/Plug-It-old.jpg" alt="Plug-It Old background"></div>'+
														'<div class="thumbnail" style="background-position: 0 -336px" data-src="https://dl.dropboxusercontent.com/s/rs4yhqsmp557q46/2k14lounge.jpg" alt="lounge background"></div>'+
														'<div class="thumbnail" style="background-position: -150px -336px" data-src="https://dl.dropboxusercontent.com/s/rayu1kdzve55ynd/2k14worldonfire.jpg" alt="WorldOnFire background"></div>'+
														'<div class="thumbnail" style="background-position: -300px -336px" data-src="https://dl.dropboxusercontent.com/s/hwh25f5o39a4rft/2k15rtreesmusic.jpg" alt="/r/trees background"></div>'+
														'<div class="thumbnail" style="background-position: -450px -336px" data-src="https://dl.dropboxusercontent.com/s/rg7egwly5m41z5a/2k15thenation.jpg" alt="The Nation background"></div>'+
														'<div class="thumbnail" style="background-position: -600px -336px" data-src="https://dl.dropboxusercontent.com/s/3kg8riyabo08y9a/JGI5G7x.jpg" alt="Unknown"></div>'+
														'<div class="thumbnail" style="background-position: -750px -336px" data-src="https://dl.dropboxusercontent.com/s/gb3ogpqpg5mi15v/minecraft.jpg" alt="Minecraft"></div>'+
														'<div class="thumbnail" style="background-position: 0 -420px" data-src="https://dl.dropboxusercontent.com/s/nvc6xtx17oqlzlv/NYC-Custom.jpg" alt="NYC - Custom"></div>'+
														'<div class="thumbnail" style="background-position: -150px -420px" data-src="https://dl.dropboxusercontent.com/s/30zbmkdi31jtxtl/plugalpha.jpg" alt="Plug Alpha"></div>'+
														'<div class="thumbnail" style="background-position: -300px -420px" data-src="https://dl.dropboxusercontent.com/s/idchvsywitwvns5/plugalphaLounge.jpg" alt="Plug Alpha Lounge"></div>'+
													'</figure>'+
													'<p style="position:relative;top:70px;">'+lang.modal.customBGDisclaimer+'</p>'+
												'</div>'+
											'</div>'+

											'<div class="dialog-frame">'+
												'<div class="button cancel"><span>'+lang.glossary.cancel+'</span></div>'+
												'<div class="button submit"><span>'+lang.glossary.save+'</span></div>'+
											'</div>'+
										'</div>'
									);

									$dialog.on('mouseover', '.thumbnail', function(e) {
										let x = $(this).offset().left + ($(this).width()/2);
										let y = $(this).offset().top;
										pi._tool.tooltip(true, 'right', x,y, this.attributes.alt.value);
										$('#tooltip').css({transform: 'translate(-100%, -175%)'});
									});
									$dialog.on('mouseleave', '.thumbnail', function(e) {pi._tool.tooltip();});
									$dialog.on('click', '.thumbnail', function(e) {
										if (e.target.dataset.src === 'default') pi.changeBG(true);
										else pi.changeBG(false, e.target.dataset.src);

										pi._tool.tooltip(false);
										pi._tool.modal(false);
									});
								break;

								case 'confirmDelete':
									$dialog = $(
										'<div id="dialog-media" class="dialog">'+
											'<div class="dialog-frame">'+
												'<span class="title">'+lang.modal.confirmDeleteTitle+'</span>'+
												'<i class="icon icon-dialog-close"></i>'+
											'</div>'+

											'<div class="dialog-body">'+
												'<p>'+
													data.un + ': ' + data.message +
												'</p>'+
											'</div>'+

											'<div class="dialog-frame">'+
												'<div class="button cancel"><span>'+lang.glossary.cancel+'</span></div>'+
												'<div class="button submit"><span>'+lang.glossary.delete+'</span></div>'+
											'</div>'+
										'</div>'
									);
								break;

								default:
									return pi._tool.log('Invalid dialog type.', 'console error');
								break;
							}

							function submit() {
								if (type === 'custom-bg')
									pi.changeBG(false, $dialog.find('input[name="url"]')[0].value);

								if (typeof callback === 'function')
									callback();

								pi._tool.tooltip(false);
								pi._tool.modal(false);
							}
							function cancel() {
								pi._tool.tooltip(false);
								pi._tool.modal(false);
							}

							$dialog.on('click', '.dialog-frame i, .button.cancel', () => {cancel();});
							$('#dialog-container').on('click', (e) => {
								if (e.target.id !== "dialog-container") return;
								cancel();
							});
							$dialog.on('click', '.button.submit', () => {submit();});
							$dialog.on('submit', 'input[name="url"]', () => {submit();});

							$('#dialog-container').append($dialog);
							$('#dialog-container').show();
						} else if (!set) {
							$('#dialog-container').hide();
							$('#dialog-container').html('');
						}
					},
					notify: function(title, content, events) {
						var options = {
							body: content,
							icon: "https://raw.githubusercontent.com/Plug-It/pi/pre-release/img/other/icon-54-hover.png"
						};
						var n = new Notification(title,options);
						for (var type in events) {
							n[type] = events[type];
						}
					},
					// Courtesy of ReAnna https://github.com/extplug/ExtPlug/blob/master/src/plugins/SocketEventsPlugin.js
					plugSocketHook: {
						init: function() {
							let that = this;
							this.socket = getSocket();

							if (this.socket) {
								this.onConnect();
							}

							// make sure we still get an instance if the server reconnects, or
							// if ExtPlug loads before plug.dj connects, by overriding the WebSocket
							// constructor
							const WS = WebSocket;
							window.WebSocket = function WebSocketIntercept(arg) {
								const ws = new WS(arg);
								// wait for plug.dj to add handlers
								_.defer(() => {
									// find the socket object again, this new connection might be
									// instantiated by a plugin or another extension, and that should not
									// be intercepted
									that.socket = getSocket();
									that.onConnect();
								});
								return ws;
							};
							WebSocket.prototype = WS.prototype;

							this.WS = WS;
						},
						kill: function() {
							if (this.WS) window.WebSocket = this.WS;
							if (this.advice) this.advice.remove();

							this.WS = null;
							this.advice = null;
							this.socket = null;
						},
						onConnect: function() {
							if (this.advice) this.advice.remove();

							this.advice = meldBefore(this.socket, 'onmessage', (e) => {

								if (e.data !== 'h') {
									JSON.parse(e.data).forEach((message) => {
										// pi._tool.log(message, 'console info');

										try {
											switch (message.a) {
												case 'chat':
												break;

												case 'chatDelete':
													pi._modulesEvent.chatDelete(message);
												break;

												case 'earn':
													if (settings.gainNotification) {
														let PPEarned = message.p.pp - API.getUser().pp;
														let XPEarned = message.p.xp - API.getUser().xp;

														API.trigger(API.EARN, {pp:PPEarned, xp:XPEarned});
													}
												break;

												case 'floodAPI':
													API.enabled = false;
													session.floodAPI = true;

													// Not really an error but I want it to show a red message
													var log = pi._tool.log(lang.error.APIFloodDetected, 'error');

													setTimeout(() => {
														API.enabled = true;
														session.floodAPI = false;

														log.edit('API reactivated').changeType('info');
													}, 10*1000);
												break;

												case 'modMute':
													if (message.p.d === 'o' && API.hasPermission(null, API.ROLE.BOUNCER)) {
														pi._tool.log(`${message.p.t} has been unmuted by ${message.p.m}.`, 'chat info');
													}
												break;

												case 'modStaff':
													message.p.u.forEach((e,i,a) => {
														let self = API.getUser(); // Unefficient, should cache user somewhere...

														if (e.i === self.id) {
															// From anything to rDJ or Grey
															if (e.p <= 1 && self.role > e.p) modToolbar.kill();
															// From Grey or rDJ to anything above
															else if (e.p >= 2 && self.role < e.p) modToolbar.init(true);
															// Fix for custom ranks & plug not removing the staff icon:
															// Plug only hides the icon but the css still shows the username color
															if (e.p === 0) $('#footer-user .info .name i')[0].className = 'icon';
														}
													});
												break;

												case 'userJoin':
												case 'userLeave':
													if ((message.p.guest || message.p === 0) && (settings.guestJoin || settings.guestLeave)) {
														if (message.a === 'userJoin' && settings.guestJoin)
															API.trigger(API.GUEST_JOIN, modules.room.get('guests')+1);
														else if (message.a === 'userLeave' && settings.guestLeave)
															API.trigger(API.GUEST_LEAVE, modules.room.get('guests')-1);
													}
												break;

												case 'userUpdate':
													if (settings.userLevelUp && message.p.level) {
														pi._tool.log(`User leveled up: ${API.getUser(message.p.i).username} to level ${message.p.level} !`, 'info');
													} else if (message.p.badge || message.p.avatarID) {
														// do not log it
													} else {
														console.log(message);
													}
												break;

												case 'roomWelcomeUpdate':
													pi._tool.log(`${API.getUser(message.p.u).username} edited the room's welcome message to:\n${message.p.w}`, 'console info');
												break;

												case 'roomDescriptionUpdate':
													pi._tool.log(`${API.getUser(message.p.u).username} edited the room's description to:\n${message.p.d}`, 'console info');
													roomSettings = {};
													pi._tool.getRoomSettings();
												break;

												// Unused events
												case 'advance':
												case 'djListCycle':
												case 'djListUpdate':
												case 'grab':
												case 'playlistCycle':
												case 'plugMessage':
												case 'vote':
												break;

												default:
													pi._tool.log(message, 'console info');
												break;
											}
										} catch (e) {
											pi._tool.log(['error while parsing socket message',e], 'console error');
										}

										if (message.a !== 'chatDelete')
											modules.context.trigger(`socket:${message.a}`, message.p);
									});
								}
							});
						}
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
							if (option == whiteList[i] && !session.floodAPI) {
								var data = {};
								data[option] = value;
								$.ajax({
									type: 'PUT',
									url: '/_/users/settings',
									data: JSON.stringify(data),
									error: function(e) {
										pi._tool.log(e.responseJSON.data[0], 'error console');
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
					showGiftDialog(id, username, amount) {
						modules.context.dispatch(new modules.ShowDialogEvent(modules.ShowDialogEvent.SHOW, new modules.GiftSendDialog({
							model: new modules.User({id: id, username: username})
						})));
						$('#dialog-gift-send .amount input')[0].value = amount;
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
							// Jquery only getting one per ID, select with attribute..
							$('[id="tooltip"]').remove();
						}
					}
				},
				afk: function(msg) {
					if (typeof originalPlaceholder == 'undefined') window.originalPlaceholder = $("#chat-input-field")[0].placeholder;

					if (settings.afk) {
						$("#chat-input-field")[0].disabled = true;
						$("#chat-input-field")[0].placeholder = lang.userchat.inputDisabled;
						pi.dom.afkResponder.className = 'pi-on';
						$('#pi-afk .pi-afk').removeClass('off');
					} else {
						$("#chat-input-field")[0].disabled = false;
						$("#chat-input-field")[0].placeholder = originalPlaceholder;
						pi.dom.afkResponder.className = 'pi-off';
						$('#pi-afk .pi-afk').addClass('off');
					}
				},
				autojoin: function() {
					var dj = API.getDJ();

					if (settings.autoDJ && pi._tool.getRoomRules('allowAutojoin')) {
						if (typeof dj !== 'undefined') {
							if (dj.id !== API.getUser().id && API.getWaitListPosition() === -1) {
								switch (API.djJoin()) {
									case 1:
										pi._tool.log(lang.error.autoJoin1, 'error chat');
									break;
									case 2:
										pi._tool.log(lang.error.autoJoin2, 'error chat');
									break;
									case 3:
										pi._tool.log(lang.error.autoJoin3, 'error chat');
									break;
								}
							}
						} else {
							API.djJoin();
						}
					}
				},
				autowoot: function() {
					if (settings.autoW && !$('#meh').is('.selected')) {
						if (pi._tool.getRoomRules('allowAutowoot')) $('#woot')[0].click();
						// set up a sessionStorage to show this message only once
						// else pi._tool.log('This room does not allow you to autowoot.');
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

						settings.customBG = false;
						pi.dom.bg.className = 'pi-off';
					} else {
						if (typeof src === 'undefined' && !settings.customBGURL.length) {
							src = url.images.background;
						} else {
							src = (typeof src === 'string' ? src : url.images.background);
						}

						$('.room-background').hide();
						$('#pi-background').show();
						$('#pi-background').css('background', 'url('+src+') no-repeat');

						if ($('i.torch').length) {
							$('i.torch').hide();
							$('i.torch.right').hide();
						}

						settings.customBG = true;
						settings.customBGURL = src;
						pi.dom.bg.className = 'pi-on';
					}

					pi._tool.saveSettings();
				},
				eta: function(log) {
					let eta;

					if (API.getUser().id == API.getDJ().id) {
						if (log) pi._tool.log(lang.info.youPlay, 'info chat');
						return null;
					} else if (API.getWaitListPosition() == -1) {
						if (log) pi._tool.log(lang.info.notInWaitList, 'info chat');
						return null;
					} else if (API.getWaitListPosition() == 0) {
						eta = API.getTimeRemaining();
						if (eta >= 3600) {
							var etaH = Math.floor(eta/60);
							var etaM = eta%60;
							eta = etaH+'h'+etaM+'m';
						} else if (eta >= 60) {
							var etaM = Math.floor(eta/60);
							var etaS = eta%60;
							etasS = (etaS < 10 ? '0'+etaS : etaS);
							eta = etaM+'m'+etaS+'s';
						} else {
							eta = eta+'s';
						}
					} else {
						eta = (API.getWaitListPosition())*4*60;
						eta += API.getTimeRemaining();
						if (eta >= 3600) {
							var etaH = Math.floor(eta/60/60);
							var etaM = eta%60;
							eta = etaH+'h'+etaM+'m';
						} else {
							var etaM = Math.floor(eta/60);
							var etaS = eta%60;
							eta = etaM+'m'+etaS+'s';
						}
					}

					if (log) {
						pi._tool.log(
							pi._tool.replaceString(
								lang.log.eta,
								{time: eta}
							), 'info chat'
						);
					}
					return eta;
				},
				forceSkip: function() {
					if (sessionStorage.getItem('modSkipWarn') == 'false') {
						sessionStorage.setItem('modSkipWarn', 'true');
						pi._tool.log(lang.warn.confirmSkip, 'warn chat');
					} else {
						sessionStorage.setItem('modSkipWarn', 'false');
						API.moderateForceSkip();
					}
				},
				hideStream: function() {
					if (settings.showVideo) {
						if (pi._tool.getPlugSettings().videoOnly) {
							pi.dom.playback.style.height = window.innerHeight - 185+'px';
							$(pi.dom.stream).css({visibility:'visible', height:'100%'});
						} else {
							pi.dom.playback.style.height = '271px';
							$(pi.dom.stream).css({visibility:'visible', height:'281px'});
						}

						if (API.hasPermission(null,API.ROLE.BOUNCER)) {
							$([pi.dom.rmvDJ, pi.dom.skip]).css('top', '281px');
						}
						$('#playback-controls, #no-dj').css('visibility', 'visible');
					} else {
						pi.dom.playback.style.height = '0px';
						$(pi.dom.stream).css({visibility:'hidden', height:'0'});
						if (API.hasPermission(null,API.ROLE.BOUNCER)) {
							$([pi.dom.rmvDJ, pi.dom.skip]).css('top', '0');
						}
						$('#playback-controls, #no-dj').css('visibility', 'hidden');
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
						case 'autoHideLogs':
							settings.autoHideLogs = !settings.autoHideLogs;
							pi.dom.autoHideLogs.className = settings.autoHideLogs ? 'pi-on' : 'pi-off';
						break;
						case 'mutemeh':
							settings.betterMeh = !settings.betterMeh;
							pi.dom.betterMeh.className =settings.betterMeh ? 'pi-on' : 'pi-off';
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
						case 'skipNextMediaInHistory':
							settings.skipNextMediaInHistory = !settings.skipNextMediaInHistory;
							pi.dom.skipNextMediaInHistory.className = settings.skipNextMediaInHistory ? 'pi-on' : 'pi-off';
						break;
						case 'video':
							settings.showVideo = !settings.showVideo;
							pi.dom.video.className = settings.showVideo ? 'pi-off' : 'pi-on';
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
						case 'customRanks':
							settings.customRanks = !settings.customRanks;
							pi.dom.customRanks.className = settings.customRanks ? 'pi-on' : 'pi-off';
							pi.toggleStyle('customRanks');
						break;
						case 'languageFlags':
							settings.languageFlags = !settings.languageFlags;
							pi.dom.languageFlags.className = settings.languageFlags ? 'pi-on' : 'pi-off';
							settings.languageFlags ? $('.un ~ .pi-languageFlags').show() : $('.un ~ .pi-languageFlags').hide();
						break;
						case 'friendsIcons':
							settings.friendsIcons = !settings.friendsIcons;
							pi.dom.friendsIcons.className = settings.friendsIcons ? 'pi-on' : 'pi-off';
							settings.friendsIcons ? $('.un ~ .pi-friendsIcons').show() : $('.un ~ .pi-friendsIcons').hide();
						break;
						case 'bg':
							pi._tool.modal(true, 'custom-bg');
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
						case 'small-friends':
							settings.smallFriends = !settings.smallFriends;
							pi.dom.smallFriends.className = settings.smallFriends ? 'pi-on' : 'pi-off';
							pi.toggleStyle('smallFriends');
						break;
						case 'small-playlists':
							settings.smallPlaylists = !settings.smallPlaylists;
							pi.dom.smallPlaylists.className = settings.smallPlaylists ? 'pi-on' : 'pi-off';
							pi.toggleStyle('smallPlaylists');
						break;
						case 'showDeletedMsg':
							settings.showDeletedMsg = !settings.showDeletedMsg;
							pi.dom.showDeletedMsg.className = settings.showDeletedMsg ? 'pi-on' : 'pi-off';
							if (settings.showDeletedMsg) $('.cm.deleted').show();
							else $('.cm.deleted').hide();
						break;
						case 'confirmDelete':
							settings.confirmDelete = !settings.confirmDelete;
							pi.dom.confirmDelete.className = settings.confirmDelete ? 'pi-on' : 'pi-off';
						break;
						case 'userInfo':
							settings.userInfo = !settings.userInfo;
							pi.dom.userInfo.className = settings.userInfo ? 'pi-on' : 'pi-off';
							settings.userInfo ? $('.un ~ .userInfo').show() : $('.un ~ .userInfo').hide();
						break;
						case 'stuckSkip':
							settings.stuckSkip = !settings.stuckSkip;
							pi.dom.stuckSkip.className = settings.stuckSkip ? 'pi-on' : 'pi-off';
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
						case 'songStats':
							settings.songStats = !settings.songStats;
							pi.dom.songStats.className = settings.songStats ? 'pi-on' : 'pi-off';
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
						case 'userLevelUp':
							settings.userLevelUp = !settings.userLevelUp;
							pi.dom.userLevelUp.className = settings.userLevelUp ? 'pi-on' : 'pi-off';
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
							pi.dom.autoHideLogs.className = settings.autoHideLogs ? 'pi-on' : 'pi-off';
							pi.dom.betterMeh.className =settings.betterMeh ? 'pi-on' : 'pi-off';
							pi.dom.afkResponder.className = settings.afk ? 'pi-on' : 'pi-off';
							pi.dom.afkMessage.children[0].value = settings.afkMessage;
							pi.afk();
							pi.dom.navWarn.className = settings.navWarn ? 'pi-on' : 'pi-off';
							pi.dom.showVotes.className = settings.showVotes ? 'pi-on' : 'pi-off';
							pi.dom.betterClearChatLimit.children[0].value = settings.betterClearChatLimit;
							pi.dom.chatLimit.children[0].value = settings.chatLimit;
							pi.dom.skipNextMediaInHistory.className = settings.skipNextMediaInHistory ? 'pi-on' : 'pi-off';
							// Customisation
							pi.dom.video.className = settings.showVideo ? 'pi-off' : 'pi-on';
							pi.hideStream();
							pi.dom.soundcloudVisu.className = settings.scVisu ? 'pi-on' : 'pi-off';
							pi.dom.css.className = settings.CSS ? 'pi-on' : 'pi-off';
							pi.toggleStyle('customStyle');
							pi.dom.customRanks.className = settings.customRanks ? 'pi-on' : 'pi-off';
							pi.toggleStyle('customRanks');
							pi.dom.languageFlags.className = settings.languageFlags ? 'pi-on' : 'pi-off';
							pi.dom.friendsIcons.className = settings.friendsIcons ? 'pi-on' : 'pi-off';
							settings.customBGURL !== null ? pi.changeBG(false, settings.customBGURL) : void 0;
							pi.dom.oldChat.className = settings.oldChat ? 'pi-on' : 'pi-off';
							pi.toggleStyle('oldChat');
							pi.dom.oldFooter.className = settings.oldFooter ? 'pi-on' : 'pi-off';
							pi.toggleStyle('oldFooter');
							pi.dom.smallHistory.className = settings.smallHistory ? 'pi-on' : 'pi-off';
							pi.toggleStyle('smallHistory');
							pi.dom.smallFriends.className = settings.smallFriends ? 'pi-on' : 'pi-off';
							pi.toggleStyle('smallFriends');
							pi.dom.smallPlaylists.className = settings.smallPlaylists ? 'pi-on' : 'pi-off';
							pi.toggleStyle('smallPlaylists');
							// Moderation
							pi.dom.showDeletedMsg.className = settings.showDeletedMsg ? 'pi-on' : 'pi-off';
							pi.dom.confirmDelete.className = settings.confirmDelete ? 'pi-on' : 'pi-off';
							pi.dom.userInfo.className = settings.userInfo ? 'pi-on' : 'pi-off';
							pi.dom.stuckSkip.className = settings.stuckSkip ? 'pi-on' : 'pi-off';
							pi.dom.lengthA.className = settings.songLimit ? 'pi-on' : 'pi-off';
							pi.dom.songLength.children[0].value = settings.songLength;
							pi.dom.historyAlert.className = settings.historyAlert ? 'pi-on' : 'pi-off';
							// Notifications
							pi.dom.systemNotifications.className = settings.systemNotifications ? 'pi-on' : 'pi-off';
							pi.dom.songStats.className = settings.songStats ? 'pi-on' : 'pi-off';
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
							pi.dom.gainNotificationMinXP.children[1].value = settings.minimumGain.xp;
							pi.dom.gainNotificationMinPP.children[1].value = settings.minimumGain.pp;
							pi.dom.userLevelUp.className = settings.userLevelUp ? 'pi-on' : 'pi-off';
						break;

						case 'off':
							pi._tool.saveSettings();
							pi._close();
						break;

						default:
							pi._tool.log('Unrecognized menu string: '+choice, 'console error');
						break;
					}

					if (choice !== 'off') pi._tool.saveSettings();
				},
				muteMeh: function() {
					let vol = API.getVolume();

					function restoreVol() {
						API.setVolume(vol);

						// Turning the event off for BOTH
						// as we don't know which is called first
						API.off(API.ADVANCE, restoreVol);
						$('#woot').off('click', restoreVol);

						// Listen for meh again
						$('#meh').one('click', mute);
					}
					function mute() {
						// Meh is disabled, do not change volume
						if (!$('#meh').hasClass('disabled')) {
							vol = API.getVolume();
							API.setVolume(0);
							API.once(API.ADVANCE, restoreVol);
							$('#woot').one('click', restoreVol);
						}
					}

					if (settings.betterMeh) $('#meh').one('click', mute);
					else $('#meh').off('click', mute);
				},
				removeDJ: function() {
					if (sessionStorage.getItem('modQuitWarn') == 'false') {
						sessionStorage.setItem('modQuitWarn', 'true');
						pi._tool.log(lang.warn.confirmEject, 'warn chat');
					} else {
						sessionStorage.setItem('modQuitWarn', 'false');
						API.moderateForceQuit();
					}
				},
				songLimit: function() {
					if (settings.songLimit) {
						if (API.getMedia() !== undefined) {
							if (API.getMedia().duration > settings.songLength) {
								// notif.play();
								pi._tool.log(pi._tool.replaceString(lang.warn.songLimit, {max:settings.songLength}), 'warn chat');
							}
						}
					}
				},
				soundcloudVisu: function(media) {
					let $scFrame = $('#sc-frame');
					let $myFrame = $('#pi-frame');

					if (typeof media === "undefined") media = API.getMedia();

					if (media.format === 1 && $('#pi-frame').is(':visible')) {
						return $myFrame.hide();
					} else if (media.format === 1) {
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
								pi.changeBG(false, settings.customBGURL !== null ? settings.customBGURL : url.images.background);
							} else {
								$('#pi-CSS').remove();
								pi.changeBG(true);
							}
						break;

						case 'customRanks':
							if (settings.customRanks) {
								$('head').append($('<link id="pi-custom_ranks" rel="stylesheet" type="text/css" href="'+url.styles.custom_ranks+'">'));
							} else {
								$('#pi-custom_ranks').remove();
							}
						break;

						case 'oldChat':
							if (settings.oldChat) {
								$('head').append($('<link id="pi-oldchat-CSS" rel="stylesheet" type="text/css" href="'+url.styles.old_chat+'">'));
							} else {
								$('#pi-oldchat-CSS').remove();
							}

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

						case 'smallFriends':
							if (settings.smallFriends) {
								$('head').append($('<link id="pi-smallFriends-CSS" rel="stylesheet" type="text/css" href="'+url.styles.small_friends+'">'));
							} else {
								$('#pi-smallFriends-CSS').remove();
							}
						break;

						case 'smallPlaylists':
							if (settings.smallPlaylists) {
								$('head').append($('<link id="pi-smallPlaylists-CSS" rel="stylesheet" type="text/css" href="'+url.styles.small_playlists+'">'));
							} else {
								$('#pi-smallPlaylists-CSS').remove();
							}
						break;
					}
				},
				voteAlert: function(data) {
					let userInfo = (settings.userInfo ? ' Lvl:'+data.user.level+'|'+'Id:'+data.user.id : '');
					if (typeof data.vote == 'undefined' && data.user.grab && settings.userGrab) {
						pi._tool.log(
							pi._tool.replaceString(lang.log.grabbed, {
								user: data.user.username,
								"userInfo": userInfo
							}), 'chat'
						);
					} else if (data.vote == 1 && !data.user.grab && settings.userWoot) {
						pi._tool.log(
							pi._tool.replaceString(lang.log.wooted, {
								user: data.user.username,
								"userInfo": userInfo
							}), 'chat'
						);
					} else if (data.vote == -1 && settings.userMeh && pi._tool.getRoomRules('allowShowingMehs')) {
						pi._tool.log(
							pi._tool.replaceString(lang.log.meh, {
								user: data.user.username,
								"userInfo": userInfo
							}), 'chat'
						);
					}
				}
			};

			pi._load();
		}
	}
	else {
		var waitForARoom = function() {
			if (location.pathname === '/dashboard' && location.origin.indexOf('plug') !== -1)
				setTimeout(function() {waitForARoom();}, 1000);
			else load();
		}

		try {
			// If not on plug, this will fail
			API.enabled;
			// else, will wait for user to go in a room
			waitForARoom();
		} catch(err) {
			console.log('You are trying to run Plug-It outside of plug.dj !');
			console.log(err);
		}
	}
})();

// Placed outside of closure to ensure eval can't access private vars
function execute(code, log, executeWarn) {
	if (sessionStorage.getItem('trustWarn') == 'false') {
		sessionStorage.setItem('trustWarn', 'true');
		pi._tool.log(executeWarn, 'warn chat', function() { execute(code, this); this.delete(); });
	} else {
		try {
			eval(code);
			if (typeof log !== 'undefined') log.delete();
		} catch(err) {
			pi._tool.log(err.toString(), 'error chat');
			// put code back so user can try again
			setTimeout(function(){
				$('#chat-input-field')[0].value = '/js ' + code;
			}, 250);
		}
	}
}
