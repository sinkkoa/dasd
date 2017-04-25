/**
 * Created by Antto on 13.4.2017.
 */

var app = require('express')();
var http = require('http').Server(app);
var request = require('request');
var bodyParser = require('body-parser');
var uuid = require('uuid');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()); // Body parser uses JSON data

var port = 6007;

// A json where we can store the pallets that are in the production line.
// Now we can give the palets a variable that tells us if the pallet has a
// destionation, or should the workstations decide it
var pallets = {};

// Variables for saving the order details temporary
var frame;
var screen;
var keyboard;
var fc;
var sc;
var kc;

// Sunbscribes to the notifications
function subscribe() {
    //resets the lines when the program starts
    request.post('http://localhost:3000/RTU/reset',
        {form:{destUrl:"http://localhost:" + port}}, function(err, httpResponse, body){
            console.log(body);
            if (err) {
                console.log(err);
            } else {
                console.log("Reseted Fastory line");
            }
        });

    // get the notification when pallet is loaded to the zone3
    request.post('http://localhost:3000/RTU/SimROB7/events/PalletLoaded/notifs',
        {form:{destUrl:"http://localhost:" + port}}, function(err,httpResponse,body){
            if (err) {
                console.log(err);
            } else {
                console.log("subscribed to the PalletLoaded event!");
            }
        });

    // get the notification when the pallet has moved to the Z1 in CNV7
    request.post('http://localhost:3000/RTU/SimCNV7/events/Z1_Changed/notifs',
        {form:{destUrl:"http://localhost:" + port}}, function(err,httpResponse,body){
            if (err) {
                console.log(err);
            } else {
                console.log("subscribed to the Z1 changed in station 7!");
            }
        });

    // get the notification when the pallet has moved to the Z2 in CNV7
    request.post('http://localhost:3000/RTU/SimCNV7/events/Z2_Changed/notifs',
        {form:{destUrl:"http://localhost:" + port}}, function(err,httpResponse,body){
            if (err) {
                console.log(err);
            } else {
                console.log("subscribed to the Z1 changed in station 7!");
            }
        });

    // get the notification when the pallet has moved to the Z3 in CNV7
    request.post('http://localhost:3000/RTU/SimCNV7/events/Z3_Changed/notifs',
        {form:{destUrl:"http://localhost:" + port}}, function(err,httpResponse,body){
            if (err) {
                console.log(err);
            } else {
                console.log("subscribed to the Z3 changed in station 7!");
            }
        });
}

function loadPallet() {
    // Load the pallets to the simulator
    request.post('http://localhost:3000/RTU/SimROB7/services/LoadPallet',
        {form:{destUrl:"http://localhost:" + port}}, function(err,httpResponse,body){
            // Checks for errors
            if (err) {
                console.log(err);
            } else {
                //console.log(body);
            }

            console.log("Loading pallet to the zone3!");
            // debuggausta varten voi logata juttuja:
            // console.log(err);
            // console.log(body);
            // console.log(httpResponse);
        });
}

function unloadPallet() {
    // Unload the pallet from the simulator
    request.post('http://localhost:3000/RTU/SimROB7/services/UnloadPallet',
        {form:{destUrl:"http://localhost:" + port}}, function(err,httpResponse,body){
            // Checks for errors
            if (err) {
                console.log(err);
            } else {
                //console.log(body);
            }

            console.log("Unloading pallet from the zone3!");
            // debuggausta varten voi logata juttuja:
            // console.log(err);
            // console.log(body);
            // console.log(httpResponse);
        });
}

// Send the pallet information to other stations
function sendInfo(info, stationPort) {
    var options = {
        uri: 'http://localhost:' + stationPort,
        method: 'Post',
        json: info
    };
    request(options, function (error, response, body) {
        if (error) {
            console.log(error);
        } else {
            console.log(response.statusCode, body);
        }
    });
}


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
        } else { console.log("liikkuu -------------------->");
        }
    });
}

