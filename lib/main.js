"use strict";

const { Cc, Ci, Cr, Cm } = require('chrome')


var sessionStore = Cc['@mozilla.org/browser/sessionstore;1'].
                        getService(Ci.nsISessionStore);
var wm = Cc["@mozilla.org/appshell/window-mediator;1"]
                     .getService(Ci.nsIWindowMediator);

const ss = require("sdk/simple-storage");
const { XMLHttpRequest } = require("sdk/net/xhr");

const tabs = require("sdk/tabs");
const self = require("sdk/self");
const fileIO = require("sdk/io/file");

const { attach, detach } = require('sdk/content/mod');
const { Style } = require('sdk/stylesheet/style');

const loader = require('sdk/net/url');
const protocol = require('index');
const {setTimeout} = require('sdk/timers');

const { modelFor } = require("sdk/model/core");
const { viewFor } = require("sdk/view/core");
const tab_utils = require("sdk/tabs/utils");
const clipboard = require("sdk/clipboard");
const { ActionButton } = require("sdk/ui/button/action");

const HELLO_JSON = '{"array":[1,2,3],"boolean":true,"null":null,"number":123,"object":{"a":"b","c":"d","e":"f"},"string":"Hello World"}';

if (!ss.storage.tabs) 
    ss.storage.tabs = {};

function overUse() {
    console.log('clear local storage!')
    var arr = []
    for (var i in ss.storage.tabs){
      arr.push({'key':i,'time':ss.storage.tabs[i]['time']})
    }
    console.log('arr  ', JSON.stringify(arr))

    var f = arr.sort(function(a,b){
      if (a.time > b.time) {
        return 1;
      }else if(a.time<b.time){
        return -1;
      }else{
        return 0;
      }
    })
    console.log(f)

    while (ss.quotaUsage > 0.8){
        var o = f.pop();
        delete ss.storage.tabs[o['key']];
    }
}

ss.on("OverQuota", overUse);


exports.handler = protocol.about('json', {
    onRequest: function (request, response) {
        console.log('>>>', JSON.stringify(request, '', '  '));
        response.contentType = "text/html";
        loader.readURI(self.data.url("editor.html"), {sync: true}).then(function success(value) {
            response.end(value);
        }, function failure(reason) {
            response.end(reason);
        });
        console.log('<<<', JSON.stringify(response, '', '  '));
    }
});

exports.handler.register();

var button = ActionButton({
    id: "json-button",
    label: "Open JSON editor",
    icon: {
        "16": "./16.png",
        "32": "./32.png"
    },
    onClick: function (state) {
        tabs.open('about:json')
    }
});
//exports.handler.unregister()

function checkIsJsonData(sData) {
    if (sData && sData.match(/^\s*[\[\{]/)) {
        if (typeof JSON.parse(sData) === 'object') {
            return true;
        }
    }
    return false;
}

function getTextFromTab(tab) {
    try{
        var lowLevelTab = viewFor(tab);
        var browser = tab_utils.getBrowserForTab(lowLevelTab);
        return browser.contentDocument.body.textContent;
    }catch(e){
        console.log(e);
        return '';
    }
}

function downloadFile(url, onComplete, onFail) {
    var req = new XMLHttpRequest();
    req.timeout = 15000;
    req.open("GET", url, true);
    req.onload = onComplete;
    req.ontimeout = onFail;
    req.onabort = onFail;
    req.onerror = onFail;
    req.send();
}

function aboutJsonHandler(tab) {
    if (tab.url == "about:json") {
        const tableID = sessionStore.getTabValue(viewFor(tab),'tabID');
        const orginTabObj = ss.storage.tabs[tableID] || {},
            tabURL = orginTabObj["url"] || '',
            jsonStr = orginTabObj["json"] || HELLO_JSON;

        tab.title = "Json Editor";
        attach(Style({uri: './app.min.css'}), tab);

        var worker = tab.attach({
            contentScriptFile: [self.data.url("app.min.js"), self.data.url("handler.js")],
            contentScriptOptions: {"jsonText": jsonStr, "url": tabURL}
        });
        worker.port.on("copy", function (content) {
            clipboard.set(content);
        });
        worker.port.on("reload", function (url) {
            try {
                downloadFile(url, function () {
                    const tableID = sessionStore.getTabValue(viewFor(tab),'tabID');
                    ss.storage.tabs[tableID]['url'] = url;
                    ss.storage.tabs[tableID]['json'] = this.responseText;
                    worker.port.emit('reloadSuccess', this.responseText);
                }, function () {
                    worker.port.emit('reloadFail');
                });
            } catch (e) {
                worker.port.emit('reloadFail', e.name);
            }
        });
        return true
    }
    return false
}

function normalPageHandler(tab) {
    const type = tab.contentType.toLowerCase();
    const bodyStr = getTextFromTab(tab);
    if (type == "application/json" || type == "text/json" || checkIsJsonData(bodyStr)) {
        tabs.open({
            url: 'about:json',
            onOpen: function onOpen(newTab) {
                sessionStore.setTabValue(viewFor(newTab),'tabID',newTab.id);
                ss.storage.tabs[newTab.id] = {"json": bodyStr, "url": tab.url,"time":(new Date()).getTime()};
            }
        });
        tab.close();
        var window = require("sdk/window/utils").getMostRecentBrowserWindow();
        sessionStore.forgetClosedTab(window,0);
    }
}

tabs.on('ready', function (tab) {
    if (aboutJsonHandler(tab)) return;
    normalPageHandler(tab)
});