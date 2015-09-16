gulp-cdn-replace
================

> 替换html里面js和css引用地址

> replace js' `src` and css' `href` with their cdn url.

> No need for `<!-- build --><!-- endbuild -->` comments.

## Install
```
npm install gulp-cdn-replace --save-dev
```

## Example
### `gulpfile.js`
```js
var cdn = require('gulp-cdn-replace');

gulp.task('cdn', function() {
    gulp.src('./src/*.html')
        .pipe(cdn({
            dir: './dist',
            root: {
                js: 'http://cdn.example.com/somename',
                css: 'http://cdn.example.com/somename',
                image: 'http://cdn.example.com/somename'
            },
            version: {
				timestamp: true // default false, add '?v=1442417693439' version control which it's the timestamp of task running
        	}
        }))
        .pipe(gulp.dest('./dist'));
});
```

### cdn(options)

### options

Type: `Object`

#### options.dir
Type: `String`
Default: './dist'

The directory where you place your js and css which may be created by `gulp-rev`.

#### options.root
Type: `Object`

#### options.root.js
Type: `String`

The CDN prefix for js files.

#### options.root.css
Type: `String`

The CDN prefix for css files.
