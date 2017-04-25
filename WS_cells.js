/**
 * Created by Antto on 13.4.2017.
 */

var app = require('express')();
var http = require('http');
var request = require('request');
var bodyParser = require('body-parser');
var replaceall = require('replaceall');
var WS7_Agent = require('./WS7_Agent.js');
var WS1_Agent = require('./WS1_Agent.js');



app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()); // Body parser uses JSON data

// Workstation information
var Station = function Station(number, workpiece) {
    this.number = number;
    this.workpiece = workpiece;
    this.color = "blue";
    this.status = "idle";
    this.port = 6000 + number;
    this.currentPallet = 0;
};

// A function that runs all the workstation servers
Station.prototype.runServer =  function() {

    var ref = this;
    console.log("Server port: " + ref.port);

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
            var body = [];
            req.on('data', function(chunk) {
                body.push(chunk);
                //console.log(chunk);
                //console.log("Body???: " + body);
                body = body.toString();
                body = JSON.parse(body);
                console.log("Parsed JSON body: ");
                console.log(body);

                // If the body has a senderID, we know that the post has come from Fastory line
                if (body.hasOwnProperty('senderID')){
                    var id = body.id;

                    // Catch the messages if they have come from CNV
                    if (body.senderID === 'SimCNV' + ref.number) {
                        var pID = body.payload.PalletID;
                        if (body.id === 'Z1_Changed' && body.payload.PalletID !== -1) {
                            // The pallet is now in zone 1 and therefore we want to check do we need
                            // to move the pallet to robot or to next station

                            // Ask the status of pallet
                            getInfo(pID,ref.port);

                            // If destination is not decided,
                            move(14, ref.number);
                        }
                        // Wait for Z2 change and then move to Z3
                        else if (body.id === 'Z2_Changed' && body.payload.PalletID !== -1){
                            move(23,ref.number);
                        }

                        // Wait for Z2 change and then move to Z3
                        else if (body.id === 'Z3_Changed' && body.payload.PalletID !== -1){
                            Console.log("Now drawing at WS" + ref.number);
                            getInfo(pID,ref.port);
                        }
                        else if (body.id === 'Z4_Changed' && body.payload.PalletID !== -1) {
                            // The pallet is in zone 4, so we want to move it to next station
                            move(45, ref.number);
                        }
                    }
                    // Catch the messages if they have come from ROB
                    if (body.senderID === 'SimROB' + ref.number) {
                        if (body.id === 'PenChanged') {
                            getInfo(pID,ref.port);
                        }
                    }



                } else if (body.hasOwnProperty('destination')){
                    if (body.destination === 0) {
                        // Decide the next destination
                    }
                    // If the destination is same as this station, move the pallet to the station
                    else if (body.destination === ref.number && ref.currentPallet === 0) {
                        ref.status = "busy";
                        ref.currentPallet = body.pID;
                        move(12,ref.number);

                    }
                    else if (body.destination === ref.number && ref.currentPallet !== 0) {
                        if (ref.workpiece = "frame"){
                            if (ref.color === body.fc){
                                draw(ref.number, ref.workpiece, body);
                            } else {
                                changePen(ref.number, body.fc);
                            }
                        }
                        else if (ref.workpiece = "screen"){
                            if (ref.color === body.fc){
                                draw(ref.number, ref.workpiece, body);
                            } else {

                            }
                        }
                        else if (ref.workpiece = "keyboard"){
                            if (ref.color === body.fc){
                                draw(ref.number, ref.workpiece, body);
                            } else {

                            }
                        }

                    }
                    // If the destination is further than the current workstation --> Move on
                    else if (body.destination > ref.number) {
                        if (body.id === 'Z1_Changed' && body.payload.PalletID !== -1) {
                            // The pallet is now in zone 1 and therefore we want to move it on to Z4
                            move(14, ref.number);
                        }
                        if (body.id === 'Z4_Changed' && body.payload.PalletID !== -1) {
                            // The pallet is in zone 4, so we want to move it to next station
                            move(45, ref.number);
                        }
                    }
                }
        
            })



        }
    })
        Server.listen(this.port, function() {
        //console.log('Server started on port: ' + ref.port);

    })
};

// a function that moves pallet to different zone
function move(zone, station) {
    console.log("movePallet to zone: " + zone);
    var port = 6000 + station;

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

function changePen(station, colour) {

    var port = 6000 + station;
    colour = colour.toUpperCase();

    var options = {
        uri: "http://localhost:3000/RTU/SimROB" + station + "/services/ChangePen" + colour,
        method: 'POST',
        json: {"destUrl": "http://localhost:" + port}
    };

    request(options, function (err, response, body) {
        if (err) { console.log(err);
        } else { console.log("Colour changed");
        }
    });
}

// a function that draws to paper
function draw(station, tool, pallet) {
    console.log("movePallet to zone: " + zone);


    var port = 6000 + station;

    var options = {
        uri: "http://localhost:3000/RTU/SimCNV" + station + "/services/TransZone" + zone,
        method: 'POST',
        json: {"destUrl": "http://localhost:" + port}
    };

    request(options, function (err, response, body) {
        if (err) { console.log(err);
        } else { console.log("Picture drawn");
        }
    });
}

// Request the pallet information from WS7
function getInfo(pID, port) {
    var options = {
        uri: 'http://localhost:6007',
        method: 'Post',
        json: {
            "id": "getInfo",
            "pallet": pID,
            "port": port
        }
    };
    request(options, function (error, response, body) {
        if (error) {
            console.log(error);
        } else {
            console.log(response.statusCode, body);
        }
    });
};

Station.prototype.SendStatus = function () {
    console.log('Sending the status');
    ref = this;

    var options = {
        uri: 'http://localhost:' + ref.port,
        method: 'POST',
        json: {
            "status" : ref.status
        }
    };

    request(options, function (error, response, body) {
        if (error) {
            console.log(error);
        } else {
            console.log(response.statusCode, body);
        }
    });
};

/*Station.prototype.GetStatus = function (location, recept, ID)
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

};*/

Station.prototype.Subscribe = function (RTU_ID, service)
{
    var port = 6000 + this.number;
    //console.log(port);

    request.post('http://localhost:3000/RTU/Sim' + RTU_ID + this.number + '/events/' + service + '/notifs',
        {form:{destUrl:"http://localhost:" + port}}, function(err,httpResponse,body){
            if (err) {
                console.log(err);
            } else {
                console.log("subscribed to the " + service + " event!");
            }
        });

};

// Start the server and subscribes
Station.prototype.start = function () {
    this.runServer();
    this.Subscribe('CNV','Z1_Changed');
    this.Subscribe('CNV','Z2_Changed');
    this.Subscribe('CNV','Z3_Changed');
    this.Subscribe('CNV','Z4_Changed');
    this.Subscribe('ROB', 'PenChanged');
    // this.Subscribe('ROB','DrawEndExecution')

};

//****************** END OF CLASS DEFINTION*********************

// Define all the stations
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

// Start servers for the stations
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


