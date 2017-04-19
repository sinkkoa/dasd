/**
 * Created by Antto on 19.4.2017.
 */

var app = require('express')();
var http = require('http').Server(app);
var request = require('request');
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()); // Body parser uses JSON data

var port = 6001;

// Sunbscribes to the notifications
function subscribe() {

    // get the notification when the pallet has moved to the Z1 in CNV1
    request.post('http://localhost:3000/RTU/SimCNV1/events/Z1_Changed/notifs',
        {form: {destUrl: "http://localhost:4806"}}, function (err, httpResponse, body) {
            if (err) {
                console.log(err);
            } else {
                console.log("subscribed to the Z1 changed in station 1!");
            }
        });

    // get the notification when the pallet has moved to the Z2 in CNV1
    request.post('http://localhost:3000/RTU/SimCNV1/events/Z2_Changed/notifs',
        {form: {destUrl: "http://localhost:" + port}}, function (err, httpResponse, body) {
            if (err) {
                console.log(err);
            } else {
                console.log("subscribed to the Z2 changed in station 1!");
            }
        });

    // get the notification when the pallet has moved to the Z3 in CNV1
    request.post('http://localhost:3000/RTU/SimCNV1/events/Z3_Changed/notifs',
        {form: {destUrl: "http://localhost:" + port}}, function (err, httpResponse, body) {
            if (err) {
                console.log(err);
            } else {
                console.log("subscribed to the Z3 changed in station 1!");
            }
        });

    // get the notification when the pallet has moved to the Z5 in CNV1
    request.post('http://localhost:3000/RTU/SimCNV1/events/Z5_Changed/notifs',
        {form: {destUrl: "http://localhost:" + port}}, function (err, httpResponse, body) {
            if (err) {
                console.log(err);
            } else {
                console.log("subscribed to the Z5 changed in station 1!");
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



// Takes the POST requests
app.post('/', function(req, res) {
    // Shows that we post now
    console.log("Got POST request that is: ");
    console.log(req.body);
    console.log(req.payload);


    if (req.body.senderID === 'SimCNV1') {
        if (req.body.id === 'Z1_Changed' && req.body.payload.PalletID !== -1) {
            move(12,1);
        }
        if (req.body.id === 'Z2_Changed' && req.body.payload.PalletID !== -1) {
            move(23,1);
        }
        if (req.body.id === 'Z3_Changed' && req.body.payload.PalletID !== -1) {
            request.post('http://localhost:3000/RTU/SimROB1/services/LoadPaper',
                {form: {destUrl: "http://localhost:" + port}}, function (err, httpResponse, body) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("Paper loaded!");
                    }
                });
        }
    }

})

subscribe();

// Start listening
http.listen(port, function(){
    console.log('WS1 Agent listens to port ' + port);
    console.log('\n');
});
