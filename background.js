/*
Open a new tab, and load "my-page.html" into it.
*/

if (typeof browser === 'undefined') {
  browser = chrome;
}

let tabID = -1;

function openMyPage() {
  // browser.tabs.update(tabID, { active: true }).catch(() => {
    browser.tabs.create({
      "url": "/index.html",
    }).then(t => tabID = t.id);
  // });
}

/*
Add openMyPage() as a listener to clicks on the browser action.
*/
browser.browserAction.onClicked.addListener(openMyPage);