const path = require("path");
const { readFileSync, readdirSync } = require("node:fs");
const { platform } = require("os");
const { rootDir, jsPath, htmlPath, scssPath } = require('../paths')
const { findFiles, outputFiles } = require('..')

const OS = platform()


const outputHTMLandJS = () => {
  const htmlFilesArray = [];
  const htmlOutputArray = [];
  const jsEntriesArray = [];
  const jsOutputArray = [];
  findFiles(`${rootDir}/src/pages`, ".html", htmlFilesArray);
  findFiles(`${rootDir}/src/js`, ".js", jsEntriesArray);

  const pageStylesDir = readdirSync(path.resolve(scssPath, 'pages'), { withFileTypes: true })

  htmlFilesArray.forEach((file) => {
    const fileContents = readFileSync(file.path);

    const matchingPageStyle = pageStylesDir.find(
      (item) => item.name.includes(
        file.name === "index" 
        ? item.name.includes('home') 
          ? "home"
          : "index"
        : file.name
      )
    )

    let fileExtension 
    let mainCSSLink
    let contentsWithStyles
    let contentsWithStylesAndJS

    const globalCSSLink = '\t<link rel="stylesheet" href="css/globalStyles.css">'

    if (matchingPageStyle && matchingPageStyle.isDirectory()) {
      mainCSSLink = `\t<link rel="stylesheet" href="css/${file.name === "index" ? "home" : file.name}/index.css">`
    } else if (matchingPageStyle && !matchingPageStyle.isDirectory()) {
      fileExtension = path.extname(matchingPageStyle.name)

      mainCSSLink = `\t<link rel="stylesheet" href="css/${matchingPageStyle.name.substring(0, matchingPageStyle.name.indexOf(fileExtension))}.css">`
    }

    const lines = fileContents.toString().split(OS === "win32" ? "\r" : "\n");
    const injectStylesIndex = lines.findIndex((line) => line.includes('</title>'))

    lines.splice(injectStylesIndex, 0, globalCSSLink)

    if (mainCSSLink) {
      lines.splice(injectStylesIndex + 1, 0, mainCSSLink)
    }

    if (jsEntriesArray.length !== 0) {
      const matchingJsEntry = jsEntriesArray.find(
        (jsEntry) => jsEntry.parentDir ? path.basename(jsEntry.parentDir) === file.name : jsEntry.name === file.name
      );

      if (matchingJsEntry) {
        const scriptTag = `\t<script src="./js/${matchingJsEntry.parentDir ? path.basename(matchingJsEntry.parentDir)+'/' : ''}${matchingJsEntry.name}.js"></script>`;

        lines.splice(lines.length - 2, 0, scriptTag)
        contentsWithStylesAndJS = lines.join(OS === "win32" ? "\r" : "\n")
  
        htmlOutputArray.push({
          name: file.name,
          ext: file.ext,
          destinationPath: htmlPath,
          content: contentsWithStylesAndJS,
        });
      } else {
        contentsWithStyles = lines.join(OS === "win32" ? "\r" : "\n")

        htmlOutputArray.push({
          name: file.name,
          ext: file.ext,
          destinationPath: htmlPath,
          content: contentsWithStyles,
        });
      }
    } else {
      contentsWithStyles = lines.join(OS === "win32" ? "\r" : "\n")

      htmlOutputArray.push({
        name: file.name,
        ext: file.ext,
        destinationPath: htmlPath,
        content: contentsWithStyles,
      });
    }
  });

  if (jsEntriesArray.length != 0) {
    jsEntriesArray.forEach((entry) => {
      const fileContents = readFileSync(entry.path);
      if (entry.parentDir) {
        jsOutputArray.push({
          name: entry.name,
          ext: entry.ext,
          destinationPath: path.resolve(jsPath, path.basename(entry.parentDir)),
          parentDir: entry.parentDir,
          content: fileContents,
        });
      } else {
        jsOutputArray.push({
          name: entry.name,
          ext: entry.ext,
          destinationPath: jsPath,
          content: fileContents,
        });
      }
    })
    outputFiles(htmlOutputArray, jsOutputArray)
  } else {
    outputFiles(htmlOutputArray);
  }
};

outputHTMLandJS()
