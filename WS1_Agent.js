/**
 * Created by Antto on 19.4.2017.
 */

var app = require('express')();
var http = require('http').Server(app);
var request = require('request');
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var port = 6001;
var helpnumber = 0;
var pIDinStation;

// Sunbscribes to the notifications
function subscribe() {

    // get the notification when the pallet has moved to the Z1 in CNV1
    request.post('http://localhost:3000/RTU/SimCNV1/events/Z1_Changed/notifs',
        {form:{destUrl:"http://localhost:" + port}}, function(err,httpResponse, body){
            if (err) {
                console.log(err);
            } else {
                console.log("Subscribed to the Z1 changed in CNV1!");
            }
        });

    // get the notification when the pallet has moved to the Z2 in CNV1
    request.post('http://localhost:3000/RTU/SimCNV1/events/Z2_Changed/notifs',
        {form:{destUrl:"http://localhost:" + port}}, function(err, httpResponse, body) {
            if (err) {
                console.log(err);
            } else {
                console.log("subscribed to the Z2 changed in CNV1!");
            }
        });

    // get the notification when the pallet has moved to the Z3 in CNV1
    request.post('http://localhost:3000/RTU/SimCNV1/events/Z3_Changed/notifs',
        {form:{destUrl:"http://localhost:" + port}}, function(err, httpResponse, body) {
            if (err) {
                console.log(err);
            } else {
                console.log("subscribed to the Z3 changed in CNV1!");
            }
        });

    // get the notification when the pallet has moved to the Z5 in CNV1
    request.post('http://localhost:3000/RTU/SimCNV1/events/Z5_Changed/notifs',
        {form:{destUrl:"http://localhost:" + port}}, function(err, httpResponse, body) {
            if (err) {
                console.log(err);
            } else {
                console.log("subscribed to the Z5 changed in CNV1!");
            }
        });

    // get the notification when the paper is loaded to the pallet
    request.post('http://localhost:3000/RTU/SimROB1/events/PaperLoaded/notifs',
        {form:{destUrl:"http://localhost:" + port}}, function(err, httpResponse, body) {
            if (err) {
                console.log(err);
            } else {
                console.log("subscribed to the pallet loaded!");
            }
        });

    // get the notification when the paper is unloaded to the pallet
    request.post('http://localhost:3000/RTU/SimROB1/events/PaperUnloaded/notifs',
        {form:{destUrl:"http://localhost:" + port}}, function(err, httpResponse, body) {
            if (err) {
                console.log(err);
            } else {
                console.log("subscribed to the pallet unloaded!");
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
        } else { console.log("liikkuu");
        }
    });
}

// A function that loads the paper to the pallet
function loadPaper() {
    request.post('http://localhost:3000/RTU/SimROB1/services/LoadPaper',
        {form: {destUrl: "http://localhost:" + port}}, function (err, httpResponse, body) {
            if (err) {
                console.log(err);
            } else {
                console.log("Paper loaded!");
            }
        });
}

// unloads the paper from the pallet
function unloadPaper() {
    request.post('http://localhost:3000/RTU/SimROB1/services/UnloadPaper',
        {form: {destUrl: "http://localhost:" + port}}, function (err, httpResponse, body) {
            if (err) {
                console.log(err);
            } else {
                console.log("Paper unloaded!");
            }
        });
}

// Request the pallet information from WS7
function getInfo(pID) {
    var options = {
        uri: 'http://localhost:6007',
        method: 'Post',
        json: {
            "id": "getInfo",
            "pallet": pID,
            "port": '6001'
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

function requestStatus(stationPort, asker) {
    var options = {
        uri: 'http://localhost:' + stationPort,
        method: 'Post',
        json: {
            "id": "getStatus",
            "port": asker
        }
    };
    request(options, function (error, response, body) {
        if (error) {
            console.log(error);
        } else {
            console.log(response.statusCode, body);
        }
    });
}

// Update the paper information in the WS7
function updateInfoPaper(pID, paperStatus, palletStatus) {
    var options = {
        uri: 'http://localhost:6007',
        method: 'Post',
        json: {
            "id": "updateInfoPaper",
            "pallet": pID,
            "paper": paperStatus,
            "ready": palletStatus,
            "port": '6001'
        }
    };
    request(options, function (error, response, body) {
        if (error) {
            console.log(error);
        } else {
            console.log(response.statusCode, body);
        }
    });
}

// Update the pallet destination in the WS7
function updateDestination(pID, destination) {
    var options = {
        uri: 'http://localhost:6007',
        method: 'Post',
        json: {
            "id": "updateDestination",
            "pallet": pID,
            "destination": destination,
            "port": '6001'
        }
    };
    request(options, function (error, response, body) {
        if (error) {
            console.log(error);
        } else {
            console.log(response.statusCode, body);
        }
    });
}

// Takes the POST requests
app.post('/', function(req, res) {
    // Shows that we post now
    console.log("Got POST request that is: ");
    console.log(req.body);

    if (req.body.hasOwnProperty('senderID')) {
        // Ifs for moving the pallet to the paper loading
        if (req.body.senderID === 'SimCNV1') {
            if (req.body.id === 'Z1_Changed' && req.body.payload.PalletID !== -1) {
                move(12,1);
            }
            if (req.body.id === 'Z2_Changed' && req.body.payload.PalletID !== -1) {
                move(23,1);
            }
            if (req.body.id === 'Z3_Changed' && req.body.payload.PalletID !== -1) {
                getInfo(req.body.payload.PalletID);
                pIDinStation = req.body.payload.PalletID;
                // loadPaper();
            }
        }
        if (req.body.senderID === 'SimROB1') {
            // If for moving the pallet from the paper loading
            if (req.body.id === 'PaperLoaded') {
                requestStatus(6002, 6001);
   //             move(35,1);
            }
            // If for moving the pallet from the paper unloading
            if (req.body.id === 'PaperUnloaded') {
                move(35,1);
            }
        }
    }
    if (req.body.hasOwnProperty('status')) {
        if (req.body.status === 'idle') {
            console.log("UPDATE DESTINATION")
            updateDestination(pIDinStation, req.body.station);
            helpnumber = 0;
            move(35,1);
            // maybe update status now
        }
        // Station is not idle, so we asks the other two stations
        else {
            ++ helpnumber;
            if (helpnumber > 2) {
                helpnumber = 0;
            }
            requestStatus(6002 + helpnumber, 6001);
        }
    }
    if (req.body.hasOwnProperty('paper')) {
        if (req.body.paper === false) {
            loadPaper();
            updateInfoPaper(req.body.pID, true, false);
        }
        if (req.body.paper === true) {
            unloadPaper();
            updateInfoPaper(req.body.pID, false, true);
        }
    }

    res.end('Post ok');

});


// Calls the subscribe function
subscribe();

// Start listening
http.listen(port, function(){
    console.log('WS1 Agent listens to port ' + port);
    console.log('\n');
});
