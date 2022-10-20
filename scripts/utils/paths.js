const path = require("path");
const { platform } = require("os");

const OS = platform();

const rootDir = path.resolve(__dirname, "../../");
const srcDir = path.resolve(rootDir, "src")
const distPath = path.resolve(rootDir, "dist");
const assetSrcPath = `${srcDir}${OS === "win32" ? "\\" : "/"}assets${OS === "win32" ? "\\" : "/"}`
const htmlPath = path.resolve(distPath);
const jsPath = path.resolve(distPath, "js");
const scssPath = `${rootDir}${OS === "win32" ? "\\" : "/"}src${OS === "win32" ? "\\" : "/"}scss${OS === "win32" ? "\\" : "/"}`;
const cssPath = `${distPath}${OS === "win32" ? "\\" : "/"}css${OS === "win32" ? "\\" : "/"}`;

module.exports = {
  rootDir,
  srcDir,
  distPath,
  assetSrcPath,
  htmlPath,
  jsPath,
  cssPath,
  scssPath
};
