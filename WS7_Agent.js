/**
 * Created by Antto on 13.4.2017.
 */

var app = require('express')();
var http = require('http').Server(app);
var request = require('request');
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()); // Body parser uses JSON data

var port = 6007;

// A json where we can store the pallets that are in the production line.
// Now we can give the palets a variable that tells us if the pallet has a
// destionation, or should the workstations decide it
var pallets = {};

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
    // get the notification when the pallet has moved to the Z1 in CNV8
    request.post('http://localhost:3000/RTU/SimCNV8/events/Z1_Changed/notifs',
        {form:{destUrl:"http://localhost:" + port}}, function(err,httpResponse,body){
            if (err) {
                console.log(err);
            } else {
                console.log("subscribed to the Z1 changed in station 8!");
            }
        });
    // get the notification when the pallet has moved to the Z4 in CNV8
    request.post('http://localhost:3000/RTU/SimCNV8/events/Z4_Changed/notifs',
        {form:{destUrl:"http://localhost:" + port}}, function(err,httpResponse,body){
            if (err) {
                console.log(err);
            } else {
                console.log("subscribed to the Z4 changed in station 8!");
            }
        });

    // get the notification when the pallet has moved to the Z1 in CNV9
    request.post('http://localhost:3000/RTU/SimCNV9/events/Z1_Changed/notifs',
        {form:{destUrl:"http://localhost:" + port}}, function(err,httpResponse,body){
            if (err) {
                console.log(err);
            } else {
                console.log("subscribed to the Z1 changed in station 9!");
            }
        });
    // get the notification when the pallet has moved to the Z4 in CNV9
    request.post('http://localhost:3000/RTU/SimCNV9/events/Z4_Changed/notifs',
        {form:{destUrl:"http://localhost:" + port}}, function(err,httpResponse,body){
            if (err) {
                console.log(err);
            } else {
                console.log("subscribed to the Z4 changed in station 9!");
            }
        });

    // get the notification when the pallet has moved to the Z1 in CNV10
    request.post('http://localhost:3000/RTU/SimCNV10/events/Z1_Changed/notifs',
        {form:{destUrl:"http://localhost:" + port}}, function(err,httpResponse,body){
            if (err) {
                console.log(err);
            } else {
                console.log("subscribed to the Z1 changed in station 10!");
            }
        });

    // get the notification when the pallet has moved to the Z4 in CNV10
    request.post('http://localhost:3000/RTU/SimCNV10/events/Z4_Changed/notifs',
        {form:{destUrl:"http://localhost:" + port}}, function(err,httpResponse,body){
            if (err) {
                console.log(err);
            } else {
                console.log("subscribed to the Z4 changed in station 10!");
            }
        });

    // get the notification when the pallet has moved to the Z1 in CNV11
    request.post('http://localhost:3000/RTU/SimCNV11/events/Z1_Changed/notifs',
        {form:{destUrl:"http://localhost:" + port}}, function(err,httpResponse,body){
            if (err) {
                console.log(err);
            } else {
                console.log("subscribed to the Z1 changed in station 11!");
            }
        });

    // get the notification when the pallet has moved to the Z4 in CNV11
    request.post('http://localhost:3000/RTU/SimCNV11/events/Z4_Changed/notifs',
        {form:{destUrl:"http://localhost:" + port}}, function(err,httpResponse,body){
            if (err) {
                console.log(err);
            } else {
                console.log("subscribed to the Z4 changed in station 11!");
            }
        });

    // get the notification when the pallet has moved to the Z1 in CNV12
    request.post('http://localhost:3000/RTU/SimCNV12/events/Z1_Changed/notifs',
        {form:{destUrl:"http://localhost:" + port}}, function(err,httpResponse,body){
            if (err) {
                console.log(err);
            } else {
                console.log("subscribed to the Z1 changed in station 12!");
            }
        });

    // get the notification when the pallet has moved to the Z4 in CNV12
    request.post('http://localhost:3000/RTU/SimCNV12/events/Z4_Changed/notifs',
        {form:{destUrl:"http://localhost:" + port}}, function(err,httpResponse,body){
            if (err) {
                console.log(err);
            } else {
                console.log("subscribed to the Z4 changed in station 12!");
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
            }

            console.log("Loading pallet to the zone3!");
            // debuggausta varten voi logata juttuja:
            // console.log(err);
            // console.log(body);
            // console.log(httpResponse);
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
        } else { console.log("liikkuu");
        }
    });
}

