"use strict";
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
})

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

var style = Style({
    uri: './app.min.css'
});

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


var openTabs = {};
var linkedTabs = {};
const HELLO_JSON = '{"array":[1,2,3],"boolean":true,"null":null,"number":123,"object":{"a":"b","c":"d","e":"f"},"string":"Hello World"}';

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
        console.log('About jsonID ->:::'+ tab.id)
        const orginTabObj = openTabs[tab.id] || {},
            tabURL = orginTabObj["url"] || '',
            jsonStr = orginTabObj["json"] || HELLO_JSON;

        tab.title = "Json Editor";
        attach(style, tab);

        var worker = tab.attach({
            contentScriptFile: [self.data.url("app.min.js"), self.data.url("handler.js")],
            contentScriptOptions: {"jsonText": jsonStr, "url": tabURL}
        });
        worker.port.on("copy", function (content) {
            clipboard.set(content);
        });
        worker.port.on("reload", function (url) {
            // console.log('worker id: '+ worker.tab.id)
            try {
                downloadFile(url, function () {
                    openTabs[ worker.tab.id]['url'] = url
                    openTabs[ worker.tab.id]['json'] = this.responseText
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
        const tabURL = tab.url;
        console.log('to jsonID ->:::'+ tab.id)
        openTabs[tab.id] = {"json": bodyStr, "url": tabURL};
        tab.url = 'about:json';
        // tab.close = function (){
        //     console.log('fuck ---------------->')
        //     tab.url = tabURL;
        //     // delete openTabs[tab.id];
        // }
        // // tabs.open({
        // //     url: 'about:json',
        // //     onOpen: function onOpen(newTab) {
        // //         openTabs[newTab.id] = {"json": bodyStr, "url": tab.url};
        // //     },
        // //     onClose: function onClose(closeTab) {
        // //         delete openTabs[closeTab.id];
        // //     }
        // // });
        // // tab.close();
    }
}

tabs.on('ready', function (tab) {
    if (aboutJsonHandler(tab)) return;
    normalPageHandler(tab)
});