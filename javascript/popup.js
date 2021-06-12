const div_show_if_disconnected_element = document.getElementById("show_if_disconnected");
const username_element = document.getElementById("name");
const secretkey_element = document.getElementById("secret_key");
const roomname_element = document.getElementById("room_name");
const connect_element = document.getElementById("connect");
const connection_reply = document.getElementById("connection_reply");
const users_element = document.getElementById("users");


const div_show_if_connected_element = document.getElementById("show_if_connected");
const roomname_display_element = document.getElementById("roomname_display");
const share_button_element = document.getElementById("sync");
const favicon_element = document.getElementById("video_favicon");
const video_link_button_element = document.getElementById("video_link_button");
const ignore_url_checkbox_element = document.getElementById("ignore_url_input");
const ignore_url_sync_input_button_element = document.getElementById("sync_ignore_url");

let connect_reply_lock = false;


function show_connect_disconnect_elements() {
  // console.log("show hide");
  if (localStorage.NAME) {
    username_element.value = localStorage.NAME;
  }
  if (localStorage.ROOMNAME) {
    roomname_element.value = localStorage.ROOMNAME;
  }
  if (localStorage.SECRETKEY) {
    secretkey_element.value = localStorage.SECRETKEY;
  }

  if (localStorage.FAVICON && localStorage.FAVICON != "") {
    favicon_element.src = localStorage.FAVICON;
  }
  if (localStorage.VIDEOTITLE && localStorage.VIDEOTITLE != "") {
    video_link_button_element.value = localStorage.VIDEOTITLE;
  }

  if (localStorage.IGNOREURL && localStorage.IGNOREURL == "true") {
    ignore_url_checkbox_element.checked = true;
    ignore_url_sync_input_button_element.className = "show block button";
    share_button_element.className = "hide block button";
  }
  else {
    ignore_url_checkbox_element.checked = false;
    ignore_url_sync_input_button_element.className = "hide block button";
    share_button_element.className = "show block button";
  }

  if (localStorage.CONNECTED === "true") {
    connect_element.className = "block button_connected";
    connect_element.value = "Disconnect"
    users_element.innerHTML = localStorage.USERS;
    roomname_display_element.innerHTML = localStorage.ROOMNAME;

    div_show_if_disconnected_element.className = "hide";
    div_show_if_connected_element.className = "show";
  }

  else {
    div_show_if_disconnected_element.className = "show";
    div_show_if_connected_element.className = "hide";
  }
}

show_connect_disconnect_elements();


connect_element.onclick = () => {
  if (!connect_reply_lock) {
    localStorage.NAME = username_element.value;
    localStorage.SECRETKEY = secretkey_element.value;
    localStorage.ROOMNAME = roomname_element.value;
    if (localStorage.CONNECTED === "true") {
      localStorage.CONNECTED = false;
      connect_element.className = "block button";
      connect_element.value = "Connect"
      chrome.runtime.sendMessage({ from: "popup", action: "disconnect" });
      connect_reply_lock = true;
      show_connect_disconnect_elements();
    }
    else if (username_element.value && roomname_element.value && secretkey_element.value) {
      chrome.runtime.sendMessage(
        {
          from: "popup",
          action: "enter",
          data: {
            'username': username_element.value,
            'roomname': roomname_element.value,
            'secretkey': secretkey_element.value
          }
        }
      );
      connect_element.value = "Connecting...";
      connect_element.className = "block button_connecting";
      connection_reply.className = "hide_error";
      connection_reply.innerHTML = "";
      connect_reply_lock = true;
    } else {
      console.log("Nothing");
      connection_reply.innerHTML = "Enter all details";
      connection_reply.className = "show_error";
    }
  }
};


ignore_url_checkbox_element.onclick = () => {
  localStorage.IGNOREURL = ignore_url_checkbox_element.checked;
  if(ignore_url_checkbox_element.checked) {
    ignore_url_sync_input_button_element.className = "show block button";
    share_button_element.className = "hide block button";
  }
  else {
    ignore_url_sync_input_button_element.className = "hide block button";
    share_button_element.className = "show block button";
  }
};

