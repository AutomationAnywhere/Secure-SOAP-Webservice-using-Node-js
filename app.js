/**
 * Created by Michael on 11/14/2016.
 */
 var soap = require('soap');
var express = require('express');
var fs = require('fs');
var https = require('https');

var useAuth = true;
var app = express();
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


if (useAuth) {
    //cert authorization
    app.use(function (req, res, next) {
        //console.log("eq.client.authorized" ,req.client);
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
    console.log("here");
    res.send('Node Soap Example!<br /><a href="https://github.com/macogala/node-soap-example#readme">Git README</a>');
  })


var listener = https.createServer(options, app).listen(4433, function () {
    var wsdl_path = "/soapservice";
    soap.listen(app, wsdl_path, serviceObject, xml).on('error', (e) => {
      console.log('Error happened: ', e.message)
   });
    console.log('Express HTTPS server listening on port ' + listener.address().port);
});