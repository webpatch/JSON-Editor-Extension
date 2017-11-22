/*
Open a new tab, and load "my-page.html" into it.
*/

if (typeof browser === 'undefined') {
  browser = chrome;
}

function openMyPage() {
  console.log("injecting");
  browser.tabs.create({
    "url": "/index.html"
  });
}

/*
Add openMyPage() as a listener to clicks on the browser action.
*/
browser.browserAction.onClicked.addListener(openMyPage);