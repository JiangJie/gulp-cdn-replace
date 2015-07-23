'use strict';

var fs = require('fs');
var path = require('path');

var gutil = require('gulp-util');
var through = require('through2');

var jsReg = /<\s*script\s+.*src\s*=\s*["|']([^"']+)[^>]*><\s*\/\s*script\s*>/gim;
var cssReg = /<\s*link\s+.*href\s*=\s*["|']([^"']+)[^>]*>/gim;
var isCss = function(str) {
    return /rel\s*=\s*["|']stylesheet["|']/.test(String(str));
};
var isHTTP = function(str) {
    return /^https?:/.test(String(str));
};


module.exports = function(option) {
    option = option || {};
    option.root = option.root || {};
    option.dir = option.dir || './dist';

    function getNewUrl(url) {
        var paths = url.split('/');
        var filename = paths.pop();

        var prefix = option.root[filename.split('.').pop()] || '';
        prefix[prefix.length - 1] === '/' || (prefix += '/');

        paths.unshift(option.dir);

        var dir = path.resolve.apply(null, paths);

        try {
            var files = fs.readdirSync(dir);
            filename = filename.split('.');

            var newUrl;
            files.some(function(item) {
                item = item.split('.');
                if (filename[0] === item[0] && filename[filename.length - 1] === item[item.length - 1]) {
                    paths.shift();
                    newUrl = prefix + paths.join('/') + '/' + item.join('.');
                    return true;
                }
            });

            return newUrl;
        } catch (e) {
            return url;
        }
    }

    return through.obj(function(file, enc, fn) {
        if (file.isNull()) return fn(null, file);

        if (file.isStream()) return fn(new gutil.PluginError('gulp-cdn-replace', 'Streaming is not supported'));

        // Buffer
        var contents = file.contents.toString();
        contents = contents.replace(jsReg, function(match, url) {
                isHTTP(url) || (match = match.replace(/src\s*=\s*["|']([^"'>]+)["|']/, 'src="' + getNewUrl(url) + '"'));
                return match;
            })
            .replace(cssReg, function(match, url) {
                isHTTP(url) || (isCss(match) && (match = match.replace(/href\s*=\s*["|']([^"']+)["|']/, 'href="' + getNewUrl(url) + '"')));
                return match;
            });

        file.contents = new Buffer(contents);
        this.push(file);

        fn(null);
    });
};