const path = require("path");
const { execSync } = require("child_process");
const {
  existsSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} = require("node:fs");
const { Buffer } = require("node:buffer");
const { platform } = require("os");
const {
  rootDir,
  distPath,
  assetSrcPath,
  htmlPath,
  jsPath,
  cssPath,
  scssPath,
} = require("./paths");
const minifyHtml = require("@minify-html/node");
const UglifyJS = require("uglify-js");

const OS = platform();


const findFiles = (sourcePath, filter, outputArray = []) => {
  if (!existsSync(sourcePath)) {
    console.log("No directory at this path", sourcePath);
    return;
  }

  const results = readdirSync(sourcePath, { withFileTypes: true });

  for (const result of results) {
    const resultPath = path.resolve(sourcePath, result.name);
    const fileExtension = path.extname(result.name);

    if (result.isDirectory()) {
      const directoryContents = readdirSync(resultPath, {
        withFileTypes: true,
      });
      directoryContents.forEach((entry) => {
        const entryPath = path.resolve(resultPath, entry.name)
        const basename = path.basename(entryPath)
        const fileExtension = path.extname(entry.name)

        if (!entry.isDirectory()) {
          outputArray.push({
            name: entry.name.substring(0, entry.name.indexOf(fileExtension)),
            isFile: true,
            path: entryPath,
            parentDir: entryPath.substring(0, entryPath.indexOf(basename)),
            ext: fileExtension
          })
        }
      })
    } else if (!result.isDirectory() && resultPath.endsWith(filter)) {
      outputArray.push({
        name: result.name.substring(0, result.name.indexOf(fileExtension)),
        isFile: true,
        ext: fileExtension,
        path: resultPath,
      });
    }
  }
};

const outputFiles = (htmlArray = [], jsArray = []) => {
  if (existsSync(`${htmlPath}`)) {
    htmlArray.forEach((file) => {
      writeFileSync(
        `${htmlPath}${OS === "win32" ? "\\" : "/"}${file.name}${file.ext}`,
        file.content,
        {}
      );
    });
  } else {
    execSync(`mkdir ${htmlPath}`);
    htmlArray.forEach((file) => {
      writeFileSync(
        `${htmlPath}${OS === "win32" ? "\\" : "/"}${file.name}${file.ext}`,
        file.content,
        {}
      );
    });
  }

  if (jsArray && jsArray.length != 0) {
    if (!existsSync(`${jsPath}`)) {
      execSync(`mkdir ${jsPath}`);
    }
    jsArray.forEach((entry) => {
      if (!entry.parentDir) {
        writeFileSync(
          `${jsPath}${OS === "win32" ? "\\" : "/"}${entry.name}${entry.ext}`,
          entry.content,
          {}
        );
      } else if (entry.parentDir) {
        const entryBasename = path.basename(entry.parentDir)

        if (!existsSync(`${jsPath}${OS === "win32" ? "\\" : "/"}${entryBasename}`)){
          execSync(
            `mkdir ${jsPath}${OS === "win32" ? "\\" : "/"}${entryBasename}`
          );
        }

        writeFileSync(
          `${jsPath}${OS === "win32" ? "\\" : "/"}${entryBasename}${OS === "win32" ? "\\" : "/"}${entry.name}${entry.ext}`,
          entry.content,
          {}
        );
      }
    });
  }

  if (existsSync(assetSrcPath)) {
    const assetOutputPath = `${distPath}${OS === "win32" ? "\\" : "/"}assets${OS === "win32" ? "\\" : "/"}`
    if (!existsSync(assetOutputPath)) {
      execSync(
        `mkdir ${distPath}${OS === "win32" ? "\\" : "/"}assets${OS === "win32" ? "\\" : "/"}`
      );
    } 
    execSync(
      `${OS === "win32" ? "copy" : "cp"} ${assetSrcPath} ${distPath}${OS === "win32" ? "\\" : "/"}assets${OS === "win32" ? "\\" : "/"}`
    );
  }
};


