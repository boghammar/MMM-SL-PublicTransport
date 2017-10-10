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
        stationname: '',
        updateInterval: 5*60*1000,
        uiUpdateInterval: 1000,
        direction: '',
        lines: [],
        showdisturbances: false,
        fade: true,
        fadePoint: 0.2,
        displaycount: 10,
    },

    // --------------------------------------- Define required scripts
    getScripts: function() {
		return [
			//this.file('timehandler.js')
            'moment.js'
        ];
	},
    // --------------------------------------- Define required stylesheets
/*    getStyles: function() {
        return ["MMM-SL-PublicTransport.css", "font-awesome.css"];
    },
*/
    // --------------------------------------- Get header
    getHeader: function() {
        return this.data.header + " " + this.config.stationname + " " 
        + (this.loaded ? '(' + moment(this.currentDepartures.LatestUpdate).format('HH:mm') + ')' : "");
    },
    
    // --------------------------------------- Start the module
    start: function() {
        Log.info("Starting module: " + this.name);
        
        // Set locale.
		moment.locale(config.language);
        
        this.loaded = false;
        this.sendSocketNotification('CONFIG', this.config); // Send config to helper and initiate an update
        
        // Start timer for ui-updates
        var self = this;
        this.uitimer = setInterval(function() { // This timer is saved in uitimer so that we can cancel it
            self.updateDom();
        }, self.config.uiUpdateInterval);
    },

    // --------------------------------------- Generate dom for module
    getDom: function() {
        var wrapper = document.createElement("div");
        if (this.config.apikey === "" || this.config.apikey === 'PleaseProvideYourOwn') {
			wrapper.innerHTML = this.name +": Please set API key in config.js.";
			wrapper.className = "dimmed light small";
			return wrapper;
		} 
        if (!this.loaded) {
			wrapper.innerHTML = "Loading connections ...";
			wrapper.className = "dimmed light small";
			return wrapper;
		}
        // ------- Create departure table
        var table = document.createElement("table");
        table.className = "xsmall";

        // ------ Table header
        var row = document.createElement("tr");
        var th = document.createElement("th");
        th.innerHTML = "Line&nbsp;"
        th.className = 'align-left'; 
        row.appendChild(th);
        th = document.createElement("th");
        th.innerHTML = "Destination"
        th.className = 'align-left'; 
        row.appendChild(th);
        th = document.createElement("th");
        th.innerHTML = "Departure"
        row.appendChild(th);
        table.appendChild(row);

        // ------ Fill in departures
        this.cdir = -1;
        var displayCount = 0;
        for (var ix = 0; ix < this.currentDepartures.departures.length; ix++) {
            var dep = this.currentDepartures.departures[ix];
            if (this.isWantedDirection(dep.JourneyDirection)) {
                if (this.cdir != -1 && this.cdir != dep.JourneyDirection) { 
                    // We are changing direction, create an empty row to separate the two directions
                    this.cdir = dep.JourneyDirection;
                    var row = document.createElement("tr");
                    row.className = 'sup';
                    var td = document.createElement("td");
                    td.colSpan = 3;
                    td.innerHTML = '&nbsp;';
                    row.appendChild(td);
                    table.appendChild(row);
                    displayCount = 0; // Restart count of number of items to display for this new direction
                }
                displayCount++;
                if (displayCount <= this.config.displaycount) { // Only show displaycount entries
                    if (this.cdir == -1) this.cdir = dep.JourneyDirection;
                    var row = document.createElement("tr");
                    var td = document.createElement("td");
                    td.className = 'align-left'; 
                    td.innerHTML = dep.LineNumber;
                    row.appendChild(td);
                    td = document.createElement("td");
                    td.innerHTML = dep.Destination;
                    td.className = 'align-left'; 
                    row.appendChild(td);
                    td = this.getDepartureTime(dep.TimeTabledDateTime, dep.ExpectedDateTime);
                    row.appendChild(td);
                    table.appendChild(row);
                    this.setFade(row, /*ix*/displayCount, /*this.currentDepartures.departures.length*/this.config.displaycount , this.config.fade, this.config.fadePoint);
                }
            }
        }
        wrapper.appendChild(table);

        // ----- Show service failure if any
        if (this.failure !== undefined) {
            var div = document.createElement("div");
            div.innerHTML = "Service: "+this.failure.StatusCode + '-' + this.failure.Message;
            div.style.color = "red"; // TODO Change this to a custom style
            div.className = "xsmall";
            wrapper.appendChild(div);
        }

        return wrapper;
    },

    // --------------------------------------- Calculate departure time
    // Returns a HTML element that shall be added to the current row
    getDepartureTime: function(tableTime, expectedTime) {
        var td = document.createElement("td");
        if (tableTime == expectedTime) { // There's no delay
            td.innerHTML = this.timeRemaining(moment(tableTime));
        } else {
            td.innerHTML = this.timeRemaining(moment(expectedTime))+ ' ';
            var sp = document.createElement("span");
            sp.innerHTML = this.timeRemaining(moment(tableTime), true);
            sp.style.textDecoration = "line-through" // TODO Change this to a custom style
            td.appendChild(sp);
        }
        td.className = "align-right bright";
        return td;
    },

    // --------------------------------------- Get a human readable duration 
    // Dont like the moment.js humanize stuff, too lonmg in swedish and too crud.
    timeRemaining: function(tt, noPrefix) {
        var now = moment();
        var dur = tt.diff(now, 'seconds');

        if (dur < 0) return 'left';
        if (dur < 30) return 'now';
        if (30 <= dur && dur < 60) return (noPrefix ? '': 'in ') +' 1 min';
        if (60 <= dur && dur < 15*60) return (noPrefix ? '': 'in ') + Math.round(dur/60)+' min';

        return (noPrefix ? '': 'at ') + tt.format('HH:mm');
    },

    // --------------------------------------- Are we asking for this direction
    isWantedDirection: function(dir) {
        if (this.config.direction !== undefined && this.config.direction != '') {
            return dir == this.config.direction;
        }
        return true;
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
            this.failure = undefined;
            // Handle payload
            this.currentDepartures = payload;
            Log.info("Departures updated: "+ this.currentDepartures.departures.length);
            this.updateDom();
        }
        if (notification == "SERVICE_FAILURE") {
            this.failure = payload;
            Log.info("Service failure: "+ this.failure.StatusCode + ':' + this.failure.Message);
            this.updateDom();
        }
    }
})