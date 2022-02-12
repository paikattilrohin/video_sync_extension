var tab_id = null;
var all_video_elements = null;
var video_listeners = null;
var eventReceived = false;
var newJoineeSynced = false;
var stopSyncing = false;
var lastEventReceived = {};
var loading = false;
var previousEvent = null;

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
          successful: false,
          listener: true
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
    type: event.type,
    element: video_listeners.indexOf(event.target),
    currentTime: event.target.currentTime,
    playbackRate: event.target.playbackRate,
  };
  
  sendMessageToBackground({
    from: 'content',
    action: 'transmit_video_event',
    data: eventSend
  });

}


function getDetailsFromEvent(event) {
  const eventSend = {
    type: event.type,
    element: video_listeners.indexOf(event.target),
    currentTime: event.target.currentTime,
    playbackRate: event.target.playbackRate,
  };

  return eventSend;
}



function onEvent(event) {


  var video_index = video_listeners.indexOf(event.target);
  if (!stopSyncing) {
    if (lastEventReceived[video_index]) {
      console.log("sending from inside");
      console.log("event type is : ", event.type, " previous event type is : ", lastEventReceived[video_index].type);
      console.log("event time difference ", Math.abs(event.target.currentTime - lastEventReceived[video_index].currentTime));

      if (event.type === "play") {
        if (Math.abs(event.target.currentTime - lastEventReceived[video_index].currentTime) > 0.5) {
          broadcast(event);
          lastEventReceived = getDetailsFromEvent(event);
        }

      }
      else if (event.type === "pause") {
        if (Math.abs(event.target.currentTime - lastEventReceived[video_index].currentTime) > 0.5) {
          broadcast(event);
          lastEventReceived = getDetailsFromEvent(event);
        }
      }
      else if (event.type === "ratechange") {
        if (event.target.playbackRate != lastEventReceived[video_index].playbackRate) {
          broadcast(event);
          lastEventReceived = getDetailsFromEvent(event);
        }
      }

    }
    else {
      console.log("sending from everything broadcast");
      broadcast(event);
    }
  }

}


function handleVideoEvent(data) {
  if (data.type === "pause") {
    all_video_elements[data.element].pause();
    all_video_elements[data.element].currentTime = data.currentTime;
  }
  else if (data.type === "play") {
    all_video_elements[data.element].currentTime = data.currentTime;
    all_video_elements[data.element].play();
  }
  else if (data.type === "ratechange") {
    all_video_elements[data.element].playbackRate = data.playbackRate;
  }
}


function addListeners(videoElements) {
  const eventTypes = ['play', 'pause', 'ratechange'];

  for (let i = 0; i < videoElements.length; i++) {
    for (let j = 0; j < eventTypes.length; j++) {
      videoElements[i].addEventListener(eventTypes[j], onEvent, true);
    }
  }
}



function initilizeListeners() {
  all_video_elements = document.getElementsByTagName('video');
  addListeners(all_video_elements);
  video_listeners = Array.from(all_video_elements);
}

initilizeListeners();





chrome.runtime.onMessage.addListener((message) => {
  if (message.from == "background") {
    if (message.action == "receive_video_event") {
      lastEventReceived[message.data.element] = message.data;
      eventReceived = true;
      handleVideoEvent(message.data);
    }

    else if (message.action == "start_video") {
      for (var video_id in message.data) {
        eventReceived = true;
        lastEventReceived[message.data[video_id]] = message.data[video_id];
        handleVideoEvent(message.data[video_id]);
      }
    }

    else if (message.action === "get_time") {
      var data = {}
      for (var video_number = 0; video_number < video_listeners.length; video_number++) {
        data[video_number] = {}
        data[video_number].currentTime = video_listeners[video_number].currentTime;
        data[video_number].element = video_number;
        data[video_number].playbackRate = video_listeners[video_number].playbackRate;
        if (video_listeners[video_number].paused) {
          data[video_number].type = 'pause';
        }
        else {
          data[video_number].type = 'play';
        }
      }
      var reply_message = {
        from: "content",
        action: "get_time",
        data: data
      }
      console.log("time sending ", reply_message);
      sendMessageToBackground(reply_message);
    }

    else if (message.action == "stop_syncing") {
      console.log("Stoping sync");
      stopSyncing = true;
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

var tabid_not_set_message = {
  from: "content",
  action: "set_tab_id",
  data: {
    successful: false,
    request_time: true
  }
}
chrome.runtime.sendMessage(tabid_not_set_message);

console.log("Injected");


