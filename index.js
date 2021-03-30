const cheerio = require('cheerio');
const Cp = require('cp-file');
const { default: ForEach } = require('apr-for-each');
const Intercept = require('apr-intercept');
const isRelativeUrl = require('is-relative-url');
const { readFile, exists } = require('mz/fs');
const { dirname, resolve, basename, extname, join, sep } = require('path');
const revHash = require('rev-hash');
const UniqBy = require('lodash.uniqby');

// https://github.com/syntax-tree/unist-util-map/blob/bb0567f651517b2d521af711d7376475b3d8446a/index.js
const map = async (tree, iteratee) => {
  const bound = (node) => async (child, index) => {
    return preorder(child, index, node);
  };

  const preorder = async (node, index, parent) => {
    const [, newNode = {}] = await Intercept(iteratee(node, index, parent));
    const { children = [] } = newNode || node;

    return {
      ...node,
      ...newNode,
      children: await Promise.all(children.map(bound(node))),
    };
  };

  return preorder(tree, null, null);
};

const defaultUrlBuilder = ({ filename, staticPath }) => {
  return resolve('/', staticPath, filename);
};

module.exports = (opts = {}) => {
  const {
    destinationDir,
    staticPath = '/',
    ignoreFileExtensions = [],
    buildUrl = defaultUrlBuilder,
    selectors: customSelectors = [],
    transformAsset,
  } = opts;

  return async (tree, { cwd, path }) => {
    const assets = [];

    const handleUrl = async (url) => {
      const platformNormalizedUrl = url.replace(/[\\/]/g, sep);
      if (!isRelativeUrl(platformNormalizedUrl)) {
        return;
      }

      const ext = extname(platformNormalizedUrl);
      if (!ext || ignoreFileExtensions.includes(ext)) {
        return;
      }

      const fullpath = resolve(
        cwd,
        path ? dirname(path) : '',
        platformNormalizedUrl,
      );

      if (!(await exists(fullpath))) {
        return;
      }

      const rev = revHash(await readFile(fullpath));
      const name = basename(fullpath, ext);
      const filename = `${name}-${rev}${ext}`;

      return {
        fullpath,
        filename,
        url: buildUrl({
          staticPath,
          filename,
          fullpath,
          name,
          rev,
        }),
      };
    };

    const handlers = {
      html: async (node, { selectors: sels = [] } = {}) => {
        let { value: newValue = '' } = node;
        const $ = cheerio.load(newValue);

        const selectors = [
          ['img[src]', 'src'],
          ['video source[src]', 'src'],
          ['video[src]', 'src'],
          ['audio source[src]', 'src'],
          ['audio[src]', 'src'],
          ['video[poster]', 'poster'],
          ['object param[value]', 'value'],
          ['a[href]', 'href'],
        ].concat(sels);

        const urls = selectors
          .concat(customSelectors)
          .reduce((memo, [selector, attr]) => {
            return memo.concat(
              $(selector)
                .toArray()
                .map(({ attribs }) => attribs[attr]),
            );
          }, []);

        await ForEach(urls, async (url) => {
          const nUrl = await handleUrl(url);
          const asset = transformAsset ? await transformAsset(nUrl) : nUrl;

          if (!asset) {
            return;
          }

          assets.push(asset);
          const { url: newUrl } = asset;
          newValue = newValue.replace(new RegExp(url, `g`), newUrl);
        });

        return Object.assign(node, {
          value: newValue,
        });
      },
      url: async (node) => {
        const nUrl = await handleUrl(node.url);
        const asset = transformAsset ? await transformAsset(nUrl) : nUrl;

        assets.push(asset);
        return Object.assign(node, {
          url: asset ? asset.url || node.url : node.url,
        });
      },
      link: (...args) => handlers.url(...args),
      definition: (...args) => handlers.url(...args),
      image: (...args) => handlers.url(...args),
      jsx: (...args) => {
        return handlers.html(...args, {
          selectors: [
            ['[poster]', 'poster'],
            ['[src]', 'src'],
            ['[href]', 'href'],
          ],
        });
      },
    };

    const newTree = await map(tree, async (node) => {
      try {
        return handlers[node.type] ? handlers[node.type](node) : node;
      } catch (err) {
        console.error(err);
        return node;
      }
    });

    await ForEach(
      UniqBy(assets.filter(Boolean), 'filename'),
      async ({ fullpath, filename }) => {
        await Cp(fullpath, join(destinationDir, filename));
      },
    );

    return newTree;
  };
};
