const split = document.getElementById('split');
const codeContainer = document.getElementById("codeEditor");
const treeContainer = document.getElementById("treeEditor");

const minWidth = 250;
const leftSpace = codeContainer.offsetLeft;
const maxWidth = document.documentElement.clientWidth - leftSpace * 2 - split.offsetWidth - minWidth;

const initSplitValue = localStorage.getItem('spliter');
if (initSplitValue) {
  codeContainer.setAttribute('style', `flex: 0 0 ${initSplitValue}px`);
}

function saveData(data) {
  localStorage.setItem('data', JSON.stringify(data));
}

function loadData() {
  const json = `{
    "Array": [1, 2, 3],
    "Boolean": true,
    "Null": null,
    "Number": 123,
    "Object": { "a": "b", "c": "d" },
    "String": "Hello World"
  }`;
  const data = localStorage.getItem('data') || json;
  return JSON.parse(data);
}

function onBodyMove(e) {
  let w = e.pageX - leftSpace;
  if (w > maxWidth) {
    w = maxWidth;
  } else if (w < minWidth) {
    w = 250;
  }
  codeContainer.setAttribute('style', `flex: 0 0 ${w}px`);
  localStorage.setItem('spliter', w);
  codeEditor.aceEditor.resize(true);
}

function onBodyUp() {
  split.classList.remove('hover');
  document.body.classList.remove('block');
  document.body.removeEventListener('mousemove', onBodyMove);
}

document.body.addEventListener('mouseup', onBodyUp);

split.addEventListener('mousedown', function (e) {
  document.body.classList.add('block');
  split.classList.add('hover');
  document.body.addEventListener('mousemove', onBodyMove);
});

var options = {
  mode: 'tree',
  onChange: function () {
    try {
      const data = treeEditor.get();
      saveData(data);
      codeEditor.set(data);
    } catch (e) {
      // codeEditor.set({});
    }
  }
};
var treeEditor = new JSONEditor(treeContainer, options);
var codeOptions = {
  mode: "code",
  onChange: function () {
    try {
      const data = codeEditor.get();
      saveData(data);
      treeEditor.set(data);
    } catch (e) {
      // treeEditor.set({});
    }
  }
};
var codeEditor = new JSONEditor(codeContainer, codeOptions);

codeEditor.set(loadData());
treeEditor.set(loadData());
