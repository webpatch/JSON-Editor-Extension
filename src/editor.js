import { loadJSONData, saveJSONData } from './data';

const codeContainer = document.getElementById("codeEditor");
const treeContainer = document.getElementById("treeEditor");

const treeOptions = {
  mode: 'tree',
  onChange: function () {
    try {
      const data = treeEditor.get();
      saveJSONData(data);
      codeEditor.set(data);
    } catch (e) {
      // codeEditor.set({});
    }
  }
};
const treeEditor = new JSONEditor(treeContainer, treeOptions);

const codeOptions = {
  mode: 'code',
  onError: function (err) {
    alert(err.toString());
  },
  onChange: function () {
    try {
      const data = codeEditor.get();
      saveJSONData(data);
      treeEditor.set(data);
    } catch (e) {
      // treeEditor.set({});
    }
  }
};

const codeEditor = new JSONEditor(codeContainer, codeOptions);

const initData = loadJSONData();
codeEditor.set(initData);
treeEditor.set(initData);

function updateEditorData(data) {
  const fn = typeof data !== 'string' ? 'set' : 'setText';
  codeEditor[fn](data);
  treeEditor[fn](data);
  saveJSONData(data);
}

export { treeEditor, codeEditor, updateEditorData };