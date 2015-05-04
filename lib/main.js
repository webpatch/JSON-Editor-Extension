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
        loader.readURI(self.data.url("editor.html"),{sync:true}).then(function success(value) {
          response.end(value);
        }, function failure(reason) {
          response.end(reason);
        });
        console.log('<<<', JSON.stringify(response, '', '  '));
    }
})

exports.handler.register();


function readTextFromFile(filename) {
  var text = null;
  if (fileIO.exists(filename)){
    var TextReader = fileIO.open(filename, "r");
    if (!TextReader.closed) {
      text = TextReader.read();
      TextReader.close();
    }
  }
  return text;
}

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
const HELLO_JSON = '{"array":[1,2,3],"boolean":true,"null":null,"number":123,"object":{"a":"b","c":"d","e":"f"},"string":"Hello World"}';

function downloadFile(url,onComplete,onFail)
{
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
        const orginTabObj = openTabs[tab.id] || {},
            tabTitle = orginTabObj["title"] || '',
            jsonStr = orginTabObj["json"] || HELLO_JSON;
        tab.title = "Json Editor";
        attach(style, tab);
        var worker = tab.attach({
            contentScriptFile: [self.data.url("app.min.js"),self.data.url("handler.js")],
            contentScriptOptions: {jsonText: jsonStr,url:tabTitle},
        });
        worker.port.on("copy",function(content){
        	clipboard.set(content);
        })
        worker.port.on("reload",function(url){
            try{
                downloadFile(url,function(){
                    worker.port.emit('reloadSuccess',this.responseText);
                },function(){
                    worker.port.emit('reloadFail');
                });
            }catch(e){
                worker.port.emit('reloadFail',e.name);
            }
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