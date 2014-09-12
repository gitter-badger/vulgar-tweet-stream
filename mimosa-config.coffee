exports.config = 
  "modules": [
    "bower"
    "coffeescript"
    "copy"
    "csslint"
    "jshint"
    "less"
    "live-reload"
    "minify-css"
    "minify-js"
    "require"
    "server"
  ]
  watch:
    javascriptDir: 'js'

  vendor:
    javascripts: 'js/vendor'
    stylesheets: 'css/vendor'

  template:
    nameTransform: 'filePath'
    outputFileName: 'js/templates'

  liveReload:
    additionalDirs:["src/webserver/views"]

  require:
    commonConfig: 'common'

  server:
    defaultServer:
      enabled: true
    port: 3001
    views:
      path: 'src/webserver/views'
