"use strict";

var gulp = require("gulp");
var autoprefixer = require("autoprefixer");
var concat = require("gulp-concat");
var uglify = require("gulp-uglify");
var htmlmin = require("gulp-htmlmin");
var templateCache = require("gulp-angular-templatecache");
var ngAnnotate = require("gulp-ng-annotate");
var livereload = require("gulp-livereload");
var plumber = require("gulp-plumber");
var ts = require("gulp-typescript");
var tslint = require("tslint");
var gulpTslint = require("gulp-tslint");
var inject = require("gulp-inject");
var rename = require("gulp-rename");
var merge2 = require("merge2");
var browserify = require("browserify");
var cssModulesify = require("css-modulesify");
var source = require("vinyl-source-stream");
var buffer = require("vinyl-buffer");
var sass = require("gulp-sass")(require("sass"));
var fontcustom = require("gulp-fontcustom");
var svgmin = require("gulp-svgmin");
var cleanCSS = require("gulp-clean-css");
var argv = require("yargs").argv;
var rev = require("gulp-rev");
var revReplace = require("gulp-rev-replace");
var del = require("del");
var runSequence = require("run-sequence");
var typescript = require("typescript");
var gulpNgConfig = require("gulp-ng-config");
var replace = require("gulp-replace");
var superstatic = require("superstatic").server;
var firebase_config = require("./firebase.json");
var typings = "./typings/";
var references = typings + "app.d.ts";
var tsProject = ts.createProject("tsconfig.json", { typescript: typescript });

var b = browserify({
  entries: "./app/dist/tsapp.js",
  debug: false,
  paths: ["./app/css/generated"],
}).plugin(cssModulesify, {
  rootDir: __dirname,
  output: "./app/dist/app.css",
  cache: false,
  after: [autoprefixer],
  generateScopedName: argv.production !== true ? cssModulesify.generateLongName : cssModulesify.generateShortName,
});

var paths = {
  css_dependencies: [
    "./app/static/css/reset.css",
    "./app/static/css/icons.css",
    "./node_modules/fg-select-css/src/select-css.css",
  ],

  ts: ["./app/src/app.ts", "./app/src/**/*.ts"],

  sass: ["./app/src/**/*.scss"],

  css: ["./app/css/**/*.css"],

  website_css: ["./app/static/css/home.css", "./app/static/css/page.css"],

  website_scss: ["./app/static/css/home.scss", "./app/static/css/page.scss"],

  templates: ["./app/src/**/*.html", "!./app/src/index.html"],
};

const onError = (error) => {
  console.log(error);
  this.emit("end");
};

gulp.task("serve", () => {
  var server = superstatic({
    port: 3000,
    config: firebase_config.hosting,
  });

  server.listen((error) => {
    if (error) {
      console.log(error);
    }
  });
});

gulp.task("config", () => {
  let environment = "local";

  if (argv.staging) {
    environment = "staging";
  } else if (argv.production) {
    environment = "production";
  }

  return gulp
    .src("env.json")
    .pipe(
      gulpNgConfig("app", {
        createModule: false,
        wrap: true,
        environment: environment,
      })
    )
    .pipe(replace('"', "'"))
    .pipe(
      rename({
        basename: "env.config",
        extname: ".ts",
      })
    )
    .pipe(gulp.dest("./app/src/core/"));
});

