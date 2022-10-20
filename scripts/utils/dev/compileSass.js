const path = require("path");
const { cssPath, scssPath } = require("../paths");
const { execSync } = require("child_process");
const { cssOutputArray } = require('./outputHTMLandJS')


const compileSass = (cssArray) => {
  const sassCompileString = `
    sass --watch --style=expanded --no-source-map ${
      path.resolve(scssPath, 'globalStyles.scss')
    }:${
      path.resolve(cssPath, 'globalStyles.css')
    } ${
      cssArray.join(' ')
    }`.trim();
  execSync(sassCompileString);
};

compileSass(cssOutputArray)