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

var exit = function exit() {
  setTimeout(function () {
    process.exit(1);
  }, 0);
};

app.use(function (error, req, res, next) {
  if (error.status === 400) {
    log.info(error.body);
    return res.send(400);
  }

  log.error(error);
  exit();
});

// Workstation information
var Station = function Station(number, workpiece) {
    this.number = number;
    this.workpiece = workpiece;
    this.color = "RED";
    this.status = "idle";
    this.port = 6000 + number;
    this.currentPallet = 0;
};

// A function that runs all the workstation servers
Station.prototype.runServer =  function() {

    var ref = this;
    var helpnumber = 0;
    var currentOrder = {};
    console.log("Server port: " + ref.port);

    var Server = http.createServer(function(req, res) {
        var method = req.method;

        //console.log("Method: " + method);

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
                //console.log("Parsed JSON body: ");
                //console.log(body);

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
                            // move(14, ref.number);
                        }
                        // Wait for Z2 change and then move to Z3
                        else if (body.id === 'Z2_Changed' && body.payload.PalletID !== -1){
                            move(23,ref.number);
                        }

                        // Wait for Z3 change and then check is this frame, screen or keyboard station
                        else if (body.id === 'Z3_Changed' && body.payload.PalletID !== -1){
                            console.log("---> "+ ref.workpiece);
                            currentOrder.fc = currentOrder.fc.toUpperCase();
                            currentOrder.sc = currentOrder.sc.toUpperCase();
                            currentOrder.kc = currentOrder.kc.toUpperCase();
                            if (ref.workpiece === "frame"){
                                // If the station has right pen, draws the picture
                                console.log("Frame branch");
                                console.log(currentOrder);
                                if (ref.color === currentOrder.fc){
                                    console.log("Drawing a frame. FC: " + currentOrder.fc)
                                    draw(ref.number, ref.workpiece, currentOrder);
                                    console.log("Piirrän: " + currentOrder.fc);
                                }
                                // If the pen is not right, change the pen
                                else {
                                    console.log("Changing the pen colour");
                                    ref.color = currentOrder.fc;
                                    changePen(ref.number, currentOrder.fc);
                                }
                            }
                            else if (ref.workpiece === "screen"){
                                console.log("Screen branch");
                                if (ref.color === currentOrder.sc){
                                    console.log("Drawing a screen. SC: " + currentOrder.sc)
                                    draw(ref.number, ref.workpiece, currentOrder);
                                } else {
                                    console.log("Changing the pen colour");
                                    ref.color = currentOrder.sc;
                                    changePen(ref.number, currentOrder.sc);
                                }
                            }
                            else if (ref.workpiece === "keyboard"){
                                console.log("Keyboard branch");
                                if (ref.color === currentOrder.kc){
                                    console.log("Drawing a keyboard. KC: " + currentOrder.sc)
                                    draw(ref.number, ref.workpiece, currentOrder);
                                } else {
                                    console.log("Changing the pen colour");
                                    ref.color = currentOrder.kc;
                                    changePen(ref.number, currentOrder.kc);
                                }
                            }

                        }
                        else if (body.id === 'Z4_Changed' && body.payload.PalletID !== -1) {
                            // The pallet is in zone 4, so we want to move it to next station
                            move(45, ref.number);
                        }
                    }
                    // Catch the messages if they have come from ROB
                    if (body.senderID === 'SimROB' + ref.number) {
                      // If the pen is changed, fraw the picture
                        if (body.id === 'PenChanged') {
                            console.log("Drawing a " + ref.workpiece)
                            draw(ref.number, ref.workpiece, currentOrder);
                        }
                        // If the drawing has done, decide the next station
                        if (body.id === 'DrawEndExecution') {
                            // Ask the next destination based on what station pallet is
                            if (ref.number === 2 || ref.number === 3 || ref.number === 4) {
                                ref.requestStatus(6005);
                            }
                            else if (ref.number === 5 || ref.number === 6 || ref.number === 8) {
                                ref.requestStatus(6009);
                            }
                            else if (ref.number === 9 || ref.number === 10 || ref.number === 11) {
                                // Sends the pallet back to WS1 for unloading the paper
                                updateDestination(currentOrder.pID, 1);
                                ref.status = 'idle';
                                move(35, ref.number);
                            }
                        }
                    }

                // The body now has destination in it, so it has come from WS7 and is telling the pallet details
                } else if (body.hasOwnProperty('destination')){
                    // If the destination is same as this station, move the pallet to the station
                    if (body.destination === ref.number) {
                        currentOrder = body;
                        ref.currentPallet = body.pID;
                        move(12,ref.number);
                    }

                    // If the destination is further than the current workstation or it is station 1 --> Move on
                    else if (body.destination > ref.number || body.destination === 1) {
                        // The pallet is now in zone 1, and needs to move forward
                        move(14, ref.number);
/*                        if (body.id === 'Z4_Changed' && body.payload.PalletID !== -1) {
                            // The pallet is in zone 4, so we want to move it to next station
                            move(45, ref.number);
                        }*/
                    }
                }
                // If the status of the station is requested, sends it
                else if (body.hasOwnProperty('id')) {
                    if (body.id === 'getStatus') {
                        ref.SendStatus(body.port);
                    }
                }
                // if status is received, checks if its idle or busy
                else if (body.hasOwnProperty('status')) {
                    // Status is idle, so the pallet is send there
                    if (body.status === 'idle') {
                        console.log("UPDATE DESTINATION")
                        updateDestination(currentOrder.pID, body.station);
                        helpnumber = 0;
                        ref.status = 'idle';
                        move(35,ref.number);
                    }
                    // Station is not idle, so we asks the other two stations
                    else {
                        ++ helpnumber;
                        // A if that makes this loop between three adjacent ports
                        // until one of them is idle
                        if (helpnumber > 2) {
                            helpnumber = 0;
                        }
                        // For stations 2,3 and 4 the stations that are asked are 5, 6 and 8
                        if (ref.number === 2 || ref.number === 3 || ref.number === 4) {
                          if (helpnumber === 2) {
                            ref.requestStatus(6008);
                          }
                          else {
                            ref.requestStatus(6005 + helpnumber);
                          }
                        }
                        // For stations 5,6 and 8 the stations that are asked are 9, 10 and 11
                        else if (ref.number === 5 || ref.number === 6 || ref.number === 8) {
                            ref.requestStatus(6009 + helpnumber);
                        }
                    }
                }

            })
            res.end('OK');
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
        if (err) { console.log(err + "1");
        } else { console.log("liikkuu");
        }
    });
}

