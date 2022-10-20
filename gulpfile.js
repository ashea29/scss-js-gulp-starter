const path = require("path");
const { readFileSync, writeFileSync } = require("fs");
const postcss = require('gulp-postcss')
const gulp = require('gulp')
const sass = require('gulp-sass')(require('sass'))
const { cssPath } = require("./scripts/utils/paths");

const args = process.argv.splice(2)
let cssOutputStyle
let joinCharacter

if (args.indexOf('--dev') !== -1) {
  cssOutputStyle = "expanded"
  joinCharacter = "\n"
}

if (args.indexOf('--prod') !== -1) {
  cssOutputStyle = "compressed"
  joinCharacter = ""
}

gulp.task('css', function () {
  const plugins = [
    require('postcss-import'),
    require('autoprefixer')(),
    require('postcss-preset-env'),
    require('postcss-jit-props')(require('open-props'))
  ]

  return gulp.src(['./src/scss/*.scss', './src/scss/pages/**/*.scss'])
    .pipe(sass({ 
      outputStyle: cssOutputStyle
    }).on('error', sass.logError))
    .pipe(postcss(plugins))
    .pipe(gulp.dest('./dist/css'))
})

gulp.task('modifyGlobalCSS', function (done) {
  const globalOutputFile = readFileSync(path.resolve(cssPath, 'globalStyles.css'))
  let newGlobalOutputFile

  const outputToArray = globalOutputFile.toString().split("\n")
  outputToArray.shift()
  newGlobalOutputFile = outputToArray.join(joinCharacter)

  writeFileSync(
    path.resolve(cssPath, 'globalStyles.css'),
    newGlobalOutputFile,
    {}
  )

  done()
})

gulp.task('serve', gulp.series('css', 'modifyGlobalCSS', function () {
  gulp.watch(['./src/scss/*.scss', './src/scss/pages/**/*.scss'], gulp.series('css', 'modifyGlobalCSS'))
}))

gulp.task('build', gulp.series('css', 'modifyGlobalCSS'))
