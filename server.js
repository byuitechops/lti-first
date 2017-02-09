#!/usr/bin/env node

/* eslint-env node*/
/* eslint no-console:0*/

var fs = require("fs");
var https = require("https");
var port = getPort();
var lti = require('ims-lti');
var ltiContent = require('./node_modules/ims-lti/lib/extensions/content.js');
var provider = new lti.Provider("my_cool_key", "my_cool_secret");
var chalk = require('chalk');

var qs = require('querystring');


function getPort() {
    return 8080;
}

function getScript(port) {
    var url = 'https://localhost:' + port + '/path-2-file';
    return '<script src="' + url + '"></script>';
}

function sendHTMLBack(res) {
    var reader = fs.createReadStream("./index.html");
    reader.pipe(res);

    reader.on("error", function () {
        res.writeHead(404);
        res.write("404");
        res.end();
    });

}

function processRequest(request, response) {
    if (request.method == 'POST') {
        var bodyString = '';

        request.on('data', function (data) {
            bodyString += data;
            if (bodyString.length > 1e6) {
                request.connection.destroy();
            }
        });

        request.on('end', function () {
            var body = qs.parse(bodyString)
                //console.log("body from qs:", body);
                //body.ext_content_return_types = body.custom_ext_content_return_types;

            provider.valid_request(request, body, function (err, isValid) {
                ltiContent.init(provider);
                console.log("provider:", provider);
                //console.log("request:", request);
                //console.log("response:", response);

                if (err || !isValid) {
                    console.log(chalk.red("Not valid LTI"));
                    return;
                }

                console.log(chalk.green("Yay! Valid LTI"));

                console.log(chalk.yellow(("provider.ext_content:" + provider.ext_content.toString())));
                sendHTMLBack(response);
            });

        });
    }
}

var options = {
    key: fs.readFileSync(__dirname + "/keys/server.key"), // __dirname to find directory
    cert: fs.readFileSync(__dirname + "/keys/server.crt")
}

https.createServer(options, processRequest).listen(port) // port dynamic
console.log(chalk.blue("Server is active on port " + port));
console.log(chalk.green(getScript(port))); // also diaplay the script tag with data...