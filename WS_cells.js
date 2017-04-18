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

var port = 4221;

var Station = function Station(number, capability) {
    this.number = number;
    // this.connections = [];
    //this.flagVisited = false;
    this.capability = capability;
    this.port = 1234;
    this.url = "127.0.0.1";
    this.status = "idle";
};

Station.prototype.runServer =  function() {
    port = 6000 + this.number;
    var ref = this;
    console.log(port);

    var Server = http.createServer(function(req, res) {
        var method = req.method;

        console.log("Method: " + method);

        if (method == 'GET') {
            //Handle GET method.
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/plain');
            res.end('Agent ' + ref.number + ' is running.');
        } else if (method == 'POST') {
            //Handle POST method.
            var body = []; //Getting data: https://nodejs.org/en/docs/guides/anatomy-of-an-http-transaction/
            req.on('data', function(chunk) {
                body.push(chunk);
                console.log("Body???: " + body.toString());
                //Handle request.

                // Parses the elements from the body
                var elem = body.toString()
                // remove all the unnecassary chars
                elem = replaceall('"', "", elem)
                elem = replaceall('{', "", elem)
                elem = replaceall('}', "", elem)
                elem = replaceall('\n', "", elem)
                elem = replaceall(' ', "", elem)
                elem = elem.split(",");
                var frame = elem[0];
                frame = frame.split(":")
                // frame = frame.substr(2);
                var screen = elem[1];
                screen = screen.split(":")
                // screen = screen.substr(1);
                var keyboard = elem[2];
                keyboard = keyboard.split(":")
                // keyboard = keyboard.substr(1);
                // keyboard = keyboard.substr(0, keyboard.length - 2);
                console.log(frame)
                console.log(screen)
                console.log(keyboard)


            })
        }
    })
        Server.listen(port, function() {
        console.log('Server started on port: ' + port);

    })
}

Station.prototype.GetStatus = function (location, recept, ID)
{
    console.log('Asking for the status '+ ID);
    var ref = this
    var cellport = serverBasePort+cellPlace

    var options = {
        uri: fastIP+':'+cellport, // What url
        method: 'POST',
        json: {
            "location" : ""+this.place+"", "recept": recept, "ID": ID
        }
    };

    var destination= 0;
    request(options, function (error, response, body){

        if (!error && response.statusCode == 200) {
            console.log("palletin body =" + body); // Print the shortened url.
        }
        else
        {
            console.log(error);
        }

    })

}

Station.prototype.Subscribe = function (RTU_ID, service)
{
    port = 6000 + this.number;
    console.log(port);

    request.post('http://localhost:3000/RTU/SimROB' + this.number + '/events/' + service + '/notifs',
        {form:{destUrl:"http://localhost:" + port}}, function(err,httpResponse,body){
            if (err) {
                console.log(err);
            } else {
                console.log("subscribed to the " + service + " event!");
            }
        });

}


Station.prototype.start = function () {
    this.runServer();
    this.Subscribe('CNV','Z1_Changed')
    this.Subscribe('CNV','Z2_Changed')
    this.Subscribe('CNV','Z3_Changed')
    this.Subscribe('CNV','Z4_Changed')
    // this.Subscribe('ROB','DrawEndExecution')

}

//****************** END OF CLASS DEFINTION*********************

var WS2 = new Station(2,'1');
var WS3 = new Station(3,'1');
var WS4 = new Station(4,'1');
var WS5 = new Station(5,'2');
var WS6 = new Station(6,'2');
var WS8 = new Station(8,'2');
var WS9 = new Station(9,'3');
var WS10 = new Station(10,'3')
var WS11 = new Station(11,'3')
var WS12 = new Station(12,'3')
WS2.start()
WS3.start()
WS4.start()
WS5.start()
WS6.start()
WS8.start()
WS9.start()
WS10.start()
WS11.start()
WS12.start()