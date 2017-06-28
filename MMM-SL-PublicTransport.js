/* MMM-SL-PublicTransport.js
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
 * 
 * Notifications:
 *      GET_DEPARTURES: Is sent when the module wants to get an updated departures list
 *      DEPARTURES: Is sent when there is an updated departures list
 */

Module.register("MMM-SL-PublicTransport", {

    // --------------------------------------- Define module defaults
    defaults: {
        apikey: 'PleaseProvideYourOwn',
        stationid: '',
        updateInterval: 5*60*1000,
        uiUpdateInterval: 1000,
        direction: '',
        lines: [],
        showdisturbances: false,
        animationSpeed: 2000,
        fade: true,
        fadePoint: 0.25,
    },

    // --------------------------------------- Define required stylesheets
/*    getStyles: function() {
        return ["MMM-SL-PublicTransport.css", "font-awesome.css"];
    },
*/
    // --------------------------------------- Get header
    getHeader: function() {
        return this.data.header + " " + this.config.stationname + " " 
        + (this.loaded ? this.currentDepartures.LatestUpdate : "");
    },
    // --------------------------------------- Start the module
    start: function() {
        Log.info("Starting module: " + this.name);
        console.log("++++++++ Starting module: " + this.name);
        this.loaded = false;
        this.sendSocketNotification('CONFIG', this.config); // Send config to helper and initiate an update
        
        // Start timer for ui-updates
        var self = this;
        this.uitimer = setInterval(function() { // This timer is saved in uitimer so that we can cancel it
            self.updateDom(self.config.animationSpeed);
        }, self.config.uiUpdateInterval);
    },

    // --------------------------------------- Generate dom for module
    getDom: function() {
        var wrapper = document.createElement("div");
        if (this.config.apikey === "" || this.config.apikey === 'PleaseProvideYourOwn') {
			wrapper.innerHTML = "Please set API key: " + this.name + ".";
			wrapper.className = "dimmed light small";
			return wrapper;
		} 
        if (!this.loaded) {
			wrapper.innerHTML = "Loading connections ...";
			wrapper.className = "dimmed light small";
			return wrapper;
		}
        // TODO fill it!
        var table = document.createElement("table");
        table.className = "small";

        // ------ Table header
        var row = document.createElement("tr");
        var th = document.createElement("th");
        th.innerHTML = "Line"
        row.appendChild(th);
        th = document.createElement("th");
        th.innerHTML = "Destination"
        row.appendChild(th);
        th = document.createElement("th");
        th.innerHTML = "Departure"
        row.appendChild(th);
        table.appendChild(row);

        // ------ Fill in departures
        for (var ix = 0; ix < this.currentDepartures.departures.length; ix++) {
            var dep = this.currentDepartures.departures[ix];
            var row = document.createElement("tr");
            var td = document.createElement("td");
            td.innerHTML = dep.LineNumber;
            row.appendChild(td);
            td = document.createElement("td");
            td.innerHTML = dep.Destination;
            row.appendChild(td);
            td = document.createElement("td");
            td.innerHTML = dep.DisplayTime; // TODO - fix time according to now
            td.className = "align-right bright";
            row.appendChild(td);
            table.appendChild(row);
            this.setFade(row, ix, this.currentDepartures.departures.length, this.config.fade, this.config.fadePoint);
        }

        wrapper.appendChild(table);
        return wrapper;
    },

    // --------------------------------------- Handle table fading
    setFade: function(row, ix, len, fade, fadePoint) {
        if (fade && fadePoint < 1) {
				if (fadePoint < 0) {
					fadePoint = 0;
				}
				var startingPoint = len * fadePoint;
				var steps = len - startingPoint;
				if (ix >= startingPoint) {
					var currentStep = ix - startingPoint;
					row.style.opacity = 1 - (1 / steps * currentStep);
				}
			}
    },
    // --------------------------------------- Handle socketnotifications
    socketNotificationReceived: function(notification, payload) {
        if (notification === "DEPARTURES") {
            this.loaded = true;
            // TODO handle payload
            this.currentDepartures = payload;
            Log.info("Departures updated: "+ this.currentDepartures.departures.length);
            this.updateDom(this.config.animationSpeed);
        }
    }
})