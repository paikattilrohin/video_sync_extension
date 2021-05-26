var nodesCollection = null;
var nodes = null;
function init() {
    // nodesCollection = document.getElementsByTagName('video');
    // console.log(nodesCollection);
    // addListeners(nodesCollection);
    // nodes = Array.from(nodesCollection);
    // for(var i = 0; i < nodes.length; i++){
      //   console.log("trying to pause");
      //   nodes[i].pause();
      // }
    console.log("Injected");
}
init();

function pause(){
    nodesCollection = document.getElementsByTagName('video');
    console.log(nodesCollection);
    nodes = Array.from(nodesCollection);
    for(var i = 0; i < nodes.length; i++){
        console.log("trying to pause");
        nodes[i].pause();
      }
}



chrome.runtime.onMessage.addListener( (msg) => {
  console.log("msg received");
  console.log(msg);
  pause();
});