function changePen(station, colour) {

    var port = 6000 + station;
    var penColor = colour.toUpperCase();

    var options = {
        uri: "http://localhost:3000/RTU/SimROB" + station + "/services/ChangePen" + penColor,
        method: 'POST',
        json: {"destUrl": "http://localhost:" + port}
    };

    request(options, function (err, response, body) {
        if (err) { console.log(err + "2");
        } else { console.log("Colour changed to: " + penColor + "\n");
        }
    });
}

// a function that draws to paper
function draw(station, tool, pallet) {
    var port = 6000 + station;
    var recipe = 0;

    // Decide what recipe to use
    if (tool === 'frame') {
        recipe = pallet.frame;
        console.log(recipe);

    }
    else if (tool === 'keyboard') {
        recipe = 3 + parseInt(pallet.keyboard);
        console.log(recipe);

    }
    else if (tool === 'screen') {
        recipe = 6 + parseInt(pallet.screen);
        console.log(recipe);
    }

    var options = {
        uri: "http://localhost:3000/RTU/SimROB" + station + "/services/Draw" + recipe,
        method: 'POST',
        json: {"destUrl": "http://localhost:" + port}
    };

    request(options, function (err, response, body) {
        if (err) { console.log(err + "3");
        } else { console.log("Picture drawn:" + options.uri);
        }
    });
}

function updateDestination(pID, destination) {
    var options = {
        uri: 'http://localhost:6007',
        method: 'Post',
        json: {
            "id": "updateDestination",
            "pallet": pID,
            "destination": destination,
        }
    };
    request(options, function (error, response, body) {
        if (error) {
            console.log(error + "4");
        } else {
            //console.log(response.statusCode, body);
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
            console.log(error + "5");
        } else {
            //console.log(response.statusCode, body);
        }
    });
};

Station.prototype.requestStatus = function (stationPort) {
    var ref = this
    var options = {
        uri: 'http://localhost:' + stationPort,
        method: 'Post',
        json: {
            "id": "getStatus",
            "port": ref.port
        }
    };
    request(options, function (error, response, body) {
        if (error) {
            console.log(error + "6");
        } else {
            //console.log(response.statusCode, body);
        }
    });
}

Station.prototype.SendStatus = function (requestedPort) {
    console.log('Sending the status');
    var ref = this;

    var options = {
        uri: 'http://localhost:' + requestedPort,
        method: 'POST',
        json: {
            "status": ref.status,
            "station": ref.number
        }
    };

    request(options, function (error, response, body) {
        if (error) {
            console.log(error + "7");
        } else {
            //console.log(response.statusCode, body);
        }
    });

    // Now if the status was send as idle, lets change it to busy
    // because a pallet has now been assigned to it
    if (ref.status === 'idle') {
        ref.status = 'busy'
    }
};

Station.prototype.Subscribe = function (RTU_ID, service)
{
    var port = 6000 + this.number;
    //console.log(port);

    request.post('http://localhost:3000/RTU/Sim' + RTU_ID + this.number + '/events/' + service + '/notifs',
        {form:{destUrl:"http://localhost:" + port}}, function(err,httpResponse,body){
            if (err) {
                console.log(err + "8");
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
    this.Subscribe('ROB','PenChanged');
    this.Subscribe('ROB','DrawEndExecution');

};

//****************** END OF CLASS DEFINTION*********************

// Define all the stations
var WS2 = new Station(2,'frame');
var WS3 = new Station(3,'frame');
var WS4 = new Station(4,'frame');
var WS5 = new Station(5,'screen');
var WS6 = new Station(6,'screen');
var WS8 = new Station(8,'screen');
var WS9 = new Station(9,'keyboard');
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