gulp.task("copy", () => {
  del.sync(["./app/dist/**"]);

  return merge2(
    gulp.src("./app/src/index.html").pipe(gulp.dest("./app/bleh/")),
    gulp.src("./node_modules/angular/angular.min.js").pipe(gulp.dest("./app/dist/dependencies/")),
    gulp.src("./node_modules/angular-animate/angular-animate.min.js").pipe(gulp.dest("./app/dist/dependencies/")),
    gulp.src("./node_modules/angular-sanitize/angular-sanitize.min.js").pipe(gulp.dest("./app/dist/dependencies/")),
    gulp
      .src("./node_modules/angular-ui-router/release/angular-ui-router.min.js")
      .pipe(gulp.dest("./app/dist/dependencies/")),
    gulp.src("./node_modules/rxjs/bundles/Rx.min.js").pipe(gulp.dest("./app/dist/dependencies/")),
    gulp.src("./node_modules/lodash/lodash.min.js").pipe(gulp.dest("./app/dist/dependencies/")),
    gulp.src("./node_modules/moment/min/moment.min.js").pipe(gulp.dest("./app/dist/dependencies/")),
    gulp
      .src("./node_modules/moment-timezone/builds/moment-timezone-with-data-10-year-range.min.js")
      .pipe(gulp.dest("./app/dist/dependencies/")),
    gulp.src("./node_modules/ng-meta/dist/ngMeta.min.js").pipe(gulp.dest("./app/dist/dependencies/")),
    gulp
      .src("./node_modules/pikaday/pikaday.js")
      .pipe(uglify())
      .pipe(rename({ suffix: ".min" }))
      .pipe(gulp.dest("./app/dist/dependencies/")),
    gulp.src("./node_modules/file-saver/FileSaver.min.js").pipe(gulp.dest("./app/dist/dependencies/")),
    gulp
      .src("./node_modules/dom-autoscroller/dist/dom-autoscroller.min.js")
      .pipe(gulp.dest("./app/dist/dependencies/")),
    gulp.src("./node_modules/bowser/bowser.min.js").pipe(gulp.dest("./app/dist/dependencies/")),
    gulp.src("./app/static/js/uuid.min.js").pipe(gulp.dest("./app/dist/dependencies/")),
    gulp
      .src("./node_modules/fast-levenshtein/levenshtein.js")
      .pipe(uglify())
      .pipe(rename({ suffix: ".min" }))
      .pipe(gulp.dest("./app/dist/dependencies/")),
    gulp
      .src("./app/static/js/dragula.js")
      .pipe(uglify())
      .pipe(rename({ suffix: ".min" }))
      .pipe(gulp.dest("./app/dist/dependencies/"))
  );
});

gulp.task("website", () => {
  return gulp
    .src(paths.website_scss)
    .pipe(plumber({ errorHandler: onError }))
    .pipe(sass().on("error", sass.logError))
    .pipe(gulp.dest("./app/static/css"));
});

gulp.task("html-to-templates.js", () => {
  return gulp
    .src(paths.templates)
    .pipe(plumber({ errorHandler: onError }))
    .pipe(
      htmlmin({
        collapseWhitespace: true,
        removeComments: true,
      })
    )
    .pipe(
      templateCache("templates.js", {
        module: "app",
        standalone: false,
        base: (file) => {
          // convert backward slashes to forward slashes
          const stardardizedPath = file.relative.replace(/\\/g, "/");
          const filename = stardardizedPath.split("/").pop();
          return filename;
        },
      })
    )
    .pipe(gulp.dest("./app/dist/"));
});

gulp.task("sass-to-css", () => {
  return gulp
    .src(paths.sass)
    .pipe(plumber({ errorHandler: onError }))
    .pipe(sass().on("error", sass.logError))
    .pipe(rename({ dirname: "" }))
    .pipe(gulp.dest("./app/css/generated"));
});

gulp.task("css-to-app.css", ["sass-to-css"], () => {
  return b.bundle();
});

gulp.task("sass-to-tokk.css", ["css-to-app.css"], () => {
  var cssFiles = paths.css_dependencies;
  cssFiles.push("./app/dist/app.css");

  return gulp
    .src(cssFiles)
    .pipe(plumber({ errorHandler: onError }))
    .pipe(concat("tokk.css"))
    .pipe(gulp.dest("./app/dist/"));
});

gulp.task("tsrefs", () => {
  var sources = gulp.src(paths.ts, { read: false });

  return gulp
    .src(references)
    .pipe(plumber({ errorHandler: onError }))
    .pipe(
      inject(sources, {
        starttag: "//{",
        endtag: "//}",
        transform: function (filepath) {
          return '/// <reference path="..' + filepath + '" />';
        },
      })
    )
    .pipe(gulp.dest(typings));
});

gulp.task("tslint", () => {
  const program = tslint.Linter.createProgram("./tsconfig.json");
  typescript.getPreEmitDiagnostics(program);

  return gulp
    .src(paths.ts)
    .pipe(plumber({ errorHandler: onError }))
    .pipe(
      gulpTslint({
        formatter: "stylish",
        configuration: "tslint.json",
        tslint: tslint,
        program: program,
      })
    )
    .pipe(
      gulpTslint.report({
        emitError: true,
        summarizeFailureOutput: true,
      })
    );
});

