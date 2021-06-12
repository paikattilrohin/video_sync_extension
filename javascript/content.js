
var nodesCollection = null;
var nodes = null;
function init() {
    console.log("Injected");
}
init();

function sendMessageInRuntime(msg) {
  try {
    chrome.runtime.sendMessage(msg);
  } catch (err) {
    if (debug) throw new Error(err);
  }
}


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

function broadcast(event) {
  const eventSend = {
    // location: iframeFullIndex(window),
    type: event.type,
    element: nodes.indexOf(event.target),
    currentTime: event.target.currentTime,
    playbackRate: event.target.playbackRate,
  };
  if (eventSend.type === 'progress') eventSend.type = 'pause';
  else if (eventSend.type === 'playing') eventSend.type = 'play';
  sendMessageInRuntime({
    from: 'content',
    // data: eventSend,
    data: eventSend
  });
  // if (debug) console.log(`%cbroadcast: ${eventSend.type}`, 'background: #00590E;');
}


function onEvent(event) {
  //	if (event.type === 'progress') console.log('event:'+event.type+' '+event.target.readyState+' recieved: '+recieved+' loading: '+loading);
  //	else console.log('event:'+event.type+' '+' recieved: '+recieved+' loading: '+loading);

    broadcast(event);
}



function addListeners(nodesCollection) {
  // const eventTypes = ['playing', 'pause', 'seeked', 'ratechange', 'progress'];
  const eventTypes = [ 'playing', 'seeked', 'ratechange', 'playingess'];

  for (let i = 0; i < nodesCollection.length; i++) {
    for (let j = 0; j < eventTypes.length; j++) {
      nodesCollection[i].addEventListener(eventTypes[j], onEvent, true);  
    }
  }
}

function vinit() {
  const nodesCollection = document.getElementsByTagName('video');
  addListeners(nodesCollection);
  nodes = Array.from(nodesCollection);
}

vinit();


chrome.runtime.onMessage.addListener( (msg) => {
  console.log(msg);
  if( msg.from === "background" && msg.data === "changetime"){
    console.log("received change time");
    for( var i = 0; i < nodes.length; i++){
      nodes[0].currentTime = 5;
    }
  }
  return true;
  // pause();
});



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
