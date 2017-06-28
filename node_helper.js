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
        console.log('Calling '+opt.uri);
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
                    // Sort on direction
                    self.departures.sort(dynamicSort('-JourneyDirection'));
                    // TODO:Handle resp.ResponseData.StopPointDeviations
                    CurrentDepartures.departures = self.departures;
                    console.log((new Date(Date.now())).toLocaleTimeString() + ": Sending DEPARTURES "+CurrentDepartures.departures.length);
                    self.sendSocketNotification('DEPARTURES', CurrentDepartures); // Send departures to module

                } else {
                    console.log("Something went wrong: " + resp.StatusCode + ': '+ resp.Message);
                }
            })
            .catch(function(err) {
                console.log('Problems: '+err);
            });
    },

    // --------------------------------------- Add departures to our departures array
    addDepartures: function (depArray) {
        for (var ix =0; ix < depArray.length; ix++) {
            var element = depArray[ix];
            var dep = new Departure(element);
            this.departures.push(dep);
        }
    },

    // --------------------------------------- Handle notifocations
    socketNotificationReceived: function(notification, payload) {
        const self = this;
        if (notification === 'CONFIG' && this.started == false) {
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