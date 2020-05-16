const plugin = require('../');

const { join } = require('path');
const { readFile, writeFile } = require('mz/fs');
const prettier = require('prettier');
const remark = require('remark');
const test = require('ava');
const VFile = require('vfile');

const FIXTURES = join(__dirname, 'fixtures');
const OUTPUTS = join(__dirname, 'outputs');

const compile = async (src, options) => {
  const config = await prettier.resolveConfig(__filename);

  const handleResult = (resolve, reject) => {
    return (err, file) => {
      return err
        ? reject(err)
        : resolve(prettier.format(String(file), { ...config, parser: 'html' }));
    };
  };

  return new Promise((resolve, reject) => {
    return remark()
      .use(plugin, options)
      .use(require('remark-html'))
      .process(src, handleResult(resolve, reject));
  });
};

test('all', async (t) => {
  const path = join(FIXTURES, 'all.md');
  const contents = await readFile(path);
  const output = await compile(VFile({ path, contents }), {
    destinationDir: OUTPUTS,
  });

  await writeFile(join(OUTPUTS, 'all.html'), output);

  t.snapshot(output);
});

test('files', async (t) => {
  const path = join(FIXTURES, 'files.md');
  const contents = await readFile(path);
  const output = await compile(VFile({ path, contents }), {
    destinationDir: OUTPUTS,
  });

  await writeFile(join(OUTPUTS, 'files.html'), output);

  t.snapshot(output);
});

test('html-images', async (t) => {
  const path = join(FIXTURES, 'html-images.md');
  const contents = await readFile(path);
  const output = await compile(VFile({ path, contents }), {
    destinationDir: OUTPUTS,
  });

  await writeFile(join(OUTPUTS, 'html-images.html'), output);

  t.snapshot(output);
});

test('html-links', async (t) => {
  const path = join(FIXTURES, 'html-links.md');
  const contents = await readFile(path);
  const output = await compile(VFile({ path, contents }), {
    destinationDir: OUTPUTS,
  });

  await writeFile(join(OUTPUTS, 'html-links.html'), output);

  t.snapshot(output);
});

test('html-videos', async (t) => {
  const path = join(FIXTURES, 'html-videos.md');
  const contents = await readFile(path);
  const output = await compile(VFile({ path, contents }), {
    destinationDir: OUTPUTS,
  });

  await writeFile(join(OUTPUTS, 'html-videos.html'), output);

  t.snapshot(output);
});

test('images', async (t) => {
  const path = join(FIXTURES, 'images.md');
  const contents = await readFile(path);
  const output = await compile(VFile({ path, contents }), {
    destinationDir: OUTPUTS,
  });

  await writeFile(join(OUTPUTS, 'images.html'), output);

  t.snapshot(output);
});

test('references', async (t) => {
  const path = join(FIXTURES, 'references.md');
  const contents = await readFile(path);
  const output = await compile(VFile({ path, contents }), {
    destinationDir: OUTPUTS,
  });

  await writeFile(join(OUTPUTS, 'references.html'), output);

  t.snapshot(output);
});
