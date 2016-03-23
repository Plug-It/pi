/*! Copyright (c) 2016 Plug-It <contact.wibla@gmail.com>
 * Licensed under the GNU License (LICENSE.txt).
 */
 
(function(){
if (typeof pi !== 'undefined') pi.reload();
else preLoad();

function preLoad() {
  // Status (can be used to debug)
  $('.app-header').after(
    $('<div id="pi-status">\
        <img height="16px" src="https://www.raspberrypi.org/wp-content/uploads/2015/08/raspberry-pi-logo.png">\
        <span></span>\
      </div>').css({
      position: "absolute",
      top: "65px", left: "15px",
      padding: "5px",
      color: "#DDD",
      background: "#181C21",
      borderRadius: "5px",
      boxShadow: "0 0 3px #000",
      transition: "all .25s ease-in-out"
    })
  );
  var updateStatus = function(txt, status) {
    $("#pi-status span").innerText = "Pi is loading..<br>"+txt+"<br>Status: "+status;
  }
  
  // Load user language
  updateStatus("Loading user language", 1);
  var xhr = new XMLHttpRequest(), lang;
  xhr.onreadystatechange = function(){
    if (xhr.readyState == 4 && xhr.status == 200) {
      window.lang = JSON.parse(xhr.responseText);
      window.complete = function(txt) {
        txt = txt.split(" ");
        for (var i = 0; i < txt.length; i++) {
          if (txt[i].charAt(0) == "$") {
            switch(txt[i]) {
              case "$version": txt[i] = json.V; break;
              default: console.log(lang.error.unknowVariable);
            }
          }
        }
        return txt.join(" ");
      }
    }
  };
  switch (API.getUser().language) {
    case "en": lang = "en"; break;
    case "fr": lang = "fr"; break;
    default: lang = "en"; break;
  }
  xhr.open('GET', 'https://rawgit.com/WiBla/Script/master/lang/'+lang+'.json', true);
  xhr.send();
  
  // Retrieve user settings if available
  updateStatus("Loading user settings", 2);
  var ls = localStorage.getItem('pi-settings');
  var settings = {
    autoW: false,
    autoDJ: false,
    showVideo: true,
    CSS: 0,
    oldChat: false,
    durationAlert: false,
    woot: false,
    meh: false,
    grab: false,
    bg: "",
    betterMeh: false,
    navWarn: false,
    security: false,
    afk: false,
    time: 480,
  };
  if (ls) {
    // Making sure user settings are up to date
    var usrSettings = JSON.parse(ls);
    for (var obj in settings) {
      if (!usrSettings[obj]) {
        usrSettings[obj] = settings[obj];
      }
    }
  }
  localStorage.setItem("pi-settings", JSON.stringify(settings));

  // Get Plug + Script ranks
  updateStatus("Fetching script ranks", 1);
  var xhr = new XMLHttpRequest(), ranks;
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4 && xhr.status == 200) {
      ranks = JSON.parse(xhr.responseText);
    }
  }
  xhr.open('GET', 'https://rawgit.com/WiBla/Script/master/ressources/ranks.json', true);
  xhr.send();
  var getRank = function(isRank, id) {
    arguments.length = 0 ? id = API.getUser().id : void(0);
    if (typeof isRank == "number") {
      id = isRank; isRank = undefined;
    }
    var result = [], user = API.getUser(id);
    // Plug ranks
    switch (user.role) {
      // I ommit 'break;' on purpose to inherit
      case 10:result.push("Admin");
      case 7: result.push("Brand Ambassador");
      case 5: result.push("Host");
      case 4: result.push("Co-Host");
      case 3: result.push("Manager");
      case 2: result.push("Bouncer");
      case 1: result.push("Resident DJ");
      case 0: result.push("User"); break;
      default: console.error("[Plug-It] Unexpected error");
    }
    // Script ranks
    for (var rank in ranks) {
      for (var users in ranks[rank]) {
        if (id == ranks[rank][users]) result.push(rank);
      }
    }
    // HasPerm
    if (typeof isRank !== "undefined") {
      for (var ranks in result) {
        if (result[ranks] == isRank) return true;
      }
      return false;
    }
    else return result;
  }
}

