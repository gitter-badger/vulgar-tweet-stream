exports.config = {
  "modules": [
    "copy",
    "server",
    "jshint",
    "csslint",
    "require",
    "minify-js",
    "minify-css",
    "live-reload",
    "bower",
    "less",
    "jade",
    "web-package"
  ],
  watch: {
    sourceDir: "src/assets",
    compiledDir: "public",
    javascriptDir: 'js',
  },
  vendor: {
    javascripts: "js/vendor",
    stylesheets: "css/vendor"
  },
  template: {
    nameTransform: "filePath",
    outputFileName: "js/templates"
  },
  server: {
    path: 'src/server.js',
    views: {
      compileWith: 'jade',
      extension: 'jade' ,
      path: 'views'
    }
  },
  liveReload: {
    additionalDirs: ['src']
  },
  webPackage: {
    archiveName: "app",
    configName: "config",
    useEntireConfig: false,
    outPath: "dist",
    appjs: "app.js",
    exclude: ["README.md","node_modules","mimosa-config.coffee","mimosa-config.js","assets",".git",".gitignore","mimosa-config-documented.coffee",".mimosa","bower.json"]
   }
}