(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(factory());
}(this, (function () { 'use strict';

function loadSpliterWidth() {
  return Number.parseInt(localStorage.getItem('spliter') || 0)
}

function saveSpliterWidth(w) {
  localStorage.setItem('spliter', w);
}

function saveJSONData(data) {
  var rs = typeof data === 'string' ? data : JSON.stringify(data);
  localStorage.setItem('data', rs);
}

function loadJSONData() {
  var json = "{\n    \"Array\": [1, 2, 3],\n    \"Boolean\": true,\n    \"Null\": null,\n    \"Number\": 123,\n    \"Object\": { \"a\": \"b\", \"c\": \"d\" },\n    \"String\": \"Hello World\"\n  }";
  var data = localStorage.getItem('data') || json;
  return JSON.parse(data);
}

var codeContainer$1 = document.getElementById("codeEditor");
var treeContainer$1 = document.getElementById("treeEditor");

var treeOptions = {
  mode: 'tree',
  onChange: function () {
    try {
      var data = treeEditor.get();
      saveJSONData(data);
      codeEditor.set(data);
    } catch (e) {
      // codeEditor.set({});
    }
  }
};
var treeEditor = new JSONEditor(treeContainer$1, treeOptions);

var codeOptions = {
  mode: 'code',
  onError: function (err) {
    alert(err.toString());
  },
  onChange: function () {
    try {
      var data = codeEditor.get();
      saveJSONData(data);
      treeEditor.set(data);
    } catch (e) {
      // treeEditor.set({});
    }
  }
};

var codeEditor = new JSONEditor(codeContainer$1, codeOptions);

var initData = loadJSONData();
codeEditor.set(initData);
treeEditor.set(initData);

function updateEditorData(data) {
  var fn = typeof data !== 'string' ? 'set' : 'setText';
  codeEditor[fn](data);
  treeEditor[fn](data);
  saveJSONData(data);
}

var MIN_WIDTH = 250;
var PADDING_SPACE = 10;

var split = document.getElementById('split');
var codeContainer = document.getElementById("codeEditor");
var treeContainer = document.getElementById("treeEditor");

var widthLeft;
var maxWidth;
var ratio;

function resizeView(w) {
  if ( w === void 0 ) w = 0;

  widthLeft = document.documentElement.clientWidth - PADDING_SPACE * 2 - split.offsetWidth;
  maxWidth = widthLeft - MIN_WIDTH;
  // console.log('w', w);
  w = w ? Number.parseInt(w) : widthLeft / 2;
  ratio = w / document.documentElement.clientWidth;
  codeContainer.setAttribute('style', ("width:" + w + "px"));
  split.setAttribute('style', ("left:" + w + "px"));
  treeContainer.setAttribute('style', ("left:" + (w + split.offsetWidth) + "px"));
  codeEditor.aceEditor.resize();
}

function initEvent() {
  split.addEventListener('mousedown', function (e) {
    document.body.classList.add('block');
    split.classList.add('hover');
    document.body.addEventListener('mousemove', onBodyMove);
  });

  function onBodyMove(e) {
    var w = e.pageX - PADDING_SPACE;
    if (w > maxWidth) {
      w = maxWidth;
    } else if (w < MIN_WIDTH) {
      w = MIN_WIDTH;
    }
    resizeView(w);
    saveSpliterWidth(w);
  }

  function onBodyUp() {
    split.classList.remove('hover');
    document.body.classList.remove('block');
    document.body.removeEventListener('mousemove', onBodyMove);
  }

  function onResize() {
    var w = ratio * document.documentElement.clientWidth;
    resizeView(w);
    console.log(codeContainer.offsetWidth, ratio);
  }

  window.addEventListener('mouseup', onBodyUp);
  window.addEventListener('resize', onResize);

  document.body.addEventListener('dragenter', function (e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('enter');
  });

  document.body.addEventListener('drop', function (e) {
    e.preventDefault();
    e.stopPropagation();
    var f = e.dataTransfer.files[0];
    var r = new FileReader();
    r.onload = function () {
      updateEditorData(this.result);
    };
    r.readAsText(f);
  });

  document.body.addEventListener('dragover', function (e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('over');
  });
}

initEvent();

// load width from localstorage
resizeView(loadSpliterWidth());

})));