// Make new order
app.post('/order/', function(req, res){
    var data = {
        "New Order": ""
    };

    var query = req.query; //Accessing query

    // Access the attributes and store them into variables
    var frame = query.frame;
    var screen = query.screen;
    var keyboard = query.keyboard;
    var fc = query.fc;
    var sc = query.sc;
    var kc = query.kc;

    var options = {
        url: "http://localhost:6001/", //Worksation 1
        method: "POST",
        //here we are using our server url:
        json: {
            "frame": frame,
            "screen": screen,
            "keyboard": keyboard,
            "fc": fc,
            "sc": sc,
            "kc": kc
        } //Body. These values get passed on when requested.
    }

    //logging request. just for debugging purposes, so that you can see if something goes wrong
    console.log(JSON.stringify(options));
    //request from require('request')
    request(options, function (error, response, body) {
        if (error) {
            console.log(error);
        } else {
            console.log(response.statusCode, body);
        }
    });


    // Load the pallet to FASTory line
    loadPallet();
});


// Takes the POST requests
app.post('/', function(req, res){

    // Saves the pallet id with pallet info and moves the pallet when pallet is loaded
    if (req.body.id === 'PalletLoaded') {
        pallets[req.body.payload.PalletID] = { destination: 1};
        move(35, 7);
    }

    // All the following ifs are for moving the pallet from WS7 to the WS1
    if (req.body.senderID === 'SimCNV8') {
        if (req.body.id === 'Z1_Changed' && req.body.payload.PalletID !== -1) {
            var id = req.body.payload.PalletID;
            if (pallets.hasOwnProperty(id)) {
                if (pallets[id].destination === 1) {
                    move(14, 8);
                }
            }

        }
        if (req.body.id === 'Z4_Changed' && req.body.payload.PalletID !== -1) {
            var id = req.body.payload.PalletID;
            if (pallets.hasOwnProperty(id)) {
                if (pallets[id].destination === 1) {
                    move(45, 8);
                }
            }
        }

    }

    if (req.body.senderID === 'SimCNV9') {
        if (req.body.id === 'Z1_Changed' && req.body.payload.PalletID !== -1) {
            var id = req.body.payload.PalletID;
            if (pallets.hasOwnProperty(id)) {
                if (pallets[id].destination === 1) {
                    move(14, 9);
                }
            }
        }
        if (req.body.id === 'Z4_Changed' && req.body.payload.PalletID !== -1) {
            var id = req.body.payload.PalletID;
            if (pallets.hasOwnProperty(id)) {
                if (pallets[id].destination === 1) {
                    move(45, 9);
                }
            }
        }
    }
    if (req.body.senderID === 'SimCNV10') {
        if (req.body.id === 'Z1_Changed' && req.body.payload.PalletID !== -1) {
            var id = req.body.payload.PalletID;
            if (pallets.hasOwnProperty(id)) {
                if (pallets[id].destination === 1) {
                    move(14, 10);
                }
            }
        }
        if (req.body.id === 'Z4_Changed' && req.body.payload.PalletID !== -1) {
            var id = req.body.payload.PalletID;
            if (pallets.hasOwnProperty(id)) {
                if (pallets[id].destination === 1) {
                    move(45, 10);
                }
            }
        }
    }
    if (req.body.senderID === 'SimCNV11') {
        if (req.body.id === 'Z1_Changed' && req.body.payload.PalletID !== -1) {
            var id = req.body.payload.PalletID;
            if (pallets.hasOwnProperty(id)) {
                if (pallets[id].destination === 1) {
                    move(14, 11);
                }
            }
        }
        if (req.body.id === 'Z4_Changed' && req.body.payload.PalletID !== -1) {
            var id = req.body.payload.PalletID;
            if (pallets.hasOwnProperty(id)) {
                if (pallets[id].destination === 1) {
                    move(45, 11);
                }
            }
        }
    }
    if (req.body.senderID === 'SimCNV12') {
        if (req.body.id === 'Z1_Changed' && req.body.payload.PalletID !== -1) {
            var id = req.body.payload.PalletID;
            if (pallets.hasOwnProperty(id)) {
                if (pallets[id].destination === 1) {
                    move(14, 12);
                }
            }
        }
        if (req.body.id === 'Z4_Changed' && req.body.payload.PalletID !== -1) {
            var id = req.body.payload.PalletID;
            if (pallets.hasOwnProperty(id)) {
                if (pallets[id].destination === 1) {
                    move(45, 12);
                }
            }
        }
    }

    // jos halutaan vastaa jotain, ei pakollinen
    res.write("response is written here. thank you for sending POST to riikka.js");

    // tää on hyvä laittaa, muuten saattaa tulla timeoutteja yms kun lähettäjä odottelee vastauksen loppua
    res.end('post ok');
});

subscribe();

// Start listening
http.listen(port, function(){
    console.log('Program listens to port ' + port);
    console.log('\n');
});
