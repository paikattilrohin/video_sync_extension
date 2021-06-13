var tab_id = null;
var nodesCollection = null;
var nodes = null;
var eventReceived = false;
var newJoineeSynced = false;


function sendMessageToBackground(message) {
  try {
    if (tab_id != null) {
      message.tab_id = tab_id;
      chrome.runtime.sendMessage(message);
    }
    else {
      var fail_message = {
        from: "content",
        action: "set_tab_id",
        data: {
          successful: false
        }
      }
      chrome.runtime.sendMessage(fail_message);
    }
  } catch (err) {
    if (debug) throw new Error(err);
  }
}

setTimeout(() => {
  newJoineeSynced = true;
  console.log("can transmit events now");
}, 4000);

function broadcast(event) {
  const eventSend = {
    // location: iframeFullIndex(window),
    type: event.type,
    element: nodes.indexOf(event.target),
    currentTime: event.target.currentTime,
    playbackRate: event.target.playbackRate,
  };
  // if (eventSend.type === 'progress') eventSend.type = 'pause';
  if (eventSend.type === 'playing') eventSend.type = 'play';
  sendMessageToBackground({
    from: 'content',
    action: 'transmit_video_event',
    data: eventSend
  });
  // if (debug) console.log(`%cbroadcast: ${eventSend.type}`, 'background: #00590E;');
}


function onEvent(event) {
  //	if (event.type === 'progress') console.log('event:'+event.type+' '+event.target.readyState+' recieved: '+recieved+' loading: '+loading);
  //	else console.log('event:'+event.type+' '+' recieved: '+recieved+' loading: '+loading);
  if (!eventReceived && newJoineeSynced && tab_id!= null) {
    broadcast(event);
  }
  eventReceived = false;
}

function handleVideoEvent(data) {
  eventReceived = true;
  console.log("Event data received is", data);
  nodesCollection[data.element].currentTime = data.currentTime + 5;
}


function addListeners(nodesCollection) {
  // const eventTypes = ['playing', 'pause', 'seeked', 'ratechange', 'progress'];
  // const eventTypes = ['playing', 'seeked', 'ratechange', 'progress'];
  const eventTypes = ['playing', 'pause', 'seeked', 'ratechange'];

  for (let i = 0; i < nodesCollection.length; i++) {
    for (let j = 0; j < eventTypes.length; j++) {
      nodesCollection[i].addEventListener(eventTypes[j], onEvent, true);
    }
  }
}

function init() {
  nodesCollection = document.getElementsByTagName('video');
  addListeners(nodesCollection);
  nodes = Array.from(nodesCollection);
}

init();


chrome.runtime.onMessage.addListener((message) => {
  if (message.from == "background") {
    if (message.action == "receive_video_event") {
      handleVideoEvent(message.data);
    }

    else if (message.from === "background" && message.action === "get_time") {
      var data = {}
      for (var i = 0; i < nodes.length; i++) {
        data[i] = nodes[0].currentTime;
      }
      var reply_message = {
        from: "content",
        action: "get_time",
        data: data
      }
      sendMessageToBackground(reply_message);
    }

    else if (message.action == "set_tab_id") {
      tab_id = message.data.tab_id;
      var reply_message = {
        from: "content",
        action: "set_tab_id",
        data: {
          successful: true          
        }
      }
      
      sendMessageToBackground(reply_message);
    }
  }

});

var fail_message = {
  from: "content",
  action: "set_tab_id",
  data: {
    successful: false
  }
}
chrome.runtime.sendMessage(fail_message);

console.log("Injected");

// function onEvent(event) {
//   //	if (event.type === 'progress') console.log('event:'+event.type+' '+event.target.readyState+' recieved: '+recieved+' loading: '+loading);
//   //	else console.log('event:'+event.type+' '+' recieved: '+recieved+' loading: '+loading);
//   if (recieved) {
//     if (recievedEvent === 'play') {
//       if (event.type === 'progress') {
//         onProgress(event);
//         recieved = false;
//       } else if (event.type === 'playing') recieved = false;
//     } else if (recievedEvent === 'pause') {
//       if (event.type === 'seeked') recieved = false;
//     } else if (recievedEvent === event.type) recieved = false;
//   } else if (event.type === 'seeked') {
//     if (event.target.paused) broadcast(event);
//   } else if (event.type === 'progress') {
//     onProgress(event);
//   } else broadcast(event);
// }

// function addListeners(nodesCollection) {
//   const eventTypes = ['playing', 'pause', 'seeked', 'ratechange', 'progress'];
//   for (let i = 0; i < nodesCollection.length; i++) {
//     for (let j = 0; j < eventTypes.length; j++) {
//       nodesCollection[i].addEventListener(eventTypes[j], onEvent, true);  
//     }
//   }
// }

// function init() {
//   const nodesCollection = document.getElementsByTagName('video');
//   addListeners(nodesCollection);
//   nodes = Array.from(nodesCollection);
// }

// init();

// const observer = new MutationObserver(() => {
//   init();
// });

// observer.observe(document.body, {
//   childList: true,
//   subtree: true,
// });


// function pause(){
//     nodesCollection = document.getElementsByTagName('video');
//     console.log(nodesCollection);
//     nodes = Array.from(nodesCollection);
//     for(var i = 0; i < nodes.length; i++){
//         console.log("trying to pause");
//         nodes[i].pause();
//       }
//       sendMessageInRuntime("hi");
// }
