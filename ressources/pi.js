/*! Copyright (c) 2016 Plug-It <contact.wibla@gmail.com>
 * Licensed under the GNU License (LICENSE.txt).
 */
 
(function(){
if (typeof pi !== 'undefined') pi.reload();
else {
  // Status (can be used to debug)
  $('.app-header').after(
    $('<div id="pi-status">\
      <img height="" src="">\
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
  window.updateStatus = function(txt, status) {
    $("#pi-status span")[0].innerHTML = "Pi is loading..<br>"+txt+"<br>Status: "+status;
  };
  
  // Get last commit of any project, used to know if an update is available
  function getLastCommit(url, callback) {
    var xhr = new XMLHttpRequest;
    xhr.open('GET', url);
    xhr.onload = callback;
    xhr.send();
  }
  getLastCommit("https://api.github.com/repos/Plug-It/pi/commits/pre-release", function(data){window.thisCommit = JSON.parse(data.currentTarget.responseText);});

  // Load user language
  updateStatus("Loading user language", 1);
  var xhr = new XMLHttpRequest(), lang;
  xhr.onreadystatechange = function(){
    if (xhr.readyState == 4 && xhr.status == 200) {
      lang = JSON.parse(xhr.responseText);
      window.complete = function(txt) {
        txt = txt.split(" ");
        for (var i = 0; i < txt.length; i++) {
          if (txt[i].charAt(0) == "$") {
            switch(txt[i]) {
              case "$version": txt[i] = pi.version; break;
              case "$dj": txt[i] = API.getDJ().rawun; break;
              case "$historyDj": txt[i] = arguments[1]; break;
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
  xhr.open('GET', 'https://rawgit.com/Plug-It/pi/pre-release/lang/'+lang+'.json', true);
  xhr.send();
  
  // Retrieve user settings if available
  updateStatus("Loading user settings", 2);
  var ls = localStorage.getItem('pi-settings');
  var settings = {
    // General
    autoW: false,
    autoDJ: false,
    betterMeh: false,
    navWarn: false,
    afk: false,
    // Customisation
    showVideo: true,
    CSS: false,
    oldChat: false,
    bg: "",
    // Moderation
    durationAlert: false,
    time: 480,
    historyAlert: false,
    // Notifications
    userWoot: false,
    userMeh: false,
    userGrab: false,
    userJoin: false,
    userLeft: false,
    // Miscellaneous
    security: false // can be removed by using sessionStorage
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

  // Get Plug & Script ranks
  updateStatus("Fetching script ranks", 3);
  // I use different xhr to avoid synchronous requests while making it easy for me
  var xhr1 = new XMLHttpRequest(), ranks;
  xhr1.onreadystatechange = function() {
    if (xhr1.readyState == 4 && xhr1.status == 200) {
      ranks = JSON.parse(xhr1.responseText);
    }
  }
  xhr1.open('GET', 'https://rawgit.com/Plug-It/pi/pre-release/ressources/ranks.json', true);
  xhr1.send();
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
  hasPermBouncer = getRank("Bouncer");
}

window.pi = {
// ╔══════════════════╗
// ║    VARIABLES     ║
// ╚══════════════════╝
version: '1.0.0 pre-9',
url: {
  script: "https://rawgit.com/Plug-It/pi/pre-release/ressources/pi.js",
  menu_css: "https://rawgit.com/Plug-It/pi/pre-release/ressources/menu.css",
  old_chat: "https://rawgit.com/Plug-It/pi/pre-release/ressources/old-chat.css",
  blue_css: "https://rawgit.com/Plug-It/pi/pre-release/ressources/blue.css",
  notif: "https://raw.githubusercontent.com/Plug-It/pi/pre-release/ressources/notif.wav",
},
// ╔══════════════════╗
// ║    FUNCTIONS     ║
// ╚══════════════════╝
tooltip: function(set, direction, x,y, txt) {
  if (set) {
    var tooltip = $('<div id="tooltip" class="'+direction+'" style="top: '+y+'px; left: '+x+'px;"><span>'+txt+'</span><div class="corner"></div></div>');
    $("body").append(tooltip);
  }
  else if (!set) {
    $("#tooltip").remove();
  }
},
getPlugSettings: function(id) {
  if (typeof id == "undefined") id = API.getUser().id;
  var json = JSON.parse(localStorage.getItem("settings"));
  for (var i = 1; i < 20; i++) {
    if (typeof json[i][id] !== "undefined") return json[i][id];
  }
},
setPlugSettings: function(option, value) {
  /* error 400
  $.ajax({
    url: "https://plug.dj/_/users/settings",
    method: "PUT",
    dataType: 'JSON',
    data: JSON.stringify({option:value});
  }); */

  var json = JSON.parse(localStorage.getItem("settings"));
  var id = API.getUser().id;
  for (var i = 1; i < 20; i++) {
    if (typeof json[i] !== "undefined") {
      if (typeof json[i][id] !== "undefined") {
        for (var obj in json[i][id]) {
          if (obj == option) json[i][id][obj] = value;
        }
      }
    }
  }
  localStorage.setItem("settings", JSON.stringify(json));
},
parseHTML: function(txt) {
  txt = txt.split("\n");
  for (var i = 0; i < txt.length; i++) {
    if (i !== txt.length-1) {
      txt[i] += "<br>";
    }
  }
  return txt.join("");
},
log: function(txt, type) {

  switch(type) {
    case "error": txt = "Error: " + txt;break;
    case "warn":  txt = "Warn: "  + txt;break;
    case "info":  txt = "Info: "  + txt;break;
    case "debug": txt = "Debug: " + txt;break;
    default: type = "log";break;
  }

  var logBox = $('\
    <div class="cm pi-'+type+' deletable">\
      <div class="delete-button" style="display: none;">Delete</div>\
      <div class="badge-box">\
        <i class="bdg bdg-piLogo"></i>\
      </div>\
      <div class="msg">\
        <div class="from Plug-It">\
          <i class="icon icon-pi"></i>\
          <span class="un">[Plug-It]</span>\
        </div>\
        <div class="text cid-undefined">'+pi.parseHTML(txt)+'</div>\
      </div>\
    </div>\
  ');
  logBox.on("mouseenter", function(){
    logBox.find(".delete-button")[0].style.display = "block";
  });
  logBox.on("mouseleave", function(){
    logBox.find(".delete-button")[0].style.display = "none";
  });
  logBox.find(".delete-button").on("click", function(){
    logBox.remove();
  });

  $("#chat-messages").append(logBox);
  console[type]("%c[%cPlug-It%c]%c","color: #EEE","color: #ABDA55","color: #EEE","",txt);
},
getFriendsOnline: function(callback) {
  var xhr = new XMLHttpRequest;
  xhr.open('GET', "https://plug.dj/_/friends");
  xhr.onload = function(){
    var data = xhr.responseText;
    callback(data);
  };
  xhr.send();
},
menu: function(choice) {
  choice += "";
  switch(choice) {
    case "0": settings.showMenu = !settings.showMenu; pi.slide();break;
    case "1": settings.autoW = !settings.autoW; pi.autowoot(); break;
    case "2": settings.autoDJ = !settings.autoDJ; pi.autojoin(); break;
    case "3": settings.showVideo = !settings.showVideo; pi.hideStream(); break;
    case "4": settings.CSS = !settings.CSS; pi.design(); break;
    case "5": pi.askBG(); break;
    case "6": settings.oldChat = !settings.oldChat; pi.oldChat(); break;
    case "7": settings.alertDuration = !settings.alertDuration; pi.alertDuration();break;
    case "8": settings.userMeh = !settings.userMeh; pi.voteAlert(); break;
    case "9": settings.betterMeh = !settings.betterMeh; pi.muteMeh(); break;
    case "10":
      settings.navWarn = !settings.navWarn;
      settings.navWarn ? pi.dom.navWarn.className = "pi-on" : pi.dom.navWarn.className = "pi-off";
    break;
    case "kill": pi.kill(); break;
    default: console.log(lang.info.menuOptions);
  }

  localStorage.setItem("pi-settings", JSON.stringify(settings));
},
autowoot: function() {
  if (settings.autoW === true && !$("#meh.selected")[0]) {
    $("#woot")[0].click();
    pi.dom.woot.className = "pi-on";
  } else {
    pi.dom.woot.className = "pi-off";
  }
},
autojoin: function() {
  var dj = API.getDJ();
  if (settings.autoDJ) {
    pi.dom.join.className = "pi-on";
    if (dj !== undefined) {
      if (dj.id !== API.getUser().id && API.getWaitListPosition() === -1) {
        switch (API.djJoin()) {
          case 1:
            pi.log(lang.error.autoJoin1, "error");
          break;
          case 2:
            pi.log(lang.error.autoJoin2, "error");
          break;
          case 3:
            pi.log(lang.error.autoJoin3, "error");
          break;
        }
      }
    } else {
      API.djJoin();
    }
  } else {
    pi.dom.join.className = "pi-off";
  }
},
hideStream: function() {
  if (settings.showVideo) {
    pi.dom.stream.style.visibility = "visible";
    pi.dom.stream.style.height = "281px";
    if (hasPermBouncer) {
      pi.dom.rmvDJ.style.top = pi.dom.skip.style.top = "283px";
    }
    $("#playback-controls")[0].style.visibility = "visible";
    $("#no-dj")[0].style.visibility = "visible";
    pi.dom.video.className = "pi-off";
  } else {
    pi.dom.stream.style.visibility = "hidden";
    pi.dom.stream.style.height = "0";
    if (hasPermBouncer) {
      pi.dom.rmvDJ.style.top = pi.dom.skip.style.top = "0";
    }
    $("#playback-controls")[0].style.visibility = "hidden";
    $("#no-dj")[0].style.visibility = "hidden";
    pi.dom.video.className = "pi-on";
  }
  localStorage.setItem("pi-settings",JSON.stringify(settings));
},
design: function() {
  if (settings.bg == "reset") askBG();
  if (settings.CSS) {
    pi.dom.style.setAttribute("href", pi.url.blue_css);
    settings.bg = "reset"; pi.askBG();
    pi.dom.css.className = "pi-on";
  } else {
    pi.dom.style.setAttribute("href", '');
    settings.bg = "default"; pi.askBG();
    pi.dom.css.className = "pi-off";
  }
  localStorage.setItem("pi-settings",JSON.stringify(settings));
},
oldChat: function() {
  if (settings.oldChat) {
    pi.dom.oldChat.className = "pi-on";
    pi.dom.oldStyle.setAttribute("href", pi.url.old_chat);
  } else {
    pi.dom.oldChat.className = "pi-off";
    pi.dom.oldStyle.setAttribute("href", "");
  }
},
askBG: function() {
  style = $(".room-background")[0].getAttribute("style").split(" ");
  if (typeof(plugBG) == "undefined") {
    window.plugBG = style[9];
  }
  switch (settings.bg) {
    case "reset":
      settings.bg = "https://raw.githubusercontent.com/Plug-It/pi/pre-release/images/background/default/custom.jpg";
      pi.changeBG();
    break;
    case "default":
      settings.bg = plugBG;
      pi.changeBG(true);
    break;
    default:
      settings.bg = prompt(lang.log.bgPrompt);
      if (settings.bg !== null && settings.bg.length > 0) {
        if (settings.bg == "reset" || settings.bg == "default") {
          pi.askBG();
        } else {
          pi.changeBG();
        }
      }
    break;
  }
},
changeBG: function(isDefault) {
  if (isDefault) {
    $(".room-background")[0].style.background = plugBG + " no-repeat";
    if ($("i.torch")[0] !== undefined) {
      $("i.torch")[0].style.display = "block";
      $("i.torch.right")[0].style.display = "block";
    }
    pi.dom.bg.className = "pi-off";
  } else {
    $(".room-background")[0].style.background = "url(" + settings.bg + ") no-repeat";
    pi.dom.bg.className = "pi-on";
    if ($("i.torch")[0] !== undefined) {
      $("i.torch")[0].style.display = "none";
      $("i.torch.right")[0].style.display = "none";
    }
    localStorage.setItem("pi-settings",JSON.stringify(settings));
  }
},
alertDuration: function() {
  if (settings.alertDuration) {
    pi.dom.lengthA.className = "pi-on";
    if (API.getMedia() !== undefined) {
      if (API.getMedia().duration > settings.time) {
        notif.play();
        pi.log(lang.warn.songLimit, "warn");
      }
    }
  } else {
    pi.dom.lengthA.className = "pi-off";
  }
},
muteMeh: function() {
  if (settings.betterMeh) {
    $("#meh")[0].setAttribute("onclick", "vol=API.getVolume();API.setVolume(0);");
    $("#woot")[0].setAttribute("onclick", "if(API.getVolume()===0){API.setVolume(vol)};");
    pi.dom.betterMeh.className = "pi-on";
  } else {
    $("#meh")[0].setAttribute("onclick", "");
    $("#woot")[0].setAttribute("onclick", "");
    pi.dom.betterMeh.className = "pi-off";
  }
},
afk: function(msg) {
  if (settings.afk) {
    if (typeof msg !== 'undefined') {
      API.sendChat('/me is AFK: "' + msg + '".');
      settings.afk = false;
    } else {
      API.sendChat("/me is back.");
    }
  } else {
    if (typeof msg !== 'undefined') {
      API.sendChat('/me is AFK: "' + msg + '".');
    } else {
      API.sendChat("/me is AFK.");
    }
  }
  settings.afk = !settings.afk;
},
voteAlert: function(data) {
  //visual stuff
  if (settings.userMeh === true) {
    pi.dom.mehA.className = "pi-on";
  } else {
    pi.dom.mehA.className = "pi-off";
  }
  //notifications
  if (data !== undefined) {
    if (data.vote == 1 && settings.userWoot === true) {
      pi.log(data.user.username + lang.log.wooted);
    } else if (data.vote == -1 && settings.userMeh === true) {
      pi.log(data.user.username + lang.log.meh);
    }
  }
},
reload: function() {
  pi.log(lang.log.reloading);
  menu(10);
  $.getScript("https://rawgit.com/Plug-It/pi/pre-release/ressources/pi.js");
},
slide: function() {
  var show = settings.showMenu,
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
},
forceSkip: function() {
  if (settings.security === false) {
    settings.security = true;
    pi.log(lang.warn.confirmSkip, "warn");
  } else {
    settings.security = false;
    API.moderateForceSkip();
  }
},
removeDJ: function() {
  if (settings.security === false) {
    settings.security = true;
    pi.log(lang.warn.confirmEject, "warn");
  } else {
    settings.security = false;
    API.moderateForceQuit();
  }
},
execute: function(code) {
  try {eval(code);} catch(err) {pi.log(err+"", "error");}
},
chatCommand: function(cmd) {
  var args = cmd.split(" "), msg = [];
  for (var i = 1; i < args.length; i++) {
    msg.push(args[i]);
  }
  msg = msg.join(" ");
  
  switch (args[0]) {
    case "/like":
      API.sendChat(":heart_eyes::heartpulse::heart_eyes::heartpulse::heart_eyes:");
    break;
    
    case "/love":
      if (args[1] === undefined) API.sendChat(":heart_eyes::heartpulse::heart_eyes::heartpulse::heart_eyes::heartpulse::heart_eyes::heartpulse::heart_eyes::heartpulse:");
      else API.sendChat(msg + " :heart_eyes::heartpulse::heart_eyes::heartpulse::heart_eyes::heartpulse::heart_eyes::heartpulse::heart_eyes::heartpulse:");
    break;
    
    case "/fire":
      API.sendChat(":fire: :fire: :fire: :fire: :fire: :fire: :fire: :fire: :fire: :fire:");
    break;

    case "/eta":
      if (API.getUser().id == API.getDJ().id) {
        pi.log(lang.info.youPlay, "info");
      } else if (API.getWaitListPosition() == -1) {
        pi.log(lang.info.notInWaitList, "info");
      } else if (API.getWaitListPosition() == 0) {
        var eta = API.getTimeRemaining();
        if (eta >= 3600) {
          var etaH = Math.floor(eta/60);
          var etaM = eta%60;
          pi.log(etaH+"h"+etaM+"m "+lang.log.eta);
        } else if (eta >= 60) {
          var etaM = Math.floor(eta/60);
          var etaS = eta%60;
          etaS < 10 ? etaS = "0"+etaS : void(0);
          pi.log(etaM+"m"+etaS+"s "+lang.log.eta);
        } else {
          pi.log(eta+"s "+lang.log.eta);
        }
      } else {
        var eta = (API.getWaitListPosition()+1)*4*60;
        eta += API.getTimeRemaining();
        if (eta >= 3600) {
          var etaH = Math.floor(eta/60);
          var etaM = eta%60;
          pi.log(etaH+"h"+etaM+"m "+lang.log.eta);
        } else {
          var etaM = Math.floor(eta/60);
          var etaS = eta%60;
          etaS < 10 ? etaS = "0"+etaS : void(0);
          pi.log(etaM+"m"+etaS+"s "+lang.log.eta);
        }
      }
    break;
    
    case "/vol":
      if (args[1] >= 0 && args[1] <= 100) API.setVolume(args[1]);
      else pi.log(lang.info.helpVol, "info");
    break;
    
    case "/afk":
      if (msg.length === 0) msg = undefined;
      else window.afkMessage = msg;
      pi.afk(msg);
    break;
    
    case "/whoami":
      var me = API.getUser();
      pi.log("Username: " + me.username +
      "\nID: " + me.id + 
      "\nDescription: " + me.blurb +
      "\nProfile: " + location.origin + "/@/" + me.username +
      "\nAvatar: " + me.avatarID +
      "\nBadge: " + me.badge +
      "\nLvl: " + me.level +
      "\nXP: " + me.xp +
      "\nPP: " + me.pp);
    break;
    
    case "/whois":
    debugger;
    if (typeof args[1] == "undefined") pi.log(lang.info.helpUserOrId, "info");
    else if (typeof args[1] == "string") var user = API.getUserByName(args[1].replace("@", ""));
    else var user = API.getUser(args[1]);
      pi.log("Username: "+user.rawun+"\n\
        ID: " +user.id+"\n\
        Profile: "+location.origin + "/@/" + user.username+"\n\
        language: "+user.language+"\n\
        Avatar: "+user.avatarID+"\n\
        Badge: "+user.badge+"\n\
        Lvl: "+user.level+"\n\
        Is friend: "+user.friend+"\n", "info");
    break;

    case "/pi":
      API.sendChat("Get Plug-It here: http://wibla.free.fr/plug/script/");
    break;

    case "/js":
      pi.execute(msg);
    break;

    /*case "/ban":
    break;*/
    
    case "/list":
      pi.log("/like <3 x 5\
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
      \n/list");
    break;
    
    case "/reload":
      pi.reload();
    break;
    
    case "/kill":
      pi.menu(10);
    break;
  }
},
/* Core */
init: function(unload) {
  if (typeof unload == "undefined") {
    updateStatus("Initalizating API & Events listener", 4);
    // API initalization
    API.on(API.ADVANCE, function(){
      pi.autowoot();
      pi.autojoin();
      pi.alertDuration();
      settings.security = false;
    });
    API.on(API.HISTORY_UPDATE, function(){
      if (settings.historyAlert) {
        for (var i = 0; i < API.getHistory().length; i++) {
          if (API.getMedia().cid == API.getHistory()[i].media.cid) pi.log(complete(lang.warn.inHistory, API.getHistory()[i].user.username));
        }
      }
    });
    API.on(API.VOTE_UPDATE, pi.voteAlert);
    API.on(API.CHAT_COMMAND, pi.chatCommand);
    API.on(API.CHAT, function(msg) {
      // Self Deletion Magic
      if (hasPermBouncer && msg.uid == API.getUser().id) {
        var selector = "#chat [data-cid='"+msg.cid+"']";
        if (!$(selector).length) return; // Prevent adding a second button
        $(selector)[0].className += " deletable";
        $(selector).prepend('<div class="delete-button" style="display: none;">Delete</div>');
        $(selector).on("mouseenter", function(){
          $(selector).find(".delete-button")[0].style.display = "block";
        });
        $(selector).on("mouseleave", function(){
          $(selector).find(".delete-button")[0].style.display = "none";
        });
        $(selector).find(".delete-button").on("click", function(){
          API.moderateDeleteChat(msg.cid);
        });
      }
    });
    // API addition
    API.moderateForceQuit = function() {
      $.ajax({
        url: location.origin+"/_/booth/remove/"+API.getDJ().id,
        method: "DELETE"
      });
    };
    API.getUserByName = function(name) {
      if (typeof name !== "string") return console.error("Name must be a string");
      name = name.toLowerCase();
      var audience = API.getUsers();
      for (var i = 0; i < audience.length; i++) {
        if (audience[i].rawun.toLowerCase() == name) return audience[i];
      }
      return null;
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
    $("#volume, #playback").on("mousewheel", function(e){
      e.preventDefault();
      if (e.originalEvent.deltaY > 0) API.setVolume(API.getVolume()-5);
      else API.setVolume(API.getVolume()+5);

      pi.setPlugSettings("volume", API.getVolume());
    });
    $("#now-playing-media").on("mouseenter", function(){
      if (pi.getPlugSettings().tooltips) pi.tooltip(true, "left", $('#now-playing-bar').css("Left").replace("px",""),0, this.innerText);
    });
    $("#now-playing-media").on("mouseleave", function(){pi.tooltip(false);});

    // Show percentage in level bar
    window.levelBarInfo = setInterval(function(){
      $("#footer-user .info .meta .bar .value")[0].innerHTML = $("#footer-user .info .meta .bar .value")[0].innerHTML.replace(/ [0-9]*%/g, "") + " " + $("#footer-user .info .progress")[0].style.width;
      
      if ($("#the-user-profile .experience.section .xp .value")[0]) {
        $("#the-user-profile .experience.section .xp .value")[0].innerHTML = $("#the-user-profile .experience.section .xp .value")[0].innerHTML.replace(/ [0-9]*%/g, "") + " " + $("#the-user-profile .experience.section .progress")[0].style.width;
      }
    }, 5*60*1000);
    // Show how many friends are online
    window.friendsOnline = setInterval(function(){
      pi.getFriendsOnline(
        function(data) {
          var friends = JSON.parse(data).data;
          var friendsOnline = 0;
          for (var i = 0; i < friends.length; i++) {
            if (typeof friends[i].room !== "undefined") friendsOnline++;
          }
          var count = $("#friends-button > span")[0].innerText.replace(/[0-9]*\//g,"");
          count = friendsOnline + "/" + count;
          $("#friends-button > span")[0].innerText = count;
    })}, 5*1000);
    window.roomURL = location.pathname
    window.checkIfRoomChanged = setInterval(function(){
      if (location.pathname !== window.roomURL) {
        pi.log("Your room changed", "info");
        window.roomURL = location.pathname; // If not set, script will reload infinitely
        clearInterval(checkIfRoomChanged);
        pi.reload();
      }
    }, 2*1000);
    window.checkIfUpdatesAvailable = setInterval(pi.checkForUpdates, 30*60*1000);

    // Creating DOM elements
    updateStatus("Creating script environement", 5);
    // Menu icon
    $("#app").append($('<div id="Box"><div id="icon"></div></div>'));
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
    </div>'));
    // Menu css
    $("head").append($('<link id="pi-menu-CSS" rel="stylesheet" type="text/css" href="'+pi.url.menu_css+'">'));
    // General css
    $("head").append($('<link id="pi-CSS\" rel="stylesheet\" type="text/css" href="">'));
    // Old chat css
    $("head").append($('<link id="pi-oldchat-CSS" rel="stylesheet" type="text/css" href="">'));
    // DelChat icon
    $("#chat-header").append('<div id="del-chat-button" class="chat-header-button">\
      <i id="pi-delChat" class="icon pi-delChat"></i>\
    </div>');
    // If at least bouncer
    if (getRank("Bouncer")) {
      // Moderation tools
      $("#playback-container").append($('<div id="pi-rmvDJ">\
        <img src="https://raw.githubusercontent.com/Plug-It/pi/pre-release/images/other/romveDJ.png" alt="button remove from wait-list" />\
      </div>\
      <div id="pi-skip">\
        <img src="https://raw.githubusercontent.com/Plug-It/pi/pre-release/images/other/skip.png" alt="button skip" />\
      </div>'));
    }
    // Click Event Binding
    $("body").on("click", function(e){
      switch (e.target.id) {
        // Menu
        case "Box": pi.menu(0); break;
        case "icon": pi.menu(0); break;
        case "pi-woot": pi.menu(1); break;
        case "pi-join": pi.menu(2); break;
        case "pi-video": pi.menu(3); break;
        case "pi-css": pi.menu(4); break;
        case "pi-bg": pi.menu(5); break;
        case "pi-old-chat": pi.menu(6); break;
        case "pi-lengthA": pi.menu(7); break;
        case "pi-mehA": pi.menu(8); break;
        case "pi-mutemeh": pi.menu(9); break;
        case "pi-navWarn": pi.menu(10); break;
        case "pi-off": pi.menu("kill"); break;
        // Tools
        case "pi-rmvDJ": pi.removeDJ(); break;
        case "pi-skip": pi.forceSkip(); break;
        case "pi-delChat": API.sendChat('/clear'); break;
      }
    });
    pi.dom = {
      // Script
      woot: $("#pi-woot")[0],
      join: $("#pi-join")[0],
      video: $("#pi-video")[0],
      css: $("#pi-css")[0],
      bg: $("#pi-bg")[0],
      oldChat: $("#pi-old-chat")[0],
      lengthA: $("#pi-lengthA")[0],
      mehA: $("#pi-mehA")[0],
      betterMeh: $("#pi-mutemeh")[0],
      navWarn: $("#pi-navWarn")[0],
      off: $("#pi-off")[0],
      rmvDJ: $("#pi-rmvDJ")[0],
      skip: $("#pi-skip")[0],
      DelChat: $("#pi-delChat")[0],
      style: $("#pi-CSS")[0],
      oldStyle: $("#pi-oldchat-CSS")[0],
      // Other
      stream: $("#playback-container")[0]
    },

    // Fully loaded
    pi.log(complete(lang.log.loaded));
    pi.log(lang.log.help, "info");
    pi.log("This is a pre-release, expect bugs !!!", "warn");
    $('#pi-status').css({opacity:"0"});
    setTimeout(function(){$('#pi-status').remove();}, 250);
  } else {
    // Preventing making the video definitly desapear
    if (settings.showVideo === false) {
      pi.menu(3);
      setTimeout(pi.menu(10), 250);
    }
    API.off(API.CHAT_COMMAND, pi.chatCommand);
    API.off(API.ADVANCE, pi.alertDuration);
    API.off(API.VOTE_UPDATE, pi.voteAlert);
    API.off(API.ADVANCE, pi.autowoot);
    API.off(API.ADVANCE, pi.autojoin);
    delete API.moderateForceQuit;
    delete API.getUserByName;
    window.onbeforeunload = null;
    $(window).off("keydown");
    $("body").off("click");
    $("#volume").off("mousewheel");
    clearInterval(levelBarInfo);
    clearInterval(friendsOnline);

    // Removing DOM elements
    $("#Box, #Settings, #pi-menu-CSS, #pi-CSS, #pi-oldChat-CSS, #del-chat-button").remove();
    if (hasPermBouncer) $("#pi-rmvDJ, #pi-skip").remove();

    return "unloaded";
  }
},
reload: function() {
  pi.log(lang.log.reloading);
  if (pi.kill() == "killed") $.getScript(scriptURL);
  else pi.log("[Plug-It] Couldn't kill script", "error");
},
kill: function() {
  if (pi.init(true) == "unloaded") {
    window.scriptURL = pi.url.script; // Allow to reload
    pi = undefined;
    return "killed";
  }
  else pi.log("[Plug-It] Couldn't unload script", "error");
},
checkForUpdates: function(isForced) {
  getLastCommit("https://api.github.com/repos/Plug-It/pi/commits/pre-release", function(data){
    var lastCommit = JSON.parse(data.currentTarget.responseText);
    if (thisCommit.sha !== lastCommit.sha) {
      if (isForced) pi.reload;
      else if (confirm("An update is available:\n"+lastCommit.commit.message+"\n\nWould you like to update ?")) pi.reload();
    }
  });
}};
// end of 'pi' declaration
function waitForLang(){
  if (typeof lang !== "object") {setTimeout(waitForLang, 200);}
  else pi.init();
}
waitForLang();
})();
