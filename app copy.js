/**
 * Created by Michael on 11/14/2016.
 */
 var soap = require('soap');
var express = require('express');
var fs = require('fs');
var https = require('https');
var auth = require('basic-auth')
var useAuth = true;
var app = express();
var compare = require('tsscmp')
// function splitter_function(args) {
//     console.log('splitter_function');
//     var splitter = args.splitter;
//     var splitted_msg = args.message.split(splitter);
//     var result = [];
//     for(var i=0; i<splitted_msg.length; i++){
//       result.push(splitted_msg[i]);
//     }
//     return {
//         result: result
//         }
// }


function splitter_function(args) {
    console.log('splitter_function');
    console.log(args.message);
    return {
                result: args.message
                }
}

// the service
var serviceObject = {
  MessageSplitterService: {
        MessageSplitterServiceSoapPort: {
            MessageSplitter: splitter_function
        },
        MessageSplitterServiceSoap12Port: {
            MessageSplitter: splitter_function
        }
    }
};
// load the WSDL file
var xml = fs.readFileSync('service.wsdl', 'utf8');
var options = {
    key: fs.readFileSync('certs/server-key.pem'),
    cert: fs.readFileSync('certs/server-crt.pem'),
    ca: fs.readFileSync('certs/ca_client-crt.pem'),
    //crl: fs.readFileSync('certs/ca-crl.pem'),
};

app.use(function (req, res, next) {
    var log = new Date() + ' ' + req.connection.remoteAddress + ' ' + req.method + ' ' + req.url;
    var cert = req.socket.getPeerCertificate();
    if (cert.subject) {
        log += ' ' + cert.subject.CN;
    }
    console.log(log);
    next();
});

// Basic function to validate credentials for example
function check (name, pass) {
    var valid = true
   
    // Simple method to prevent short-circut and use timing-safe compare
    valid = compare(name, 'john') && valid
    valid = compare(pass, 'secret') && valid
   
    return valid
  }

if (useAuth) {
    //cert authorization
    app.use(function (req, res, next) {
        var credentials = auth(req)
 
        // Check credentials
        // The "check" function will typically be against your user store
        if (!credentials || !check(credentials.name, credentials.pass)) {
          res.statusCode = 401
          res.setHeader('WWW-Authenticate', 'Basic realm="example"')
          next();
        } else {
            next();
        }


        if (!req.client.authorized) {
            return res.status(401).send('User is not authorized');
        }
        next();
    });

    options.requestCert = true;
    options.rejectUnauthorized = false;
}

// app.use(function (req, res, next) {
//     res.writeHead(200);
//     res.end("hello Sikha");
//     next();
// });
app.get('/', function (req, res) {
    res.send('Node Soap Example!<br /><a href="https://github.com/macogala/node-soap-example#readme">Git README</a>');
  })
var listener = https.createServer(options, app).listen(4433, function () {
    var wsdl_path = "/wsdl";
    soap.listen(app, wsdl_path, serviceObject, xml).on('error', (e) => {
      console.log('Error happened: ', e.message)
   });
    console.log('Express HTTPS server listening on port ' + listener.address().port);
});