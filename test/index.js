const plugin = require('../');

const test = require('ava');
const { transform } = require('@babel/core');
const { readFile, writeFile, readdirSync } = require('mz/fs');
const mdx = require('@mdx-js/mdx');
const { join } = require('path');
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

  const { html, jsx } = await Parallel({
    html: async () => {
      const output = await compileHtml(filepath, {
        ...options,
        destinationDir: join(options.destinationDir, 'html'),
        staticPath: '/html',
      });

      await writeFile(join(OUTPUTS, `${name}.html`), output);
      return output;
    },
    jsx: async () => {
      const output = await compileJsx(filepath, {
        ...options,
        destinationDir: join(options.destinationDir, 'jsx'),
        staticPath: '/jsx',
      });

      await writeFile(join(OUTPUTS, `${name}.jsx.html`), output);
      return output;
    },
  });

  return [html, jsx];
};

const fixtures = readdirSync(FIXTURES)
  .filter((filename) => /\.md$/.test(filename))
  .map((filename) => filename.replace(/\.md$/, ''));

for (const name of fixtures) {
  test(name, async (t) => {
    const [html, jsx] = await compileAll(name, {
      destinationDir: OUTPUTS,
    });

    t.snapshot(html);
    t.snapshot(jsx);
  });
}
