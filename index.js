const express = require("express");
const axios = require('axios');
const net = require('net');
const tls = require('tls');
const dns = require('dns');
const app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json());
const port = 8080;
const sPort = 443;
var logData = true;
var currentserver = "";
app.get("/",function(req, res) {
    res.send("Server Running on port "+sPort);
})
function updateFlashvars(){
 axios.request({
      url:'https://www.animaljam.com/flashvars',
      method:"GET"
  }).then(function (resp) {
            var cs = "lb-"+ resp.data.smartfoxServer.replace(/\.(stage|prod)\.animaljam\.internal$/,"-$1.animaljam.com");
            dns.lookup(cs, (err, address, family) => {
              if(err) throw err;
              currentserver = address;
            });
          })
      
          .catch(function (error) {
            console.log(error);
          });
  }
app.listen(port, () => {
    console.log("HTTP server is running on port "+ port);
    updateFlashvars();
    }); 
    
//Socket stuff
//---------------------------------------------------------
    var server = new net.Server(); 

    server.on("connection", function(client) {
    var connectedToAJ = false;
    var eSocket = new tls.TLSSocket();
   try{
        console.log("Client connected!");
        client.on("data", function (data) {
        if (connectedToAJ == false){
        eSocket.connect({host: currentserver, port: 443, rejectUnauthorized: false })
          if(logData == true){ console.log(`Sent data ${data.toString()} to ${currentserver} at ${new Date()}`);}
            eSocket.write(data);
        }
        else{
            if(logData == true){ console.log(`Sent data ${data.toString()} to ${currentserver} at ${new Date()}`);}
            eSocket.write(data);
        }
        });
        eSocket.on('ready',function(){
            console.log("Connected to Animal Jam Server");  
            connectedToAJ = true;         
        })
        eSocket.on('error', function(error){
            console.log("Error in Socket : "+error);
            connectedToAJ = false;
        })
        eSocket.on('data',function(data){
         if(logData == true){ console.log(`Received data ${data.toString()} from ${currentserver} at ${new Date()}`);}
        client.write(data);
        })
        client.on('close',function(){
            console.log("Client disconnected");
          eSocket.destroy();
        })
        client.on('error', function(error){
            console.log("Error in Client Socket : "+error);
            connectedToAJ = false;
            client.destroy();
        })
   }
    catch(error){
console.log("Unknown Error in Server : "+error);
connectedToAJ = false;
client.destroy();
    }
    });
    server.on('error', function(error){
        console.log("Error in Server : "+error);
    })
    server.listen(sPort);
