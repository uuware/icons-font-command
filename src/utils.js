const Fs = require('fs');
const Http = require('http');
const Https = require('https');

exports.Utils = class Utils {
    static getCmdMap() {
        var options = {};
        var argv = process.argv;
        for (var i = 0; i < argv.length; i++) {
            var one = argv[i];
            if (one[0] == '-') {
                var index = one.indexOf('=')
                if (index > 0 || i === argv.length - 1 || argv[i + 1][0] == '-') {
                    if (index > 0) {
                        options[one.substring(0, index)] = one.substring(index + 1);
                    } else {
                        options[one] = true;
                    }
                } else {
                    options[one] = argv[i + 1];
                    i++;
                }
            } else {
                options[one] = true;
            }
        }
        return options;
    }

    static fSize(fPath) {
        //var fs = require("fs");
        try {
            if (typeof (fPath) == 'number') {
                var stats = Fs.fstatSync(fPath);
                return stats["size"];
            }
            else {
                var stats = Fs.statSync(fPath);
                return stats["size"];
            }
        }
        catch (e) {
            if (e && e.code == 'ENOENT') {
                // file does not exist
                return -1;
            }
            else if (e && e.code == 'EACCES') {
                // No Permission
                return -2;
            }
            console.log('fSize:' + e.stack);
        }
        return -3;
    }

    /*
    { dev: 2049
    , ino: 305352
    , mode: 16877
    , nlink: 12
    , uid: 1000
    , gid: 1000
    , rdev: 0
    , size: 4096
    , blksize: 4096
    , blocks: 8
    , atime: '2009-06-29T11:11:55Z'
    , mtime: '2009-06-29T11:11:40Z'(last modified time.)
    , ctime: '2009-06-29T11:11:40Z' 
    }
    */
    static fStat(fPath) {
        try {
            if (typeof (fPath) == 'number') {
                var stats = Fs.fstatSync(fPath);
                return stats;
            }
            else {
                var stats = Fs.statSync(fPath);
                return stats;
            }
        }
        catch (e) {
            console.log('fStat:' + e.stack);
        }
        return false;
    }

    static fWrite(fPath, data, isAppend, isSync = true) {
        var options = { flag: isAppend ? 'a+' : 'w+', encoding: 'utf8', mode: '0777' };
        if (isSync) {
            try {
                Fs.writeFileSync(fPath, data, options);
            }
            catch (e) {
                console.log('[NG]fwrite:' + fPath + ', e:' + e, 'error');
                return false;
            }
        }
        else {
            Fs.writeFile(fPath, data, options, function (e) {
                if (e) {
                    console.log('[NG]fwrite:' + fPath + ', e:' + e, 'error');
                    throw e;
                }
            });
        }
        return true;
        //fs.chmodSync(fPath, '0777');
    }

    static fRead(fPath) {
        try {
            return Fs.readFileSync(fPath);
        }
        catch (e) {
            console.log('[NG]fRead:' + fPath + ', e:' + e, 'error');
        }
        return false;
    }

    static fExist(fPath) {
        try {
            Fs.statSync(fPath);
            return true;
        } catch (e) {
        }
        return false;
    }
    static fRemove(fPath) {
        try {
            Fs.unlinkSync(fPath);
            return true;
        } catch (e) {
            console.log('[NG]fRemove:' + fPath + ', e:' + e, 'error');
        }
        return false;
    }
    static fCopy(pathFrom, pathTo) {
        try {
            Fs.copyFileSync(pathFrom, pathTo);
            return true;
        } catch (e) {
            console.log('[NG]fCopy:' + pathFrom + ', e:' + e, 'error');
        }
        return false;
    }
    static fRename(pathFrom, pathTo) {
        try {
            Fs.renameSync(pathFrom, pathTo);
            return true;
        } catch (e) {
            console.log('[NG]fRename:' + pathFrom + ', e:' + e, 'error');
        }
        return false;
    }
    static fList(fPath, isFile, isFolder) {
        if (fPath.substr(-1) != '/' && fPath.substr(-1) != '\\') {
            fPath += '/';
        }
        var ret = [];
        var files = Fs.readdirSync(fPath);
        for (var i in files) {
            var name = fPath + files[i];
            var fstat = Fs.statSync(name)
            if ((isFile && fstat && fstat.isFile()) || (isFolder && fstat && fstat.isDirectory())) {
                ret.push(files[i]);
            }
        }
        return ret;
    }
    static fSafeName(filename) {
        filename = filename.replace(/[:"'\\\/\*\?\|]/g, '_');
        return filename.trim();
    }

    static dCreate(dPath, recursive = false) {
        try {
            if (!Fs.existsSync(dPath)) {
                Fs.mkdirSync(dPath, { recursive: recursive, mode: '0777' }, function (err) {
                    if (err) {
                        console.log(err);
                        return false;
                    }
                });
            }
            return true;
        } catch (err) {
            console.log('[NG]dCreate:' + dPath + ', e:' + err, 'error');
        }
        return false;
    }
    static dExist(dPath) {
        try {
            if (Fs.existsSync(dPath)) {
                return true;
            }
        } catch (err) {
        }
        return false;
    }
    static dRemove(dPath, recursive) {
        try {
            Fs.rmdirSync(dPath, { recursive: recursive });
            return true;
        } catch (err) {
        }
        return false;
    }

    static getWeb(url, postData, options) {
        return new Promise(function (resolve, reject) {
            if (!options) {
                options = {};
            }
            var urlObject = new URL(url);
            var headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36',
                'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
                // "Content-Type": "application/json",
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                //'Connection': 'close',
                'Connection': 'Keep-Alive',
                'Proxy-Connection': 'close',
            };
            if (options.headers) {
                for (var i in options.headers) {
                    headers[i] = options.headers[i];
                }
            }

            var params = {
                method: options.method || (postData ? 'POST' : 'GET'),
                hostname: urlObject.hostname,
                port: urlObject.port,
                path: urlObject.pathname,
                headers: headers,
                resolveWithFullResponse: true,
                //rejectUnauthorized: true,
                followAllRedirects: true,
                gzip: false,
                timeout: options.timeout || 1000 * 60,
                //proxy: 'http://<USERNAME>:<PASSWORD>@proxyserver.com:9999',
            };
            var agent = urlObject.protocol === 'http' ? Http : Https;
            var req = agent.request(params, function (res) {
                // reject on bad status
                if (res.statusCode < 200 || res.statusCode >= 300) {
                    return reject(new Error('statusCode=' + res.statusCode));
                }
                // cumulate data
                var body = [];
                res.on('data', function (chunk) {
                    body.push(chunk);
                });
                // resolve on end
                res.on('end', function () {
                    try {
                        var data = Buffer.concat(body);
                        resolve(data);
                    } catch (e) {
                        reject(e);
                    }
                });
            });
            req.on('error', function (err) {
                reject(err);
            });
            if (postData) {
                req.write(postData);
            }
            // IMPORTANT
            req.end();
        });
    }
}