ignore_url_sync_input_button_element.onclick = () => {


};

video_link_button_element.onclick = () => {
  chrome.runtime.sendMessage({
    from: "popup",
    action: "videolinkclick",
    data: {
      ignore_url: localStorage.IGNOREURL
    }
  });
};

share_button_element.onclick = () => {
  chrome.runtime.sendMessage({
    from: "popup",
    action: "share",
    data: {
      ignoreurl: localStorage.IGNOREURL
    }
  });
};


function handleConnectionReply(data) {
  console.log("Handling change");
  if (data['successful'] == true) {
    // connect button transition
    connection_reply.className = "hide_error";
    connection_reply.innerHTML = "";
    connect_element.value = "Disconnect";
    connect_element.className = "block button_connected";

    var usersString = "";
    console.log(data);
    for (var key in data['room_details']['connected_users']) {
      usersString += data['room_details']['connected_users'][key] + "<br>";
    }
    localStorage.USERS = usersString;
    users_element.innerHTML = usersString;
    if (data.room_details.video_details.favicon) {
      localStorage.FAVICON = data.room_details.video_details.favicon;
    }
    else {
      localStorage.FAVICON = "icons/paikro_128.png";
    }
    if (data.room_details.video_details.video_title) {
      localStorage.VIDEOTITLE = data.room_details.video_details.video_title;
      localStorage.LINK = data.room_details.video_details.link;
    }
    else {
      localStorage.VIDEOTITLE = "No Video Synced";
      localStorage.LINK = "";
    }

  }
  else {
    connection_reply.innerHTML = data['reason'];
    connection_reply.className = "show_error";
    connect_element.className = "block button";
    connect_element.value = "Connect";
  }
  show_connect_disconnect_elements();
}

chrome.runtime.onMessage.addListener((message, sender) => {
  console.log("FROM BACKGROUND", message);
  if (message.from == 'background' && message.action == 'enter') {
    console.log("received back");
    handleConnectionReply(message.data);
    connect_reply_lock = false;
  }
  if (message.from == 'background' && message.action == 'disconnect') {
    localStorage.USERS = ""
    connect_reply_lock = false;
    users_element.innerHTML = "";
  }

  if (message.from == 'background' && message.action == 'share') {
    console.log(message.data);
    if (message.data.video_title) {
      localStorage.VIDEOTITLE = message.data.video_title;
    }
    if (message.data.favicon) {
      localStorage.FAVICON = message.data.favicon;
    }
    if (message.data.link) {
      localStorage.LINK = message.data.link;
    }
    console.log(localStorage.VIDEOTITLE, localStorage.FAVICON, localStorage.LINK);
    show_connect_disconnect_elements();
  }
});







// const joinLinkButton = document.getElementById("joinlink");

// const testbutton2 = document.getElementById("testbutton2");
// const testbutton3 = document.getElementById("testbutton3");
// const testbutton4 = document.getElementById("testbutton4");
// const testbutton5 = document.getElementById("testbutton5");
// const testbutton6 = document.getElementById("testbutton6");
// const testbutton7 = document.getElementById("testbutton7");

// // joinLinkButton.onclick = () => {
// //   chrome.runtime.sendMessage({ from: "popup", action: "joinlink" });
// // };


// testbutton3.onclick = () => {
//   // console.log("Popup: test_button_clicked");
//   chrome.runtime.sendMessage({ from: "popup", action: "test3" });
// };

// testbutton4.onclick = () => {
//   // console.log("Popup: test_button_clicked");
//   chrome.runtime.sendMessage({ from: "popup", action: "test4" });
// };

// testbutton5.onclick = () => {
//   // console.log("Popup: test_button_clicked");
//   chrome.runtime.sendMessage({ from: "popup", action: "test5" });
// };

// testbutton6.onclick = () => {
//   // console.log("Popup: test_button_clicked");
//   chrome.runtime.sendMessage({ from: "popup", action: "test6" });
// };

// testbutton7.onclick = () => {
//   // console.log("Popup: test_button_clicked");
//   chrome.runtime.sendMessage({ from: "popup", action: "test7" });
// };
