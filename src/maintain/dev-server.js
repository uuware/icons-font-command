var http = require('http');
var fs = require('fs');
var path = require('path');

const wwwroot = '../icons-font-customization/dist/';
http.createServer(function (request, response) {
    console.log('request starting...' + request.url);

    var filePath = wwwroot + request.url;
    if (filePath.endsWith('/'))
        filePath += 'index.html';

    var extname = path.extname(filePath);
    var contentType = extname === '.woff2' ? 'application/font-woff2' : extname === '.svg' ? 'image/svg+xml' : 'text/html';

    fs.readFile(filePath, function (error, content) {
        if (error) {
            if (error.code == 'ENOENT') {
                response.writeHead(200, { 'Content-Type': 'text/html' });
                response.end('Not found.', 'utf-8');
            }
            else {
                response.writeHead(500);
                response.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
            }
        }
        else {
            response.writeHead(200, { 'Content-Type': contentType });
            response.end(content, 'utf-8');
        }
    });

}).listen(8125);
console.log('Server running at http://127.0.0.1:8125/');