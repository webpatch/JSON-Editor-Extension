const rollup = require('rollup');
const buble = require('rollup-plugin-buble');
const uglify = require('uglify-js');
const fs = require('fs-extra');
const commonjs = require('rollup-plugin-commonjs');
const resolve = require('rollup-plugin-node-resolve');

const dist = (i = '') => `js/${i}`;
fs.removeSync(dist());
fs.ensureDirSync(dist());

const input_browser = {
  input: 'src/index.js',
  plugins: [resolve(), commonjs(), buble()],
};

const output_browser = {
  file: dist('json-editor.js'),
  miniFile: dist('json-editor.min.js'),
  format: 'umd',
  name: 'dz',
};

async function build(input, output) {
  const bundle = await rollup.rollup(input);
  let { code } = await bundle.generate(output);
  if (output.prefix) code = fs.readFileSync(output.prefix, 'utf8') + '\n' + code;
  fs.outputFileSync(output.file, code);

  if (output.miniFile) {
    const minified = uglify.minify(code).code;
    fs.outputFileSync(output.miniFile, minified);
  }
}

build(input_browser, output_browser);
