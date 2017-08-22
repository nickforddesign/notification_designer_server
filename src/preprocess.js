const sass = require('node-sass')

module.exports = function preprocess (data) {
  const output = sass.renderSync({
    data,
    includePaths: [
      './data/scss/'
    ]
  })
  return output.css.toString()
}