const outputHTMLandJS = (cssArray) => {
  const htmlFilesArray = []
  const jsEntriesArray = []
  const minifiedHtmlArray = []
  const minifiedJSArray = []
  findFiles(`${rootDir}/src/pages`, ".html", htmlFilesArray)
  findFiles(`${rootDir}/src/js`, ".js", jsEntriesArray)

  const pageStylesDir = readdirSync(path.resolve(scssPath, 'pages'), { withFileTypes: true })

  htmlFilesArray.forEach((file) => {
    const fileContents = readFileSync(file.path)

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
    let minifiedContents
    let contentsWithStyles
    let contentsWithStylesAndJS

    let lines = fileContents.toString().split(OS === "win32" ? "\r" : "\n");
    const globalCSSLink = '\t<link rel="stylesheet" href="css/globalStyles.css">'

    if (matchingPageStyle && matchingPageStyle.isDirectory()) {
      cssArray.push(
        `${
          path.resolve(scssPath, "pages", matchingPageStyle.name)
        }${
          OS === "win32" ? "\\" : "/"
        }index.scss:${
          path.resolve(cssPath, `${matchingPageStyle.name}`)
        }${
          OS === "win32" ? "\\" : "/"
        }index.css`.trim()
      )

      mainCSSLink = `\t<link rel="stylesheet" href="css/${file.name === "index" ? "home" : file.name}/index.css">`
    } else if (matchingPageStyle && !matchingPageStyle.isDirectory()) {
      fileExtension = path.extname(matchingPageStyle.name)

      cssArray.push(
        `${
         path.resolve(scssPath, "pages", `${matchingPageStyle.name.substring(0, matchingPageStyle.name.indexOf(fileExtension))}.scss` ) 
        }:${
          path.resolve(cssPath, `${matchingPageStyle.name.substring(0, matchingPageStyle.name.indexOf(fileExtension))}.css`) 
        }`.trim()
      )

      mainCSSLink = `\t<link rel="stylesheet" href="css/${matchingPageStyle.name.substring(0, matchingPageStyle.name.indexOf(fileExtension))}.css">`
    }
    
    const injectStylesIndex = lines.findIndex((line) => line.includes('</title>'))

    lines.splice(injectStylesIndex, 0, globalCSSLink)

    if (mainCSSLink) {
      lines.splice(injectStylesIndex + 1, 0, mainCSSLink)
    }

    contentsWithStyles = lines.join(OS === "win32" ? "\r" : "\n")

    if (jsEntriesArray.length !== 0) {
      const matchingJsEntry = jsEntriesArray.find(
        (jsEntry) => jsEntry.parentDir ? path.basename(jsEntry.parentDir) === file.name : jsEntry.name === file.name
      );

      if (matchingJsEntry) {
        const scriptTag = `\t<script src="./js/${matchingJsEntry.parentDir ? path.basename(matchingJsEntry.parentDir)+'/' : ''}${matchingJsEntry.name}.js"></script>`;

        lines = contentsWithStyles.toString().split(OS === "win32" ? "\r" : "\n")
        lines.splice(lines.length - 2, 0, scriptTag);
        contentsWithStylesAndJS = lines.join(OS === "win32" ? "\r" : "\n");
  
        minifiedContents = minifyHtml.minify(Buffer.from(contentsWithStylesAndJS), {
          do_not_minify_doctype: true,
          ensure_spec_compliant_unquoted_attribute_values: true,
          keep_spaces_between_attributes: true,
          keep_closing_tags: true,
        });
      } else {
        minifiedContents = minifyHtml.minify(Buffer.from(contentsWithStyles), {
          do_not_minify_doctype: true,
          ensure_spec_compliant_unquoted_attribute_values: true,
          keep_spaces_between_attributes: true,
          keep_closing_tags: true,
        });
      }
    } else {
      minifiedContents = minifyHtml.minify(Buffer.from(contentsWithStyles), {
        do_not_minify_doctype: true,
        ensure_spec_compliant_unquoted_attribute_values: true,
        keep_spaces_between_attributes: true,
        keep_closing_tags: true,
      });
    }

    minifiedHtmlArray.push({
      name: file.name,
      ext: file.ext,
      destinationPath: distPath,
      content: minifiedContents,
    });
  });

  if (jsEntriesArray.length != 0) {
    jsEntriesArray.forEach((entry) => {
      const fileContents = readFileSync(entry.path);
      const minifiedContents = UglifyJS.minify(fileContents.toString());
      if (entry.parentDir) {
        minifiedJSArray.push({
          name: entry.name,
          ext: entry.ext,
          destinationPath: path.resolve(jsPath, path.basename(entry.parentDir)),
          parentDir: entry.parentDir,
          content: minifiedContents.code,
        });
      } else {
        minifiedJSArray.push({
          name: entry.name,
          ext: entry.ext,
          destinationPath: jsPath,
          content: minifiedContents.code,
        });
      }
    })
    outputFiles(minifiedHtmlArray, minifiedJSArray)
  } else {
    outputFiles(minifiedHtmlArray);
  }
};

const compileSass = (cssArray) => {
  const sassCompileString = `
    sass --style=compressed --no-source-map ${
      path.resolve(scssPath, 'globalStyles.scss')
    }:${
      path.resolve(cssPath, 'globalStyles.css')
    } ${
      cssArray.join(' ')
    }`.trim();
  execSync(sassCompileString);
};

module.exports = {
  outputHTMLandJS,
  compileSass,
  findFiles,
  outputFiles,
};