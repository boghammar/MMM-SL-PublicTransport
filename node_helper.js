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
var debugMe = false;

module.exports = NodeHelper.create({

    // --------------------------------------- Start the helper
    start: function () {
        //Log.info('Starting helper: '+ this.name);
        log('Starting helper: ' + this.name);
        this.started = false;
    },

    // --------------------------------------- Schedule a departure update
    scheduleUpdate: function () {
        var self = this;
        debug('scheduleUpdate=' + self.getNextUpdateInterval());
        this.updatetimer = setInterval(function () { // This timer is saved in uitimer so that we can cancel it
            self.getDepartures();
        }, self.getNextUpdateInterval());
    },

    // --------------------------------------- Retrive departure info
    getDepartures: function () {
        var self = this;

        clearInterval(this.updatetimer); // Clear the timer so that we can set it again

        debug("stationid is array="+Array.isArray(this.config.stationid));
        var Proms = [];
        // Loop over all stations
        this.config.stationid.forEach(stationid => {
            var P = new Promise((resolve, reject) => {
                self.getDeparture(stationid, resolve, reject);
            });
            debug('Pushing promise for station ' + stationid);
            console.log(P);
            Proms.push(P);
        });

        Promise.all(Proms).then(CurrentDeparturesArray => {
            debug('all promises resolved '+CurrentDeparturesArray);
            self.sendSocketNotification('DEPARTURES', CurrentDeparturesArray); // Send departures to module
        }).catch(reason => {
            debug('One or more promises rejected '+reason);
            self.sendSocketNotification('SERVICE_FAILURE', reason);
        });

        self.scheduleUpdate(); // reinitiate the timer
    },

    // --------------------------------------- Get departures for one station
    // The CurrentDepartures object holds this data
    //  CurrentDepartures = {
    //      StationId: string
    //      LatestUpdate: date,     // When the realtime data was updated
    //      DataAge: ??,            // The age of the data in ??
    //      departures: [dir][deps] // An array of array of Departure objects
    //  }
    getDeparture: function(stationid, resolve, reject) {
        log('Getting departures for station id ' + stationid);
        var self = this;

        // http://api.sl.se/api2/realtimedeparturesV4.<FORMAT>?key=<DIN API NYCKEL>&siteid=<SITEID>&timewindow=<TIMEWINDOW>
        var transport = (this.config.SSL ? 'https' : 'http');
        var opt = {
            uri: transport + '://api.sl.se/api2/realtimedeparturesV4.json',
            qs: {
                key: this.config.apikey,
                siteid: stationid,
                timewindow: 60
            },
            json: true
        };
        if (this.config.proxy !== undefined) {
            opt.agent = new HttpsProxyAgent(Url.parse(this.config.proxy));
            debug('SL-PublicTransport: Using proxy ' + this.config.proxy);
        }
        debug('SL-PublicTransport: station id ' + stationid + ' Calling ' + opt.uri);
        console.log(opt);
        request(opt)
            .then(function (resp) {
                if (resp.StatusCode == 0) {
                    //console.log(resp);
                    var CurrentDepartures = {};
                    var departures = [];
                    CurrentDepartures.StationId = stationid;
                    CurrentDepartures.LatestUpdate = resp.ResponseData.LatestUpdate; // Anger när realtidsinformationen (DPS) senast uppdaterades.
                    CurrentDepartures.DataAge = resp.ResponseData.DataAge; //Antal sekunder sedan tidsstämpeln LatestUpdate.
                    CurrentDepartures.obtained = new Date(); //When we got it.
                    self.addDepartures(departures, resp.ResponseData.Metros);
                    self.addDepartures(departures, resp.ResponseData.Buses);
                    self.addDepartures(departures, resp.ResponseData.Trains);
                    self.addDepartures(departures, resp.ResponseData.Trams);
                    self.addDepartures(departures, resp.ResponseData.Ships);
                    //console.log(self.departures);

                    // Sort on ExpectedDateTime
                    for (var ix = 0; ix < departures.length; ix++) {
                        if (departures[ix] !== undefined) {
                            departures[ix].sort(dynamicSort('ExpectedDateTime'))
                        }
                    }
                    //console.log(departures);

                    // Add the sorted arrays into one array
                    var temp = []
                    for (var ix = 0; ix < departures.length; ix++) {
                        if (departures[ix] !== undefined) {
                            for (var iy = 0; iy < departures[ix].length; iy++) {
                                temp.push(departures[ix][iy]);
                            }
                        }
                    }
                    //console.log(temp);

                    // TODO:Handle resp.ResponseData.StopPointDeviations
                    CurrentDepartures.departures = temp; 
                    log('Found ' + CurrentDepartures.departures.length + ' DEPARTURES for station id=' + stationid);
                    resolve(CurrentDepartures);

                } else {
                    log('Something went wrong: station id=' + stationid + ' ' + resp.StatusCode + ': ' + resp.Message);
                    reject(resp);
                }
            })
            .catch(function (err) {
                log('Problems: station id=' + stationid + ' ' + err);
                reject( { resp: { StatusCode: 600, Message: err } });
            });
    },

    // --------------------------------------- Add departures to our departures array
    addDepartures: function (departures, depArray) {
        for (var ix = 0; ix < depArray.length; ix++) {
            var element = depArray[ix];
            var dep = new Departure(element);
            debug("BLine: " + dep.LineNumber);
            dep = this.fixJourneyDirection(dep);
            if (this.isWantedLine(dep.LineNumber)) {
                if (this.isWantedDirection(dep.JourneyDirection)) {
                    debug("BLine: " + dep.LineNumber + " Dir:" + dep.JourneyDirection + " Dst:" + dep.Destination);
                    debug("ALine: " + dep.LineNumber + " Dir:" + dep.JourneyDirection + " Dst:" + dep.Destination);
                    if (departures[dep.JourneyDirection] === undefined) {
                        departures[dep.JourneyDirection] = [];
                    }
                    departures[dep.JourneyDirection].push(dep);
                }
            }
        }
    },

    // --------------------------------------- Are we asking for this direction
    isWantedDirection: function (dir) {
        if (this.config.direction !== undefined && this.config.direction != '') {
            return dir == this.config.direction;
        }
        return true;
    },

    // --------------------------------------- If we want to change direction number on a line
    fixJourneyDirection: function (dep) {
        if (this.config.lines !== undefined && this.config.direction !== undefined) {
            if (this.config.lines.length > 0) {
                for (var ix = 0; ix < this.config.lines.length; ix++) {
                    if (dep.LineNumber == this.getLineNumber(ix)) {
                        // the line is mentioned in config lines, handle it
                        if (Array.isArray(this.config.lines[ix])) { //this.config.lines[ix]} !== null && typeof this.config.lines[ix] === 'array') {
                            if (dep.JourneyDirection == this.config.lines[ix][1]) {
                                debug("Changing Line: " + dep.LineNumber + " Dir:" + dep.JourneyDirection + " to " + this.config.direction);
                                dep.JourneyDirection = this.config.direction;
                            } else {
                                debug("Hiding Line: " + dep.LineNumber + " Dir:" + dep.JourneyDirection + " to " + this.config.direction);
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
    isWantedLine: function (line) {
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
    getLineNumber: function (ix) {
        var wasarray = false;
        var ll = this.config.lines[ix];
        if (Array.isArray(ll)) { //ll !== null && typeof ll === 'array') {
            ll = ll[0];
            wasarray = true;
        }
        //debug("IX: "+ ix + " LL:" + ll + " wasarray " + wasarray);                            
        return ll;
    },

    // --------------------------------------- Figure out the next update time
    getNextUpdateInterval: function() {
        if (this.config.highUpdateInterval === undefined) return this.config.updateInterval;
        // TODO: dont throw here use the normal update time but log the errors
        if (this.config.highUpdateInterval.times === undefined) {
            log("ERROR: highUpdateInterval.times is undefined in configuration.");
            log("ERROR: Please remove the highUpdateInterval parameter if you do not use it.");
            return this.config.updateInterval;
        }
        if (!Array.isArray(this.config.highUpdateInterval.times)) throw new Error("highUpdateInterval.times is not an array")
        
        //Check which interval we are in and return the proper timer
        for (var ix = 0 ; ix < this.config.highUpdateInterval.times.length; ix++) {
            var time = this.config.highUpdateInterval.times[ix];
            if (this.isBetween(time.days, time.start, time.stop)) return this.config.highUpdateInterval.updateInterval
        }
        return this.config.updateInterval;
    },
    
    // --------------------------------------- Check if now is in this time
    isBetween: function (days, start, stop) {
        var now = new Date();
        var dow = now.getDay();
        switch (days) {
            case 'weekdays':
                if (0 < dow && dow < 6) {
                    return this.isTimeBetween(start, stop);
                }
            break;
            case 'weekends':
                if (0 == dow || dow == 6) {
                    return this.isTimeBetween(start, stop);
                }
            break;
        }
        return false;
    },
    
    // --------------------------------------- Check if now is between these times
    isTimeBetween: function (start, stop) {
        var now = new Date();
        var st = dateObj(start);
        var en = dateObj(stop);
        if (st > en) {      // check if start comes before end
            var temp = st;  // if so, assume it's across midnight
            st = en;        // and swap the dates
            en = temp;
        }
        
        return now < en && now >st 
    },
        
    // --------------------------------------- Handle notifocations
    socketNotificationReceived: function (notification, payload) {
        const self = this;
        if (notification === 'CONFIG' /*&& this.started == false*/) {
            this.config = payload;
            this.started = true;
            debugMe = this.config.debug;
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
    if (property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return function (a, b) {
        var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    }
}

// --------------------------------------- Create a date object with the time in timeStr (hh:mm)
function dateObj(timeStr) {
    var parts = timeStr.split(':');
    var date  = new Date();
    date.setHours(+parts.shift());
    date.setMinutes(+parts.shift());
    return date;
}

// --------------------------------------- At beginning of log entries
function logStart() {
    return (new Date(Date.now())).toLocaleTimeString() + " MMM-SL-PublicTransport: ";
}

// --------------------------------------- Logging
function log(msg) {
    console.log(logStart() + msg);
}
// --------------------------------------- Debugging
function debug(msg) {
    if (debugMe) log(msg);
}
