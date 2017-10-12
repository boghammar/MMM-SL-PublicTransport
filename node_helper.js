/* node_helper.js
 *
 * Magic Mirror module - Display public transport in Stockholm/Sweden. 
 * This module use the API's provided by Trafiklab.
 * 
 * Magic Mirror
 * Module: MMM-SL-PublicTransport
 * 
 * Magic Mirror By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 * 
 * Module MMM-SL-PublicTransport By Anders Boghammar
 */
const NodeHelper = require("node_helper");
const request = require("request-promise");
var HttpsProxyAgent = require('https-proxy-agent');
var Url = require('url');
var Departure = require('./departure.js');

module.exports = NodeHelper.create({

    // --------------------------------------- Start the helper
    start: function() {
        //Log.info('Starting helper: '+ this.name);
        console.log('Starting helper: '+ this.name);
        this.started = false;
    },

    // --------------------------------------- Schedule a departure update
    scheduleUpdate: function() {
        var self = this;
        this.updatetimer = setInterval(function() { // This timer is saved in uitimer so that we can cancel it
            self.getDepartures();
        }, self.config.updateInterval);
    },

    // --------------------------------------- Retrive departure info
    getDepartures: function() {
        var self = this;

        console.log((new Date(Date.now())).toLocaleTimeString() + ': Getting departures for station id ' + this.config.stationid);
        var opt = {
            uri: 'https://api.sl.se/api2/realtimedeparturesV4.json',
            qs : {
                key: self.config.apikey,
                siteid: self.config.stationid,
                timewindow: 60
            },
            json: true
        };
        if (this.config.proxy !== undefined) {
            opt.agent = new HttpsProxyAgent(Url.parse(this.config.proxy));
            console.log('SL-PublicTransport: Using proxy '+this.config.proxy);        
        }
        console.log('SL-PublicTransport: Calling '+opt.uri);
        request(opt)
            .then(function(resp) {
                if (resp.StatusCode == 0) {
                    //console.log(resp);
                    var CurrentDepartures = {};
                    self.departures = [];
                    CurrentDepartures.LatestUpdate = resp.ResponseData.LatestUpdate; // Anger när realtidsinformationen (DPS) senast uppdaterades.
                    CurrentDepartures.DataAge = resp.ResponseData.DataAge; //Antal sekunder sedan tidsstämpeln LatestUpdate.
                    self.addDepartures(resp.ResponseData.Metros);
                    self.addDepartures(resp.ResponseData.Buses);
                    self.addDepartures(resp.ResponseData.Trains);
                    self.addDepartures(resp.ResponseData.Trams);
                    self.addDepartures(resp.ResponseData.Ships);
                    //console.log(self.departures);

                    // Sort on ExpectedDateTime
                    for (var ix=0; ix < self.departures.length; ix++) {
                        if (self.departures[ix] !== undefined) {
                            self.departures[ix].sort(dynamicSort('ExpectedDateTime'))
                        }
                    }
                    //console.log(self.departures);

                    // Add the sorted arrays into one array
                    var temp = []
                    for (var ix=0; ix < self.departures.length; ix++) {
                        if (self.departures[ix] !== undefined) {
                            for (var iy=0; iy < self.departures[ix].length; iy++) {
                                temp.push(self.departures[ix][iy]);
                            }
                        }
                    }
                    //console.log(temp);
                    
                    // TODO:Handle resp.ResponseData.StopPointDeviations
                    CurrentDepartures.departures = temp; //self.departures;
                    console.log((new Date(Date.now())).toLocaleTimeString() + ": Sending DEPARTURES "+CurrentDepartures.departures.length);
                    self.sendSocketNotification('DEPARTURES', CurrentDepartures); // Send departures to module

                } else {
                    console.log("Something went wrong: " + resp.StatusCode + ': '+ resp.Message);
                    self.sendSocketNotification('SERVICE_FAILURE', resp); 
                }
            })
            .catch(function(err) {
                console.log('Problems: '+err);
                self.sendSocketNotification('SERVICE_FAILURE', {resp: {StatusCode: 600, Message: err}}); 
            });
    },

    // --------------------------------------- Add departures to our departures array
    addDepartures: function (depArray) {
        for (var ix =0; ix < depArray.length; ix++) {
            var element = depArray[ix];
            var dep = new Departure(element);
            console.log("BLine: "+ dep.LineNumber);
            dep = this.fixJourneyDirection(dep);
            if (this.isWantedLine(dep.LineNumber)) {
                if (this.isWantedDirection(dep.JourneyDirection)) {
                    console.log("BLine: "+ dep.LineNumber + " Dir:" + dep.JourneyDirection + " Dst:" + dep.Destination);
                    console.log("ALine: "+ dep.LineNumber + " Dir:" + dep.JourneyDirection + " Dst:" + dep.Destination);
                    if (this.departures[dep.JourneyDirection] === undefined) {
                        this.departures[dep.JourneyDirection] = [];
                    }
                    this.departures[dep.JourneyDirection].push(dep);
                }
            }
        }
    },
    
    // --------------------------------------- Are we asking for this direction
    isWantedDirection: function(dir) {
        if (this.config.direction !== undefined && this.config.direction != '') {
            return dir == this.config.direction;
        }
        return true;
    },
    
    // --------------------------------------- If we want to change direction number on a line
    fixJourneyDirection: function(dep) {
        if (this.config.lines !== undefined && this.config.direction !== undefined) {
            if (this.config.lines.length > 0) {
                for (var ix = 0; ix < this.config.lines.length; ix++) {
                    if (dep.LineNumber == this.getLineNumber(ix)) {
                        // the line is mentioned in config lines, handle it
                        if (Array.isArray(this.config.lines[ix])) { //this.config.lines[ix]} !== null && typeof this.config.lines[ix] === 'array') {
                            if (dep.JourneyDirection == this.config.lines[ix][1]) {
                                console.log("Changing Line: "+ dep.LineNumber + " Dir:" + dep.JourneyDirection + " to " + this.config.direction);                            
                                dep.JourneyDirection = this.config.direction;
                            } else {
                                console.log("Hiding Line: "+ dep.LineNumber + " Dir:" + dep.JourneyDirection + " to " + this.config.direction);                            
                                dep.JourneyDirection = 12; // Just some arbitrary number assuming a line can only have a direction 1 or 2
                            }
                        }
                    }
                }
            }
        }
        return dep; 
    },
    
    // --------------------------------------- Are we asking for this direction
    isWantedLine: function(line) {
        if (this.config.lines !== undefined) {
            if (this.config.lines.length > 0) {
                for (var ix = 0; ix < this.config.lines.length; ix++) {
                    // Handle objects in lines
                    if (line == this.getLineNumber(ix)) return true;
                }
            } else return true; // Its defined but does not contain anything = we want all lines
        } else return true; // Its undefined = we want all lines
        return false;
    },
    
    // --------------------------------------- Get the line number of a lines entry
    getLineNumber: function(ix) {
        var wasarray = false;
        var ll = this.config.lines[ix];
        if (Array.isArray(ll)) { //ll !== null && typeof ll === 'array') {
            ll = ll[0];
            wasarray = true;
        }
        //console.log("IX: "+ ix + " LL:" + ll + " wasarray " + wasarray);                            
        return ll;
    },
    
    // --------------------------------------- Handle notifocations
    socketNotificationReceived: function(notification, payload) {
        const self = this;
        if (notification === 'CONFIG' /*&& this.started == false*/) {
		    this.config = payload;	     
		    this.started = true;
		    self.scheduleUpdate();
            self.getDepartures(); // Get it first time
        };
    }
});

//
// Utilities
//
function dynamicSort(property) {
    var sortOrder = 1;
    if(property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return function (a,b) {
        var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    }
}