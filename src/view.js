import { codeEditor, updateEditorData } from './editor';
import { loadSpliterWidth, saveSpliterWidth } from './data';

const MIN_WIDTH = 250;
const PADDING_SPACE = 10;

const split = document.getElementById('split');
const codeContainer = document.getElementById("codeEditor");
const treeContainer = document.getElementById("treeEditor");

let widthLeft;
let maxWidth;
let ratio;

function resizeView(w = 0) {
  widthLeft = document.documentElement.clientWidth - PADDING_SPACE * 2 - split.offsetWidth;
  maxWidth = widthLeft - MIN_WIDTH;
  // console.log('w', w);
  w = w ? Number.parseInt(w) : widthLeft / 2;
  ratio = w / document.documentElement.clientWidth;
  codeContainer.setAttribute('style', `width:${w}px`);
  split.setAttribute('style', `left:${w}px`);
  treeContainer.setAttribute('style', `left:${w + split.offsetWidth}px`);
  codeEditor.aceEditor.resize();
}

function initEvent() {
  split.addEventListener('mousedown', function (e) {
    document.body.classList.add('block');
    split.classList.add('hover');
    document.body.addEventListener('mousemove', onBodyMove);
  });

  function onBodyMove(e) {
    let w = e.pageX - PADDING_SPACE;
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
    const w = ratio * document.documentElement.clientWidth;
    resizeView(w);
    console.log(codeContainer.offsetWidth, ratio);
  }

  window.addEventListener('mouseup', onBodyUp);
  window.addEventListener('resize', onResize);

  document.body.addEventListener('dragenter', function (e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('enter');
  })

  document.body.addEventListener('drop', function (e) {
    e.preventDefault();
    e.stopPropagation();
    const f = e.dataTransfer.files[0];
    const r = new FileReader();
    r.onload = function () {
      updateEditorData(this.result)
    };
    r.readAsText(f);
  });

  document.body.addEventListener('dragover', function (e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('over');
  })
}

initEvent();

// load width from localstorage
resizeView(loadSpliterWidth());


