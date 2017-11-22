const split = document.getElementById('split');
var treeContainer = document.getElementById("treeEditor");
var codeContainer = document.getElementById("codeEditor");

function onBodyMove(e) {
  let w = e.pageX - 10;
  const tw = document.documentElement.clientWidth - 30 - 250;
  if (w > tw) {
    w = tw;
  } else if (w < 250) {
    w = 250;
  }
  codeContainer.setAttribute('style', `flex: 0 0 ${w}px`);
  treeEditor.refresh();
  codeEditor.aceEditor.resize(true);
}

function onBodyUp() {
  split.classList.remove('hover');
  document.body.classList.remove('block');
  document.body.removeEventListener('mousemove', onBodyMove);
}

document.body.addEventListener('mouseup', onBodyUp);

split.addEventListener('mousedown', function (e) {
  // console.log(e.pageX, e.pageY);
  document.body.classList.add('block');
  split.classList.add('hover');
  document.body.addEventListener('mousemove', onBodyMove);
});

var options = {
  mode: 'tree',
  onChange: function () {
    try {
      // codeEditor.set(treeEditor.get());
    } catch (e) {
      // codeEditor.set({});
    }
  }
};
var treeEditor = new JSONEditor(treeContainer, options);
console.log(treeEditor);
var codeOptions = {
  mode: "code",
  onChange: function () {
    console.log('changeeeeee');
    console.log();
    try {
      // treeEditor.set(codeEditor.get());
    } catch (e) {
      // treeEditor.set({});
    }
  }
};
var codeEditor = new JSONEditor(codeContainer, codeOptions);

// set json
var json = {
  "Array": [1, 2, 3],
  "Boolean": true,
  "Null": null,
  "Number": 123,
  "Object": { "a": "b", "c": "d" },
  "String": "Hello World 344444444444444444444444444444444444444sdfasdfasdfasdf"
};

codeEditor.set(json);
treeEditor.set(json);
// codeEditor.aceEditor.setReadOnly(true);
// console.log(codeEditor);