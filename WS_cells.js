/**
 * Created by Antto on 13.4.2017.
 */

var app = require('express')();
var http = require('http');
var request = require('request');
var bodyParser = require('body-parser');
var replaceall = require('replaceall');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()); // Body parser uses JSON data


var Station = function Station(number, workpiece) {
    this.number = number;
    this.workpiece = workpiece;
    this.status = "idle";
    this.port = 6000 + number;
    this.url = "127.0.0.1";
};

Station.prototype.runServer =  function() {
    port = 6000 + this.number;
    var ref = this;
    console.log("Server port: " + port);

    var Server = http.createServer(function(req, res) {
        var method = req.method;

        console.log("Method: " + method);

        if (method === 'GET') {
            //Handle GET method.
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/plain');
            res.end('Agent ' + ref.number + ' is running.');
        } else if (method === 'POST') {
            //Handle POST method.
            var body = []; //Getting data: https://nodejs.org/en/docs/guides/anatomy-of-an-http-transaction/
            req.on('data', function(chunk) {
                body.push(chunk);
                //console.log(chunk);
                //console.log("Body???: " + body);
                body = body.toString();
                body = JSON.parse(body);
                console.log("Parsed JSON body: ");
                console.log(body);

                if (body.hasOwnProperty('senderID')){
                    var id = body.id;

                    if (body.senderID === 'SimCNV' + ref.number) {
                        if (body.id === 'Z1_Changed' && body.payload.PalletID !== -1) {
                            var id = body.payload.PalletID;
                            move(14, ref.number);
                        }
                    }
                    if (body.id === 'Z4_Changed' && body.payload.PalletID !== -1) {
                        var id = body.payload.PalletID;
                        move(45, ref.number);
                    }


                } else if (body.hasOwnProperty('pID')){
                    var frame = body.frame;
                    var screen = body.screen;
                    var keyboard = body.keyboard;
                    var fc = body.fc;
                    var kc = body.kc;
                    var sc = body.sc;
                    var pID = body.pID;
                    var destination = body.destination;
                    var ready = body.ready;
                }
        
            })



        }
    })
        Server.listen(port, function() {
        //console.log('Server started on port: ' + port);

    })
};

// a function that moves pallet to different zone
function move(zone, station) {
    console.log("movePallet to zone: " + zone);

    var options = {
        uri: "http://localhost:3000/RTU/SimCNV" + station + "/services/TransZone" + zone,
        method: 'POST',
        json: {"destUrl": "http://localhost:" + port}
    };

    request(options, function (err, response, body) {
        if (err) { console.log(err);
        } else { console.log("liikkuu");
        }
    });
}

Station.prototype.GetStatus = function (location, recept, ID)
{
    console.log('Asking for the status '+ ID);
    var ref = this;
    var cellport = serverBasePort+cellPlace;

    var options = {
        uri: fastIP + ':' + cellport, // What url
        method: 'POST',
        json: {
            "location" : ""+this.place+"", "recept": recept, "ID": ID
        }
    };

    var destination = 0;
    request(options, function (error, response, body){

        if (!error && response.statusCode === 200) {
            console.log("palletin body =" + body); // Print the shortened url.
        }
        else
        {
            console.log(error);
        }
    })

};

Station.prototype.Subscribe = function (RTU_ID, service)
{
    var port = 6000 + this.number;
    //console.log(port);

    request.post('http://localhost:3000/RTU/SimCNV' + this.number + '/events/' + service + '/notifs',
        {form:{destUrl:"http://localhost:" + port}}, function(err,httpResponse,body){
            if (err) {
                console.log(err);
            } else {
                console.log("subscribed to the " + service + " event!");
            }
        });

};


Station.prototype.start = function () {
    this.runServer();
    this.Subscribe('CNV','Z1_Changed');
    this.Subscribe('CNV','Z2_Changed');
    this.Subscribe('CNV','Z3_Changed');
    this.Subscribe('CNV','Z4_Changed');
    // this.Subscribe('ROB','DrawEndExecution')

};

//****************** END OF CLASS DEFINTION*********************

var WS2 = new Station(2,'frame');
var WS3 = new Station(3,'frame');
var WS4 = new Station(4,'frame');
var WS5 = new Station(5,'screen');
var WS6 = new Station(6,'screen');
var WS8 = new Station(8,'screen');
var WS9 = new Station(9,'screen');
var WS10 = new Station(10,'keyboard');
var WS11 = new Station(11,'keyboard');
var WS12 = new Station(12,'keyboard');
WS2.start();
WS3.start();
WS4.start();
WS5.start();
WS6.start();
WS8.start();
WS9.start();
WS10.start();
WS11.start();
WS12.start();


