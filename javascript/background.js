// let syncTab = null;
let syncedTab = null;
let ignoreUrl = false;
let snctab = null;
let urlLink = "synced_tab.html";
let injected = false;

function injectScriptInTab(tab) {
  console.log("called inject with tab", tab);
  if (tab !== null) {
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
    // injected = True;
    console.log("I successful");
  }
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

function updateTab(tab, updateUrl) {
  return new Promise((resolve) => {
    chrome.tabs.update(tab.id, { url: updateUrl }, async (tab) => {
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

async function syncTab() {
  if (!ignoreUrl) {
    if (syncedTab === null) {
      syncedTab = await createTab(urlLink);
      console.log("4");
    } else {
      syncedTab = await updateTab(syncedTab, urlLink);
      console.log("2");
    }
  }
}

chrome.tabs.onRemoved.addListener((tabid, removed) => {
  if (syncedTab !== null && tabid === syncedTab.id) {
    syncedTab = null;
  }
});

function updateTabWithURL() {
  chrome.tabs.update(syncedTab.id, { url: urlLink }, (syncedTab) =>
    injectScriptInTab(syncedTab)
  );
}

function setSyncTab(tab) {
  snctab = tab;
  if (tab !== null) injectScriptInTab(tab);
}

function changeSyncTab() {
  chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tab) => {
    if (tabs.length !== 0) {
      //   if (tabs[0].url === share.url) {
      setSyncTab(tabs[0]);
      //   }
    }
  });
}


chrome.runtime.onMessage.addListener((msg, sender) => {
  console.log(msg);
  if (msg.from === "popup" && msg.data === "joinlink") {
    console.log("---------------------");
    console.log("joining link");
    syncTab();
    // console.log(msg);
    // changeSyncTab();
  } else if (msg.from === "popup" && msg.data === "sync") {
    console.log("---------------------");
    console.log("injecting");
    // console.log(msg);
    // changeSyncTab();
    // injectScriptInTab(syncedTab);
    chrome.tabs.sendMessage(syncedTab.id, { from: "background", data: "test" });
  } else if (msg.from === "popup" && msg.data === "injectscript") {
    console.log("---------------------");
    console.log("injecting");
    injectScriptInTab(syncedTab);
    // console.log(msg);
    // changeSyncTab();
  } else if (msg.from === "popup" && msg.data === "test2") {
    // create sync tab
    console.log("---------------------");
    console.log("join");
    syncTab();
  } else if (msg.from === "popup" && msg.data === "test3") {
    //pause
    console.log("---------------------");
    console.log("pause");
    chrome.tabs.sendMessage(syncedTab.id, {
      from: "background",
      data: "pause",
    });
  } else if (msg.from === "popup" && msg.data === "test4") {
    console.log("---------------------");
    console.log("Tab details are");
    console.log(syncedTab);
  } else if (msg.from === "popup" && msg.data === "test5") {
    console.log("---------------------");
    urlLink = "https://www.youtube.com/watch?v=2SUwOgmvzK4";
    console.log("url updated");
  } else if (msg.from === "popup" && msg.data === "test6") {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      console.log("---------------------");
      console.log("current page tab is ", tabs[0]);
    });
  } else if (msg.from === "popup" && msg.data === "test7") {
  }

  console.log("Synced tab button click is ", syncedTab);
});

// chrome.tabs.query({active:true, currentWindow: true}, function(tabs){
//   chrome.tabs.sendMessage(tabs[0].id, {from: "background", data: "test"});
// });

// chrome.tabs.create({
//   url: 'synced_tab.html'
// });

/**
 *
 * Use await
 * Wait till previous is not equal to old URL
 */
