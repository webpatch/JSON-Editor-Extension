"use strict";

const tabs = require("sdk/tabs");
const self = require("sdk/self");
const fileIO = require("sdk/io/file");

const { attach, detach } = require('sdk/content/mod');
const { Style } = require('sdk/stylesheet/style');


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
        const str = '<!DOCTYPE HTML><html><head><meta http-equiv="Content-Type" content="text/html;charset=utf-8"></head><body><div id="header" style="display:none"><a href="http://jsoneditoronline.org" class="header"><img alt="JSON Editor Online" title="JSON Editor Online" src="img/logo.png" id="logo"></a><div id="name-menu"><div id="name" title="Document name. Click to change"></div><div id="name-status" title="Changes are automatically saved online"></div></div><div id="menu"><ul><li><a id="new" title="Open a new, empty document">New</a></li><li><a id="open" title="Open file">          Open <span class="dropDownIcon">&#x25BC;</span></a><ul id="openMenu"><li><a id="openFromDisk" title="Open file from disk">Open from disk</a></li><li><a id="openUrl" title="Open file from url">Open url</a></li><li id="filesList"></li></ul></li><li><a id="save" title="Save file">          Save <span class="dropDownIcon">&#x25BC;</span></a><ul id="saveMenu"><li><a id="saveToDisk" title="Save file to disk">Save to disk</a></li><li><a id="saveOnline" title="Save and share online">Save online</a></li></ul></li><li><a id="help" title="Open documentation (opens in a new window)" href="doc/index.html" target="_blank">Help</a></li></ul></div></div><div id="auto"><div id="contents"><div id="codeEditor"></div><div id="splitter"><div id="buttons"><div><button id="toTree" class="convert" title="Copy code to tree editor (Ctrl + >)"><div class="convert-right"></div></button></div><div><button id="toCode" class="convert" title="Copy tree to code editor (Ctrl + <)"><div class="convert-left"></div></button></div></div><div id="drag"></div></div><div id="treeEditor"></div></div></div></div>';
        // console.log('! Writing a respones')
        response.end(str);
        console.log('<<<', JSON.stringify(response, '', '  '));
    }
})

exports.handler.register();


var button = ActionButton({
    id: "json-button",
    label: "Open json editor",
    icon: {
      "16": "./16.png",
      "32": "./32.png"
    },
    onClick: function(state) {
        tabs.open('about:json')
    }
});
//exports.handler.unregister()

var style = Style({
    uri: './app.min.css'
});

function checkIsJsonData(sData) {
    var isJson = false;
    if (sData && sData.match(/^\s*[\[\{]/)) {
        if (typeof JSON.parse(sData) === 'object') {
            isJson = true;
        }
    }
    return isJson;
}

function getTextFromTab(tab) {
    var lowLevelTab = viewFor(tab);
    var browser = tab_utils.getBrowserForTab(lowLevelTab);
    return browser.contentDocument.body.textContent;
}


var openTabs = {};
var linkedTabs = {};


function aboutJsonHandler(tab) {
    if (tab.url == "about:json") {
        const orginTabObj = openTabs[tab.id] || {},
            tabTitle = orginTabObj["title"] || "Json Editor",
            jsonStr = orginTabObj["json"] || "{}";
        tab.title = tabTitle;
        attach(style, tab);
        var worker = tab.attach({
            contentScriptFile: [self.data.url("app.min.js"),self.data.url("handler.js")],
            contentScriptOptions: {jsonText: jsonStr},
        });
        worker.port.on("copy",function(content){
        	clipboard.set(content);
        })
        return true
    }
    return false
}


function normalPageHandler(tab) {
    var type = tab.contentType.toLowerCase();
    const bodyStr = getTextFromTab(tab);
    if (type == "application/json" || type == "text/json" || checkIsJsonData(bodyStr)) {
        //当前Tab是否有链接的Tab
        const linkTab = linkedTabs[tab.id];
        if (linkTab === undefined) {
            tabs.open({
                url: 'about:json',
                onOpen: function onOpen(newTab) {
                    linkedTabs[tab.id] = newTab;
                    openTabs[newTab.id] = {"json": bodyStr, "title": tab.title};
                },
                onClose: function onClose(closeTab) {
                    for (var tabId in linkedTabs) {
                        if (linkedTabs[tabId] == closeTab) {
                            delete linkedTabs[tabId];
                            break;
                        }
                    }
                }
            });
        } else {
            openTabs[linkTab.id] = {"json": bodyStr, "title": tab.title};
            linkTab.reload();
            linkTab.activate();
        }
    }
}

tabs.on('ready', function (tab) {
    if (aboutJsonHandler(tab)) return;
    normalPageHandler(tab)
});