gulp.task("ts-to-tsapp.js", () => {
  var tsResult = gulp.src(paths.ts).pipe(tsProject(ts.reporter.defaultReporter()));
  return tsResult.js.pipe(ngAnnotate()).pipe(gulp.dest("./app/dist/"));
});

gulp.task("css-and-ts-to-tokk.js", ["ts-to-tsapp.js"], () => {
  return b.bundle().on("error", onError).pipe(source("tokk.js")).pipe(gulp.dest("./app/dist/"));
});

gulp.task("sass-and-ts-to-tokk.js", ["sass-to-css", "ts-to-tsapp.js"], () => {
  if (argv.production !== true) {
    return b.bundle().on("error", onError).pipe(source("tokk.js")).pipe(gulp.dest("./app/dist/"));
  } else {
    return b
      .bundle()
      .on("error", onError)
      .pipe(source("tokk.js"))
      .pipe(buffer())
      .pipe(uglify())
      .pipe(gulp.dest("./app/dist/"));
  }
});

gulp.task("sass-and-ts-to-tokk.js-and-tokk.css", ["sass-and-ts-to-tokk.js"], () => {
  var cssFiles = paths.css_dependencies;
  cssFiles.push("./app/dist/app.css");

  if (argv.production !== true) {
    // same as 'css' task
    return gulp
      .src(cssFiles)
      .pipe(plumber({ errorHandler: onError }))
      .pipe(concat("tokk.css"))
      .pipe(gulp.dest("./app/dist/"));
  } else {
    return gulp
      .src(cssFiles)
      .pipe(plumber({ errorHandler: onError }))
      .pipe(
        cleanCSS({
          compatibility: "*",
          level: 2,
        })
      )
      .pipe(concat("tokk.css"))
      .pipe(gulp.dest("./app/dist/"));
  }
});

gulp.task("rev", () => {
  return gulp
    .src(["./app/dist/tokk.css", "./app/dist/tokk.js", "./app/dist/templates.js"])
    .pipe(rev())
    .pipe(gulp.dest("./app/dist/"))
    .pipe(rev.manifest())
    .pipe(gulp.dest("./app/dist/"));
});

gulp.task("revreplace", ["rev"], () => {
  const manifest = gulp.src("./app/dist/rev-manifest.json");

  return gulp
    .src("./app/src/index.html")
    .pipe(revReplace({ manifest: manifest }))
    .pipe(gulp.dest("./app/bleh/"));
});

gulp.task("watch", () => {
  livereload.listen();

  // watch input changes
  gulp.watch(paths.templates, ["html-to-templates.js"]);
  gulp.watch(paths.sass, ["sass-to-tokk.css"]);
  gulp.watch("./app/src/index.html", ["sass-to-tokk.css"]);
  gulp.watch(paths.website_scss, ["website"]);
  gulp.watch(paths.ts, ["css-and-ts-to-tokk.js"]);

  // watch output changes
  gulp.watch(["./app/dist/tokk.css"].concat(paths.website_css)).on("change", (event) => livereload.changed(event.path));
  gulp
    .watch(["./app/dist/tokk.js", "./app/dist/templates.js", "./app/index.html"])
    .on("change", (event) => livereload.reload());
});

gulp.task("icons", ["svgmin"], () => {
  gulp
    .src("./icon_sources/")
    .pipe(
      fontcustom({
        font_name: "tokkicons",
        "css-selector": ".icon-{{glyph}}",
        autowidth: false,
      })
    )
    .pipe(gulp.dest("./app/static/icons/"));
});

gulp.task("svgmin", () => {
  return gulp
    .src("./icon_sources/*.svg")
    .pipe(
      svgmin({
        plugins: [
          {
            removeDoctype: true,
          },
          {
            removeComments: true,
          },
          {
            removeXMLNS: true,
          },
        ],
      })
    )
    .pipe(gulp.dest("./icon_sources/"));
});

gulp.task("default", (callback) => {
  runSequence(
    ["config", "copy", "html-to-templates.js", "sass-and-ts-to-tokk.js-and-tokk.css", "website"],
    "serve",
    "watch",
    callback
  );
});

gulp.task("build", (callback) => {
  runSequence(
    "tsrefs",
    [
      "config",
      "copy",
      "html-to-templates.js",
      // "tslint",
      "sass-and-ts-to-tokk.js-and-tokk.css",
      "website",
    ],
    "revreplace",
    callback
  );
});
