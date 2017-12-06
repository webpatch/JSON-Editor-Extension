export function loadSpliterWidth() {
  return Number.parseInt(localStorage.getItem('spliter') || 0)
}

export function saveSpliterWidth(w) {
  localStorage.setItem('spliter', w)
}

export function saveJSONData(data) {
  const rs = typeof data === 'string' ? data : JSON.stringify(data);
  localStorage.setItem('data', rs);
}

export function loadJSONData() {
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