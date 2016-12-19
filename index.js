'use strict';

var fs = require('fs');
var path = require('path');

var gutil = require('gulp-util');
var through = require('through2');

var jsReg = /<\s*script\s+.*src\s*=\s*["|']([^"']+)[^>]*><\s*\/\s*script\s*>/gim;
var cssReg = /<\s*link\s+.*href\s*=\s*["|']([^"']+)[^>]*>/gim;
var imageReg = /<\s*img\s+.*src\s*=\s*["|']([^"']+)[^>]*>/gim;
var imgReg = /url\s*\(\s*['|"]?([^'")]+)['|"]?\s*\)/gim;
var base64Reg = /^data:image\/([^;]+);base64,/;
var inlineReg = /\s+inline[\s+>]/;

var isCss = function(str) {
    if (!str) return false;
    return /rel\s*=\s*["|']stylesheet["|']/.test(String(str));
};
var isHTTP = function(str) {
    if (!str) return false;
    return /^(https?:)?\/\//.test(String(str));
};
var isBase64 = function(str) {
    if (!str) return false;
    return base64Reg.test(str);
};

module.exports = function(option) {
    option = option || {};
    option.root = option.root || {};
    option.dir = option.dir || './dist';

    function getNewUrl(url, ext, inline) {
        var paths = url.split('/');
        var filename = paths.pop();

        ext = ext || filename.split('.').pop();

        // inline source
        var prefix = '';
        if(!inline) {
            prefix = option.root[ext] || '';
            prefix && (prefix[prefix.length - 1] === '/' || (prefix += '/'));
        }

        paths.unshift(option.dir);

        var dir = path.resolve.apply(null, paths);

        try {
            var files = fs.readdirSync(dir);
            filename = filename.split('.');

            var newUrl = url;
            files.some(function(item) {
                item = item.split('.');
                if (filename[0] === item[0] && filename[filename.length - 1] === item[item.length - 1]) {
                    paths.shift();
                    newUrl = prefix + paths.join('/') + '/' + item.join('.');
                    return true;
                }
            });

            // replace multi `/` with single `/` except startswith `//`
            // newUrl = newUrl.replace(/(?<!^)(\/+)/g,'/');

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
        var inlineReplace = option.inlineReplace;
        // default is true
        'undefined' === typeof inlineReplace && (inlineReplace = true);

        contents = contents.replace(jsReg, function(match, url) {
                isHTTP(url) || (match = match.replace(/src\s*=\s*["|']([^"'>]+)["|']/, 'src="' + getNewUrl(url, 'js', !inlineReplace && inlineReg.test(match)) + '"'));
                return match;
            })
            .replace(imageReg, function(match, url) {
                isHTTP(url) || (match = match.replace(/src\s*=\s*["|']([^"'>]+)["|']/, 'src="' + getNewUrl(url, 'image', !inlineReplace && inlineReg.test(match)) + '"'));
                return match;
            })
            .replace(cssReg, function(match, url) {
                isHTTP(url) || (isCss(match) && (match = match.replace(/href\s*=\s*["|']([^"']+)["|']/, 'href="' + getNewUrl(url, 'css', !inlineReplace && inlineReg.test(match)) + '"')));
                return match;
            })
            .replace(imgReg, function(match, url) {
                isHTTP(url) || isBase64(url) || (match = match.replace(/url\s*\(\s*['|"]?([^'")]+)['|"]?\s*\)/, 'url(' + getNewUrl(url, 'cssImg', false) + ')'));
                return match;
            });

        file.contents = new Buffer(contents);
        this.push(file);

        fn(null);
    });
};
