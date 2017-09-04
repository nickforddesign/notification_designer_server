const utils = require('./src/utils');

(async () => {
  let output = {}
  const dirs = {
    templates: 'data/templates/',
    partials: 'data/partials/',
    styles: 'data/styles/',
    globals: 'data/globals/'
  }

  for (let key in dirs) {
    const paths_array = await utils.readdirRecursive(dirs[key])
    const short_paths_array = utils.shortenPaths(dirs[key], paths_array)
    const tree = utils.pathsToTree(short_paths_array, dirs[key])
    console.log(JSON.stringify(tree, null, 4))
    const files = utils.treeToArray(tree)
    output[key] = files
  }
  // console.log(JSON.stringify(output, null, 4))
})()
