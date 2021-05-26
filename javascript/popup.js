const connectElement = document.getElementById("connect");
// const pauseElement = document.getElementById("pause");


const joinLinkButton = document.getElementById("joinlink");
const syncButton = document.getElementById("sync");


const testbutton2 = document.getElementById("testbutton2");
const testbutton3 = document.getElementById("testbutton3");
const testbutton4 = document.getElementById("testbutton4");
const testbutton5 = document.getElementById("testbutton5");
const testbutton6 = document.getElementById("testbutton6");
const testbutton7 = document.getElementById("testbutton7");


joinLinkButton.onclick = () => {
  chrome.runtime.sendMessage({from: "popup", data: "joinlink"})
};

syncButton.onclick = () => {
  chrome.runtime.sendMessage({from: "popup", data:"sync"});
};

testbutton3.onclick = () => {
  // console.log("Popup: test_button_clicked");
  chrome.runtime.sendMessage({ from: "popup", data: "test3" });
};

testbutton4.onclick = () => {
  console.log("Popup: test_button_clicked");
  chrome.runtime.sendMessage({ from: "popup", data: "test4" });
};

testbutton5.onclick = () => {
  // console.log("Popup: test_button_clicked");
  chrome.runtime.sendMessage({ from: "popup", data: "test5" });
};

testbutton6.onclick = () => {
  // console.log("Popup: test_button_clicked");
  chrome.runtime.sendMessage({ from: "popup", data: "test6" });
};

testbutton7.onclick = () => {
  // console.log("Popup: test_button_clicked");
  chrome.runtime.sendMessage({ from: "popup", data: "test7" });
};



connectElement.onclick = () => {
  // console.log("connect clicked");
  chrome.runtime.sendMessage({ from: "popup", data: "connect" });
};


// chrome.runtime.onMessage.addListener((msg, sender) => {
//   console.log(msg);
// });


// pause.onclick = () => {
//   console.log("\n\n\n  pause clicked");
//   chrome.runtime.sendMessage({ from: "popup", data: "pause" });
// };
