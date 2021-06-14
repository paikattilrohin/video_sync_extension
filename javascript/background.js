// let syncTab = null;
let synced_tab = null;
let ignore_url = false;
let snctab = null;
let urlLink = "synced_tab.html";
let current_video_time = null;
let injected = false;
let synced_tabs = {}

let serverConnection = "ws://localhost:8080"

// let serverConnection = "http://40.76.246.136";
// let serverConnection = "https://video-sync-extension-server.herokuapp.com/";

let connected_state = false;
let socket = null;

async function timeout(milliseconds) {
  return new Promise(resolve => { setTimeout(() => { resolve(); }, milliseconds) });
}

async function initSockets() {
  localStorage.CONNECTED = false;
  localStorage.SELF = ""
  localStorage.IGNOREURL = false;
  try {
    if (socket == null || (socket != null && !socket.connected)) {
      socket = await io(serverConnection, {
        reconnection: false,
        reconnectionDelayMax: 10000,
        reconnectionDelay: 5000,
        reconnectionAttempts: 0,
      });
    }
  }
  catch (error) {
    // set connected state to false everytime 
    localStorage.CONNECTED = false;
  }

  socket.on("enter", (data) => {
    if (data.successful == true) {
      localStorage.CONNECTED = true;
      localStorage.SELF = data.self;
      users_in_room = [];

      link = data.link;
      sendMessageToPopup("enter", {
        successful: true,
        room_details: data.room_details
      });
    }
    else {
      sendMessageToPopup("enter", { successful: false, reason: data['reason'] });
    }
  });

  socket.on("share", data => {
    sendMessageToPopup("share", data.video_details);
  });

  socket.on("connected_users", data=>{
    sendMessageToPopup("connected_users", data);
  });

  socket.on("disconnect", (data) => {
    localStorage.CONNECTED = false;
    sendMessageToPopup("disconnect", {});
  });

  socket.on("connect_error", (error) => {
    sendMessageToPopup("enter", { 'successful': false, 'reason': 'Server Unreachable' });
  });

  socket.on("get_time", () => {
    if (synced_tab != null && synced_tabs[synced_tab.id].injected == true) {
      sendMessageToSyncedTab("get_time", {});
    }
  });

  socket.on("transmit_video_event",(data)=>{
    // on receiving video event from others make changes
    console.log(">>>>transmit event received back \n  ", data);
    sendMessageToSyncedTab("receive_video_event", data);
  });
}

initSockets();

function syncCurrentTab() {
  synced_tab = getCurrentTab();
  updateSyncedTabs(synced_tabs);
  injectScriptInTab(synced_tab);
}

function injectScriptInTab(tab) {
  if (tab !== null && injected == false) {
    console.log("injecting to script");
    chrome.tabs.executeScript(
      tab.id,
      {
        allFrames: true,
        file: "javascript/content.js",
        runAt: "document_end",
      },
      () => {
        const e = chrome.runtime.lastError;
        if (e !== undefined) {
          console.warn("Injecting error: ", e.message);
        }
      }
    );
    injected = true;
    console.log("Injected successful");
  }
}

function getConnection(data) {
  socket.emit("enter", data);
}

function sendMessageToPopup(action, data) {
  data = {
    from: 'background',
    action: action,
    data: data
  }
  console.log("SENDING TO POPUP", data);
  chrome.runtime.sendMessage(data);
}

function sendMessageToSyncedTab(action, data) {
  chrome.tabs.sendMessage(synced_tab.id, {
    from: "background",
    action: action,
    data: data
  });
}

function createTab(url) {
  return new Promise((resolve) => {
    chrome.tabs.create({ url }, async (tab) => {
      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (info.status === "complete" && tabId === tab.id) {
          chrome.tabs.onUpdated.removeListener(listener);
          console.log("Page loaded");
          injectScriptInTab(tab);
          resolve(tab);
        }
      });
    });
  });
}

async function handleConnection(data) {
  if (!socket.connected) {

    initSockets();
    await timeout(200);
  }
  // connect_error caught in 
  socket.emit('enter', data);
}

function updateSyncedTabs(tab) {
  if (!(tab.id in synced_tabs)) {
    synced_tabs[tab.id] = {}
    synced_tabs[tab.id].tab = tab;
  }
}

function updateTab(tab, updateUrl) {
  return new Promise((resolve) => {
    chrome.tabs.update(tab.id, { url: updateUrl, active: true }, async (tab) => {
      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (info.status === "complete" && tabId === tab.id) {
          chrome.tabs.onUpdated.removeListener(listener);
          injectScriptInTab(tab);
          resolve(tab);
        }
      });
    });
  });
}

function closeSyncedTab() {
  return new Promise((resolve) => {
    chrome.tabs.remove(synced_tab.id, function () {
      resolve();
    });
  });
}

function updateCurrentTab() {
  return new Promise((resolve) => {
    chrome.tabs.remove(synced_tab.id, function () {
      resolve();
    });
  });
}

function getCurrentTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      resolve(tabs[0]);
    });
  });
}


async function joinVideoWatch(data) {
  ignore_url = data.ignore_url;
  if (ignore_url === "false") {
    if (synced_tab === null) {
      synced_tab = await createTab(data.link);

    } else {
      synced_tab = await updateTab(synced_tab, data.link);
    }
    updateSyncedTabs(synced_tab);
  }
  sendTabId();
  socket.emit("request_time",{});
}

function getFaviconFromUrl(url) {
  let position = 0;
  for (let i = 0; i < 3; i++) {
    position = url.indexOf('/', position);
    position++;
  }
  return `${url.substring(0, position)}favicon.ico`;
}



async function injectScript() {

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    // syncedTab = await updateTab(tabs[0]);
    synced_tab = tabs[0];
    injectScriptInTab(tabs[0]);
  });
}


async function handleVideoShare() {
  var current_tab = await getCurrentTab();
  synced_tab = current_tab;
  if (!(synced_tab.id in synced_tabs)) {
    synced_tabs[synced_tab.id] = {};
    synced_tabs[synced_tab.id].injected = true;
    synced_tabs[synced_tab.id].tab = synced_tab;
  }
  injectScriptInTab(synced_tab);
  synced_tabs[synced_tab.id].injected = true;
  favicon = current_tab.favIconUrl;
  video_title = current_tab.title;
  link = current_tab.url;
  message = {
    favicon: favicon,
    video_title: video_title,
    link: link
  }
  sendMessageToPopup("share", message);
  socket.emit("share", message);
}

function sendTabId() {
  sendMessageToSyncedTab("set_tab_id", { tab_id: synced_tab.id });
}


chrome.tabs.onRemoved.addListener((tabid, removed) => {
  if (tabid in synced_tabs) {
    delete synced_tabs[tabid];
  }
  if (synced_tab !== null && tabid === synced_tab.id) {
    synced_tab = null;
    current_video_time = null;
    injected = false;
  }
});


chrome.tabs.onUpdated.addListener((tabId, info) => {
  if (tabId in synced_tabs) {
    if (info.status == 'complete') {
      synced_tabs[tabId].injected = false;
    }
  }
});



chrome.runtime.onMessage.addListener((message, sender) => {
  console.log("-----message received by backed listener \n",message);
  if (message.from == "popup") {
    if (message.action === "video_link_click") {
      joinVideoWatch(message.data);
    } else if (message.action === "share") {
      handleVideoShare();
    } else if (message.action === "ignore_url_and_sync") {
      syncCurrentTab();
    } else if (message.action === "enter") {
      handleConnection(message.data);
    } else if (message.action === "disconnect") {
      socket.disconnect();
    } else if (message.action === "videoclick") {
      joinVideoWatch(message.data);
    }
  }
  else if (message.from == "content") {
    if (message.tab_id == synced_tab.id) {
    // tab id synced
      if(message.action =="transmit_video_event"){
        socket.emit("transmit_video_event", message.data);
      }
      else if (message.action == "get_time") {
        socket.emit("get_time", message.data);
      }
    }

    // tab id isn't synced
    else if (message.action === "set_tab_id" && !message.data.successful) {
      sendTabId();
    }
  }
  if (message.from === "content") {
    // socket.emit(message.data);
    // console.log(message.data);
  }
});

// chrome.tabs.query({active:true, currentWindow: true}, function(tabs){
//   chrome.tabs.sendMessage(tabs[0].id, {from: "background", data: "test"});
// });

// chrome.tabs.create({
//   url: 'synced_tab.html'
// });

// chrome.extension.onConnect.addListener(function (port) {
//   console.log("Connected .....");
//   port.onMessage.addListener(function (msg) {
//     console.log(msg);
//     var message = JSON.parse(msg);
//     // console.log("")
//     console.log("message recieved " + message['login']['username']);
//     port.postMessage({
//       result: "success",
//     });
//   });
// })

// function changeSyncTab() {
//   chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tab) => {
//     if (tabs.length !== 0) {
//       //   if (tabs[0].url === share.url) {
//       setSyncTab(tabs[0]);
//       //   }
//     }
//   });
// }


// if (message.from === "popup" && message.action === "test5") {
//   console.log("---------------------");
//   // urlLink = "https://www.youtube.com/watch?v=2SUwOgmvzK4";
//   urllink = "https://www.primevideo.com/detail/0P9FGG4M62XDQOT7XGMJQXREAY/ref=atv_hm_hom_c_6jFCGf_2_2";
//   console.log("url updated");
// } else if (message.from === "popup" && message.action === "test6") {
//   chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
//     console.log("---------------------");
//     console.log("current page tab is ", tabs[0]);
//   });
// } else if (message.from === "popup" && message.action === "test7") {
//   socket.emit("hi", { bye: "kadlekai" });
// }