window.pi = {
// ╔══════════════════╗
// ║    VARIABLES     ║
// ╚══════════════════╝
version: '1.0.0',
url: {
  script: "https://rawgit.com/WiBla/Script/master/ressources/wibla.js",
  menu_css: "https://rawgit.com/WiBla/Script/master/ressources/menu.css",
  old_chat: "https://rawgit.com/WiBla/Script/master/ressources/old-chat.css",
  blue_css: "https://rawgit.com/WiBla/Script/master/ressources/blue.css",
  notif: "https://raw.githubusercontent.com/WiBla/Script/master/ressources/notif.wav",
},
// ╔══════════════════╗
// ║    FUNCTIONS     ║
// ╚══════════════════╝
/* New functions */
tooltip: function(set, direction, x,y, txt) {
  if (set) {
    var tooltip = $('<div id="tooltip" class="'+direction+'" style="top: '+y+'px; left: '+x+'px;"><span>'+txt+'</span><div class="corner"></div></div>');
    $("body").append(tooltip);
  }
  else if (!set) {
    $("#tooltip").remove();
  }
}
getPlugSettings: function(id) {
  if (typeof id == "undefined") id = API.getUser().id;
  var json = JSON.parse(localStorage.getItem("settings"));
  for (var i = 1; i < 20; i++) {
    if (typeof json[i][id] !== "undefined") return json[i][id];
  }
};
setPlugSettings: function(option, value) {
  var xhr = new XMLHttpRequest();
  xhr.open("PUT", "https://stg.plug.dj/_/users/settings", true);
  xhr.send({option:value});
};
/* Old fucntions */
menu: function(choice) {
  choice += "";
  switch(choice) {
    case "0":
      json.showMenu = !json.showMenu;
      slide();
    break;
    case "1":
      json.autoW = !json.autoW;
      autowoot();
    break;
    
    case "2":
      json.autoDJ = !json.autoDJ;
      autojoin();
    break;

    case "3":
      json.showVideo = !json.showVideo;
      hideStream();
    break;

    case "4":
      if (json.CSS >= 3) json.CSS = 1; else json.CSS++;
      design();
    break;
    
    case "5":
      askBG();
    break;
    
    case "6":
      json.oldChat = !json.oldChat;
      oldChat();
    break;

    case "7":
      json.alertDuration = !json.alertDuration;
      alertDuration();
    break;

    case "8":
      json.meh = !json.meh;
      voteAlert();
    break;

    case "9":
      json.betterMeh = !json.betterMeh;
      muteMeh();
    break;
    
    case "11":
      json.navWarn = !json.navWarn;
    break;

    default:
      console.log(lang.info.menuOptions);
  }

  localStorage.setItem("pi-settings", JSON.stringify(json));
}
autowoot: function() {
  if (json.autoW === true && !$("#meh.selected")[0]) {
    $("#woot")[0].click();
    item.woot.className = "pi-on";
  } else {
    item.woot.className = "pi-off";
  }
}
autojoin: function() {
  var dj = API.getDJ();
  if (json.autoDJ) {
    item.join.className = "pi-on";
    if (dj !== undefined) {
      if (dj.id !== API.getUser().id && API.getWaitListPosition() === -1) {
        switch (API.djJoin()) {
          case 1:
            API.chatLog(lang.error.autoJoin1);
          break;
          case 2:
            API.chatLog(lang.error.autoJoin2);
          break;
          case 3:
            API.chatLog(lang.error.autoJoin3);
          break;
        }
      }
    } else {
      API.djJoin();
    }
  } else {
    item.join.className = "pi-off";
  }
}
hideStream: function() {
  if (json.showVideo) {
    item.stream.style.visibility = "visible";
    item.stream.style.height = "281px";
    if (hasPermBouncer) {
      item.rmvDJ.style.top = item.skip.style.top = "283px";
    }
    $("#playback-controls")[0].style.visibility = "visible";
    $("#no-dj")[0].style.visibility = "visible";
    item.video.className = "pi-off";
  } else {
    item.stream.style.visibility = "hidden";
    item.stream.style.height = "0";
    if (hasPermBouncer) {
      item.rmvDJ.style.top = item.skip.style.top = "0";
    }
    $("#playback-controls")[0].style.visibility = "hidden";
    $("#no-dj")[0].style.visibility = "hidden";
    item.video.className = "pi-on";
  }
  localStorage.setItem("pi-settings",JSON.stringify(json));
}
design: function() {
  if (json.bg == "reset") askBG();
  switch(json.CSS) {
    case 1:
      item.style.setAttribute("href", '');
      json.bg = "default"; askBG();
      item.css.className = "pi-off";
      break;
    case 2:
      item.style.setAttribute("href", blue_css);
      json.bg = "reset"; askBG();
      item.css.className = "pi-on";
      break;
    case 3:
      item.style.setAttribute("href", purple_css);
      json.bg = "https://rawgit.com/WiBla/Script/master/images/background/1.png"; changeBG();
  }
  localStorage.setItem("pi-settings",JSON.stringify(json));
}
oldChat: function() {
  if (json.oldChat) {
    item.oldChat.className = "pi-on";
    item.oldStyle.setAttribute("href", old_chat);
  } else {
    item.oldChat.className = "pi-off";
    item.oldStyle.setAttribute("href", "");
  }
}
askBG: function() {
  style = $(".room-background")[0].getAttribute("style").split(" ");
  if (typeof(plugBG) == "undefined") {
    window.plugBG = style[9];
  }
  switch (json.bg) {
    case "reset":
      json.bg = "https://raw.githubusercontent.com/WiBla/Script/master/images/background/default/FEDMC.jpg";
      changeBG();
    break;
    case "default":
      json.bg = plugBG;
      changeBG(true);
    break;
    default:
      json.bg = prompt(lang.log.bgPrompt);
      if (json.bg !== null && json.bg.length > 0) {
        if (json.bg == "reset" || json.bg == "default") {
          askBG();
        } else {
          changeBG();
        }
      }
    break;
  }
}
changeBG: function(isDefault) {
  if (isDefault) {
    $(".room-background")[0].style.background = plugBG + " no-repeat";
    if ($("i.torch")[0] !== undefined) {
      $("i.torch")[0].style.display = "block";
      $("i.torch.right")[0].style.display = "block";
    }
    item.bg.className = "pi-off";
  } else {
    $(".room-background")[0].style.background = "url(" + json.bg + ") no-repeat";
    item.bg.className = "pi-on";
    if ($("i.torch")[0] !== undefined) {
      $("i.torch")[0].style.display = "none";
      $("i.torch.right")[0].style.display = "none";
    }
    localStorage.setItem("pi-settings",JSON.stringify(json));
  }
}
alertDuration: function() {
  if (json.alertDuration) {
    item.lengthA.className = "pi-on";
    if (API.getMedia() !== undefined) {
      if (API.getMedia().duration > json.time) {
        notif.play();
        API.chatLog(lang.warn.songLimit);
      }
    }
  } else {
    item.lengthA.className = "pi-off";
  }
}
muteMeh: function() {
  if (json.betterMeh) {
    $("#meh")[0].setAttribute("onclick", "vol=API.getVolume();API.setVolume(0);");
    $("#woot")[0].setAttribute("onclick", "if(API.getVolume()===0){API.setVolume(vol)};");
    item.betterMeh.className = "pi-on";
  } else {
    $("#meh")[0].setAttribute("onclick", "");
    $("#woot")[0].setAttribute("onclick", "");
    item.betterMeh.className = "pi-off";
  }
}
afk: function(msg) {
  if (json.afk) {
    if (msg !== undefined) {
      API.sendChat('/me is AFK: "' + msg + '".');
      json.afk = false;
    } else {
      API.sendChat("/me is back.");
    }
  } else {
    if (msg !== undefined) {
      API.sendChat('/me is AFK: "' + msg + '".');
    } else {
      API.sendChat("/me is AFK.");
    }
  }
  json.afk = !json.afk;
}
voteAlert: function(data) {
  //visual stuff
  if (json.meh === true) {
    item.mehA.className = "pi-on";
  } else {
    item.mehA.className = "pi-off";
  }
  //notifications
  if (data !== undefined) {
    if (data.vote == 1 && json.woot === true) {
      API.chatLog(data.user.username + lang.log.wooted);
    } else if (data.vote == -1 && json.meh === true) {
      API.chatLog(data.user.username + lang.log.meh);
    }
  }
}
reload: function() {
  API.chatLog(lang.log.reloading);
  menu(10);
  $.getScript("https://rawgit.com/WiBla/Script/master/ressources/WiBla.js");
}
slide: function() {
  var show = json.showMenu,
    menu = $("#Settings")[0];
  if (show === false) {
    menu.style.visibility = "hidden";
    menu.style.zIndex = "0";
    menu.style.right = "200px";
  } else if (show === true) {
    menu.style.visibility = "visible";
    menu.style.zIndex = "2";
    menu.style.right = "345px";
  }
}
forceSkip: function() {
  if (json.security === false) {
    json.security = true;
    API.chatLog(":warning: "  + lang.warn.confirmSkip);
  } else {
    json.security = false;
    API.moderateForceSkip();
  }
}
removeDJ: function() {
  if (json.security === false) {
    json.security = true;
    API.chatLog(":warning: "  + lang.warn.confirmEject);
  } else {
    json.security = false;
    API.moderateForceQuit();
  }
}
execute: function(code) {
  try {eval(code);} catch(err) {API.chatLog(err+"");}
}
chatCommand: function(commande) {
  var args = commande.split(" "), msg = [];
  for (var i = 1; i < args.length; i++) {
    msg.push(args[i]);
  }
  msg = msg.join(" ");
  
  switch (args[0]) {
    case "/like":
      API.sendChat(":heart_eyes::heartpulse::heart_eyes::heartpulse::heart_eyes:");
    break;
    
    case "/love":
      if (args[1] === undefined) {
        API.sendChat(":heart_eyes::heartpulse::heart_eyes::heartpulse::heart_eyes::heartpulse::heart_eyes::heartpulse::heart_eyes::heartpulse:");
      } else {
        API.sendChat(msg + " :heart_eyes::heartpulse::heart_eyes::heartpulse::heart_eyes::heartpulse::heart_eyes::heartpulse::heart_eyes::heartpulse:");
      }
    break;
    
    case "/eta":
      if (API.getUser().id == API.getDJ().id) {
        API.chatLog(lang.info.youPlay);
      } else if (API.getWaitListPosition() == -1) {
        API.chatLog(lang.info.notInWaitList);
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
          API.chatLog(etaH + "H" + etaM + lang.log.etaH);
        } else {
          API.chatLog(eta + " " + lang.log.etaM);
        }
      }
    break;
    
    case "/vol":
      if (args[1] >= 0 && args[1] <= 100) {
        API.setVolume(args[1]);
      } else {
        API.chatLog(lang.info.helpVol);
      }
    break;
    
    case "/afk":
      if (msg.length === 0) msg = undefined;
      else window.afkMessage = msg;
      afk(msg);
    break;
    
    /* Experimental
    case "/bot":
      if (args[1] === undefined) {
        API.chatLog("Write either the pseudo or the id of the bot in your room after /bot");
      } else {
        args[1] = args[1].substr(1);
        json.bot = API.getUser(args[1]);
        localStorage.setItem("pi-settings",JSON.stringify(json));
      }
    break;*/
    
    case "/whoami":
      var me = API.getUser();
      API.chatLog("Username: " + me.username);
      API.chatLog("ID: " + me.id);
      API.chatLog("Description: " + me.blurb);
      API.chatLog("Avatar: " + me.avatarID);
      API.chatLog("Badge: " + me.badge);
      API.chatLog("Lvl: " + me.level);
      API.chatLog("XP: " + me.xp);
      API.chatLog("PP: " + me.pp);
    break;
    
    case "/ws":
      API.sendChat("WiBla-Script: http://wibla.free.fr/plug/script/");
    break;

    case "/js":
      execute(msg);
    break;

    /*case "/ban":
    break;*/
    
    case "/list":
      API.chatLog("/like <3 x 5");
      API.chatLog("/love [@user]");
      API.chatLog("/eta");
      API.chatLog("/vol [0-100]");
      API.chatLog("/afk [message]");
      API.chatLog("/whoami");
      API.chatLog("/ws");
      API.chatLog("/js [javaScript code]");
      API.chatLog("/reload");
      API.chatLog("/kill");
      API.chatLog("/list");
    break;
    
    case "/reload":
      reload();
    break;
    
    case "/kill":
      menu(10);
    break;
  }
}
/* Core */
init: function(unload) {
  if (typeof unload == "undefined") {
    // API initalization
    API.on(API.ADVANCE, function(){
      pi.autowoot();
      pi.autojoin();
      pi.alertDuration();
      settings.security = false;
    });
    API.on(API.VOTE_UPDATE, pi.voteAlert);
    API.on(API.CHAT_COMMAND, pi.chatCommand);
    // API addition
    API.moderateForceQuit = function() {
      var xhr = new XMLHttpRequest();
      xhr.open("DELETE", location.origin+"/_/booth/remove/"+API.getDJ().id, true);
      xhr.send();
    };
    // #### [Events listener] ####
    // Navigation warning
    window.onbeforeunload = function() {
      if (settings.navWarn) return lang.warn.quit;
    };
    // Keyboard shorcuts
    $(window).on("keydown", function(k) {
      if (k.keyCode == 107 && !$($("#chat-input")).attr("class")) {
        API.setVolume(API.getVolume()+5);
      } else if (k.keyCode == 109 && !$($("#chat-input")).attr("class")) {
        API.setVolume(API.getVolume()-5);
      }
    });
    // ScrollWheel volume changer
    $("#volume").on("mousewheel", function(e){
      if (e.originalEvent.deltaY > 0) API.setVolume(API.getVolume()-5);
      else API.setVolume(API.getVolume()+5);
    });
    $("#now-playing-media").on("mouseenter", function(){
      if (pi.getPlugSettings().tooltips) pi.tooltip(true, "left", $('#now-playing-bar').css("Left").replace("px",""),0, this.innerText);
    });
    $("#now-playing-media").on("mouseleave", function(){pi.tooltip(false);});

    /* on room change
    $(window).bind("click", function() {
      if (window.roomName === undefined) {
        window.roomName = location.href;
      } else if (location.href !== window.roomName) {
        API.chatLog("Your room changed");
        window.roomName = location.href;
        reload();
      }
    });*/
    // show percentage in level bar
    window.levelBarInfo = setInterval((function() {
      var xp = $("#footer-user .info .meta .bar .value")[0].innerHTML,
        elements = xp.split(" ");

      if (elements.length == 3) {
        var toAdd = $("#footer-user .info .progress")[0].style.width;
        $("#footer-user .info .meta .bar .value")[0].innerHTML = xp + " " + toAdd;
      }
      if ($("#the-user-profile .experience.section .xp .value")[0]) {
        var xp2 = $("#the-user-profile .experience.section .xp .value")[0].innerHTML,
          elements2 = xp2.split(" ");
          if (elements2.length == 3) {
            var toAdd2 = $("#the-user-profile .experience.section .progress")[0].style.width;
            $("#the-user-profile .experience.section .xp .value")[0].innerHTML = xp2 + " " + toAdd2;
          }
      }
    }), 1000);

    // Creating DOM elements
    // Menu icon
    $("#app").append($('<div id="Box"><div id="icon"></div></div>'););
    // Menu itself
    $("#app").append($('<div id="Settings">\
      <ul>\
        <li id="pi-woot">'+lang.menu.aw+'</li>\
        <li id="pi-join">'+lang.menu.aj+'</li>\
        <li id="pi-video">'+lang.menu.hv+'</li>\
        <li id="pi-css">'+lang.menu.cs+'</li>\
        <li id="pi-bg">'+lang.menu.cb+'</li>\
        <li id="pi-old-chat">'+lang.menu.oc+'</li>\
        <li id="pi-lengthA">'+lang.menu.sl+'</li>\
        <li id="pi-mehA">'+lang.menu.sm+'</li>\
        <li id="pi-mutemeh">'+lang.menu.mm+'</li>\
        <li id="pi-navWarn">'+lang.menu.nw+'</li>\
        <li id="pi-off">'+lang.menu.s+'</li>\
        <li id="pi-twitter"><a href="https://twitter.com/WiBla7" target="blank">@WiBla7</a></li>\
        <li id="pi-V">'+ pi.version +'</li>\
      </ul>\
    </div>';));
    // Menu css
    $("head").append($('<link id="WiBla-menu-CSS" rel="stylesheet" type="text/css" href="'+menu_css+'">'));
    // General css
    $("head").append($('<link id="WiBla-CSS\" rel="stylesheet\" type="text/css" href="">'));
    // Old chat css
    $("head").append($('<link id="WiBla-Old-Chat-CSS" rel="stylesheet" type="text/css" href="">'););
    // DelChat icon
    $("#chat-header").append('<div id="del-chat-button" class="chat-header-button">\
      <i class="icon pi-delChat" onclick="API.sendChat(\'/clear\')"></i>\
    </div>');
    // If at least bouncer
    if (getRank("Bouncer")) {
      // Moderation tools
      $("#playback-container").append($('<div id="pi-rmvDJ" onclick="removeDJ()">\
        <img src="https://raw.githubusercontent.com/WiBla/Script/master/images/other/romveDJ.png" alt="button remove from wait-list" />\
      </div>\
      <div id="pi-skip" onclick="forceSkip();">\
        <img src="https://raw.githubusercontent.com/WiBla/Script/master/images/other/skip.png" alt="button skip" />\
      </div>'));
    }

    // Fully loaded
    API.chatLog("Plug-It " + pi.version + " loaded !");
    API.chatLog(lang.log.help);
    $('#pi-status').css({opacity:"0"});
    setTimeout(function(){$('#pi-status').remove();}, 250);
  } else {
    // Preventing making the video definitly desapear
    if (json.showVideo === false) {
      menu(3);
      setTimeout(menu(10), 250);
    } else {
      API.off(API.CHAT_COMMAND, chatCommand);
      API.off(API.ADVANCE, alertDuration);
      API.off(API.VOTE_UPDATE, voteAlert);
      API.off(API.ADVANCE, autowoot);
      API.off(API.ADVANCE, autojoin);
      delete API.moderateForceQuit;
      window.onbeforeunload = null;
      $(window).off("keydown");
      $("#volume").off("mousewheel");
      clearInterval(levelBarInfo);
      item.box.remove();
      item.settings.remove();
      $("#WiBla-menu-CSS")[0].remove();
      item.style.remove();
      item.oldStyle.remove();
      $("#del-chat-button")[0].remove();
      if (hasPermBouncer) {
        item.rmvDJ.remove();
        item.skip.remove();
      }
    }

    // Removing DOM elements
    // Menu icon
    $("#Box").remove();
    // Menu itself
    $("#Settings").remove();
    // Menu css
    $("#WiBla-menu-CSS").remove();
    // General css
    $("#WiBla-CSS").remove();
    // Old chat css
    $("#WiBla-Old-Chat-CSS").remove();
    // DelChat icon
    $("#del-chat-button").remove();
    // If at least bouncer
    if (getRank("Bouncer")) {
      // Moderation tools
      $("#pi-rmvDJ").remove();
      $("#pi-skip").remove();
    }

    return "unloaded";
  }
},
reload: function() {
  if (pi.kill() == "killed") $.getScript(scriptURL);
  else console.error("[Plug-It] Couldn't kill script");
},
kill: function() {
  if (pi.init(true) == "unloaded") {
    window.scriptURL = pi.url.script; // Allow to reload
    pi = undefined;
    return "killed";
  }
  else console.error("[Plug-It] Couldn't unload script");
}};
// end of 'pi' declaration
pi.init();
})();
