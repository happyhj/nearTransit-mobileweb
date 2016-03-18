var http = require('http'),
    httpProxy = require('http-proxy'),
	url = require('url'),
    path = require('path'),
    fs = require('fs'),
    os = require('os');
    
var mimeTypes = {
    "html": "text/html",
    "jpeg": "image/jpeg",
    "jpg": "image/jpeg",
    "png": "image/png",
    "js": "text/javascript",
    "css": "text/css"};

var proxy = httpProxy.createProxyServer({
  target: 'http://m.map.naver.com'
});

proxy.on('proxyReq', function(proxyReq, req, res, options) {
	proxyReq.setHeader('Accept', '*/*');
	proxyReq.setHeader('Host', 'm.map.naver.com');
	proxyReq.setHeader('Connection', 'keep-alive');
	proxyReq.setHeader('Referer', 'http://m.map.naver.com');

	proxyReq.setHeader('Access-Control-Allow-Methods', 'GET, POST');
	proxyReq.setHeader('Access-Control-Allow-Credentials', 'true');
	proxyReq.setHeader('Access-Control-Allow-Origin', '*');
	proxyReq.setHeader('Access-Control-Allow-Headers', 'Content-Type, *');

//	console.log(req);
});

var server = http.createServer(function (req, res) {
	if(req.url.indexOf('/api/') !== -1) { // m.map.naver.com 으로 프록싱
		res.oldWriteHead = res.writeHead;
		res.writeHead = function(statusCode, headers) {
			/* add logic to change headers here */
			var setCookie = res.getHeader('set-cookie'); // 127.0.0.1
			setCookie = setCookie.map(function(cookie) {
				var cookieList = cookie.split('; ');
				var domainIdx;
				
				for(var i in cookieList) {
					if(cookieList[i].indexOf('domain=') !== -1 || cookieList[i].indexOf('Domain=') !== -1) {
						domainIdx = i;
						break;
					}
				}

				cookieList[domainIdx] = 'Domain='+ req.headers.host.split(':')[0];
				
				return cookieList.join('; ');
			});
			res.setHeader('set-cookie', setCookie);			
			res.oldWriteHead(statusCode, headers);
		};
		
		req.url = req.url.replace('/api/', '/');
		proxy.web(req, res);
	} else { // static file 제공
		req.url = req.url === '/' ? '/index.html' : req.url;
		
	    var uri = url.parse(req.url).pathname;
	    var filename = path.join(process.cwd(), uri);
	    fs.exists(filename, function(exists) {
	        if(!exists) {
	            console.log("not exists: " + filename);
	            res.writeHead(200, {'Content-Type': 'text/plain'});
	            res.write('404 Not Found\n');
	            res.end();
	            return;
	        }
	        var mimeType = mimeTypes[path.extname(filename).split(".")[1]];
	        res.writeHead(200, {'Content-Type': mimeType });
	
	        var fileStream = fs.createReadStream(filename);
	        fileStream.pipe(res);	
	    }); //end path.exists
	}
}).listen(process.env.PORT || 5000);
