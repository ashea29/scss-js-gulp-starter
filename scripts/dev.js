const liveServer = require("live-server")
const { rootDir } = require('./utils/paths')

const serverParams = {
  port: 3000,
  root: `${rootDir}/dist`,
  open: true
}

liveServer.start(serverParams)
