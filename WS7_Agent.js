/**
 * Created by Antto on 13.4.2017.
 */

var app = require('express')();
var http = require('http').Server(app);
var request = require('request');
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()); // Body parser uses JSON data

var port = 4805;

// resets the lines when the program starts
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

// Load the pallets to the simulator
request.post('http://localhost:3000/RTU/SimROB7/services/LoadPallet',
    {form:{destUrl:"http://localhost:4007"}}, function(err,httpResponse,body){
        // Checks for errors
        if (err) {
            console.log(err);
        } else {
            // Moves the pallet to the station 1, if the line is free
            move(35, 7);
            if ()
            move(14, 8);


        }

        console.log("Loading pallet to the zone3!");
        // debuggausta varten voi logata juttuja:
        // console.log(err);
        // console.log(body);
        // console.log(httpResponse);
    });

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
app.post('/', function(req, res){
    // Shows that we post now
    console.log("Got POST request that is: ");
    console.log(req.body);
    console.log(req.query);

    // jos halutaan vastaa jotain, ei pakollinen
    res.write("response is written here. thank you for sending POST to riikka.js");

    // tää on hyvä laittaa, muuten saattaa tulla timeoutteja yms kun lähettäjä odottelee vastauksen loppua
    res.end('post ok');
});

// Start listening
http.listen(port, function(){
    console.log('Program listens to port ' + port);
    console.log('\n');
});
