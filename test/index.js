const plugin = require('../');

const test = require('ava');
const { transform } = require('@babel/core');
const { readFile, writeFile, readdirSync } = require('mz/fs');
const { fromFile } = require('hasha');
const { default: ForEach } = require('apr-for-each');
const Flatten = require('lodash.flatten');
const list = require('ls-all');
const { default: Map } = require('apr-map');
const mdx = require('@mdx-js/mdx');
const MkDir = require('make-dir');
const { join, relative, sep } = require('path');
const prettier = require('prettier');
const Parallel = require('apr-parallel');
const rollup = require('rollup');
const React = require('react');
const ReactDOM = require('react-dom/server');
const virtual = require('@rollup/plugin-virtual');
const vfile = require('to-vfile');
const unified = require('unified');

const FIXTURES = join(__dirname, 'fixtures');
const OUTPUTS = join(__dirname, 'outputs');

const mp4 = `
import React from 'react';

export default ({ src }) => {
  return React.createElement("video", {
      controls: "controls",
      autoplay: true,
      loop: true
    }, React.createElement("source", {
      type: "video/mp4",
      src: src
    }),
  );
};
`;

const compileJsx = async (filepath, options) => {
  const config = await prettier.resolveConfig(__filename);

  const prettify = (str) => {
    return prettier.format(str, { ...config, parser: 'html' });
  };

  const src = await readFile(filepath);
  const jsx = await mdx(src, {
    commonmark: true,
    gfm: true,
    filepath,
    remarkPlugins: [
      /prism\.md$/.test(filepath)
        ? [
            require('remark-prism'),
            {
              plugins: [
                'autolinker',
                'command-line',
                'data-uri-highlight',
                'diff-highlight',
                'inline-color',
                'keep-markup',
                'line-numbers',
                'treeview',
              ],
            },
          ]
        : null,
      [plugin, options],
    ].filter(Boolean),
  });

  const { code } = transform(jsx.replace(/^\/\*\s*?@jsx\s*?mdx\s\*\//, ''), {
    sourceType: 'module',
    presets: [require.resolve('@babel/preset-react')],
  });

  const bundle = await rollup.rollup({
    input: 'main.js',
    treeshake: true,
    plugins: [
      virtual({
        'mp4.js': mp4,
        'main.js': "import React from 'react';\n"
          .concat(`const mdx = React.createElement;\n`)
          .concat(code),
      }),
      require('rollup-plugin-babel')({
        sourceType: 'module',
        presets: [require.resolve('@babel/preset-react')],
      }),
    ],
  });

  const result = await bundle.generate({
    format: 'iife',
    name: 'Main',
    exports: 'named',
    globals: {
      react: 'React',
    },
  });

  // eslint-disable-next-line no-new-func
  const fn = new Function('React', `${result.output[0].code};\nreturn Main;`);
  const element = React.createElement(fn(React).default);

  return prettify(ReactDOM.renderToStaticMarkup(element));
};

const compileHtml = async (filepath, options) => {
  const config = await prettier.resolveConfig(__filename);

  const prettify = (str) => {
    return prettier.format(str, { ...config, parser: 'html' });
  };

  return new Promise((resolve, reject) => {
    const file = vfile.readSync(filepath);
    let compiler = unified().use(require('remark-parse'));

    if (/prism\.md$/.test(filepath)) {
      compiler = compiler.use(require('remark-prism'), {
        plugins: [
          'autolinker',
          'command-line',
          'data-uri-highlight',
          'diff-highlight',
          'inline-color',
          'keep-markup',
          'line-numbers',
          'treeview',
        ],
      });
    }

    return compiler
      .use(plugin, options)
      .use(require('remark-stringify'))
      .use(require('remark-html'))
      .process(file, (err, file) => {
        if (err) {
          return reject(err);
        }

        return resolve(prettify(String(file)));
      });
  });
};

const compileAll = async (name, options = {}) => {
  const filepath = join(FIXTURES, `${name}.md`);
  const { outputName = name, destinationDir, ...opts } = options;

  const htmlDestDir = join(destinationDir, outputName, 'html');
  const jsxDestDir = join(destinationDir, outputName, 'jsx');

  await ForEach([htmlDestDir, jsxDestDir], async (fullpath) => MkDir(fullpath));

  const { html, jsx } = await Parallel({
    html: async () => {
      const output = await compileHtml(filepath, {
        ...opts,
        destinationDir: htmlDestDir,
        staticPath: '/',
      });

      await writeFile(join(htmlDestDir, 'index.html'), output);
      return output;
    },
    jsx: async () => {
      const output = await compileJsx(filepath, {
        ...opts,
        destinationDir: jsxDestDir,
        staticPath: '/',
      });

      await writeFile(join(jsxDestDir, 'index.html'), output);
      return output;
    },
  });

  const files = Flatten(
    await Map(
      await list([htmlDestDir, jsxDestDir], { recurse: true }),
      async (entry) => {
        const handleFiles = async ({ path: fullpath, files = [], mode }) => {
          const { dir } = mode;
          const hash = dir ? null : await fromFile(fullpath);
          const pathname = relative(__dirname, fullpath);

          return [dir ? undefined : { pathname, hash }].concat(
            await Map(files, handleFiles),
          );
        };

        return Flatten((await handleFiles(entry)).filter(Boolean));
      },
    ),
  );

  return [html, jsx, files];
};

const fixtures = readdirSync(FIXTURES)
  .filter((filename) => /\.md$/.test(filename))
  .map((filename) => filename.replace(/\.md$/, ''));

for (const name of fixtures) {
  test(name, async (t) => {
    const [html, jsx, files] = await compileAll(name, {
      destinationDir: OUTPUTS,
    });

    t.snapshot(html);
    t.snapshot(jsx);
    t.snapshot(files);
  });
}

test('buildUrl', async (t) => {
  const [html, jsx, files] = await compileAll('all', {
    outputName: 'build-url',
    destinationDir: OUTPUTS,
    buildUrl: ({ filename, fullpath }) => {
      const splitFullPath = fullpath.split(sep);
      const lastPathPart = splitFullPath.pop();
      if (lastPathPart.match('index')) {
        splitFullPath.pop();
      }

      const relativePath = relative(
        splitFullPath.join(sep),
        join(__dirname, 'pages'),
      );

      return join(relativePath, 'md-media-copies', filename).replace(
        /\\/g,
        '/',
      );
    },
  });

  t.snapshot(html);
  t.snapshot(jsx);
  t.snapshot(files);
});

test('transformAsset', async (t) => {
  const [html, jsx, files] = await compileAll('all', {
    outputName: 'transform-asset',
    destinationDir: OUTPUTS,
    transformAsset: () => null,
  });

  t.snapshot(html);
  t.snapshot(jsx);
  t.snapshot(files);
});