// Make new order
app.post('/order/', function(req, res){
    var data = {
        "New Order": ""
    };

    var query = req.query; //Accessing query -> en saanu bodyä ulos ja näytti että se ei ees mee tuohon queryyn
                            // mutta jos postmanilla tekee tilausken parametreina niin ok.
                            //Tallennetaan tilaus palletionlatauksen ytheydessä sen id:n kanssa samaan objektiin

    //console.log(req);
    console.log(query);
    console.log();
    // Access the attributes and store them into variables
    
    frame = query.frame;
    screen = query.screen;
    keyboard = query.keyboard;
    fc = query.fc;
    sc = query.sc;
    kc = query.kc;
/*
    console.log(frame);
    console.log(screen);
    console.log(keyboard);
*/

    // Load the pallet to FASTory line
    loadPallet();

    // Ending request to prevent timeouts
    res.end('Phone has been ordered. Order ok!');
});


// Takes the POST requests
app.post('/', function(req, res){

    var options = {}

    // Saves the pallet id with pallet info and moves the pallet when pallet is loaded
    if (req.body.id === 'PalletLoaded') {
        var pID = req.body.payload.PalletID;
        console.log(pID);
        pallets[req.body.payload.PalletID] = {
            "frame": frame,
            "screen": screen,
            "keyboard": keyboard,
            "fc": fc,
            "sc": sc,
            "kc": kc,
            "pID": pID,
            "destination": 1,
            "paper": false,
            "ready": false
         };
        move(35, 7);
        
        options = {
            url: "http://localhost:6001/takeOrder", //Worksation 1
            method: "POST",
            //here we are using our server url:
            json: {
                "frame": frame,
                "screen": screen,
                "keyboard": keyboard,
                "fc": fc,
                "sc": sc,
                "kc": kc,

                "pID": pID,
                "destination": null,
                "ready": false
            }
        
        }
    }

    // if the body has getInfo ID, uses sendInfo function to send the pallet info
    if (req.body.id === 'getInfo') {
        var information = pallets[req.body.pallet];
        sendInfo(information, req.body.port);
    }

    // If the body ID is updateInfoPaper, checks what data is changed, and changes it
    if (req.body.id === 'updateInfoPaper') {
        // Paper info s now changed
        if (req.body.hasOwnProperty('paper')) {
            if (pallets[req.body.pallet]) {
                pallets[req.body.pallet].paper = req.body.paper;
                console.log("paper status updated!")
                pallets[req.body.pallet].ready = req.body.ready;
                console.log("pallet status updated as ready!")
            }
        }
    }
    if (req.body.id === 'updateDestination') {
        // Destination is now changed
        console.log("DESTINATION INFO")
        console.log(req.body)
        if (pallets[req.body.pallet]) {
            pallets[req.body.pallet].destination = req.body.destination;
            console.log("destination updated!")
        }
    }

    if (req.body.senderID === 'SimCNV7') {
        if (req.body.id === 'Z1_Changed' && req.body.payload.PalletID !== -1) {
            var id = req.body.payload.PalletID;
            if (pallets.hasOwnProperty(id)) {
                if (pallets[id].destination === 1) {
                    move(12, 7);
                }
            }
        }
        if (req.body.id === 'Z2_Changed' && req.body.payload.PalletID !== -1) {
            var id = req.body.payload.PalletID;
            if (pallets.hasOwnProperty(id)) {
                if (pallets[id].destination === 1) {
                    move(23, 7);
                }
            }
        }
        if (req.body.id === 'Z3_Changed' && req.body.payload.PalletID !== -1) {
            var id = req.body.payload.PalletID;
            if (pallets.hasOwnProperty(id)) {
                if (pallets[id].paper === false && pallets[id].ready === true) {
                    // No paper and pallet ready, so remove the pallet
                    unloadPallet();
                    // Delete the pallet information from pallets json
                    delete pallets[id];
                }

                else if (pallets[id].paper === true) {
                    // Pallet has a paper, so send it the another round
                    move(35, 7);
                }
            }
        }
    }

    // End request
    res.end('Post ok');
});

// Starting subscription
subscribe();

// Start listening
http.listen(port, function(){
    console.log('Program listens to port ' + port);
    console.log('\n');
});
