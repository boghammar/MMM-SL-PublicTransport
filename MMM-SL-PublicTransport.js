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
        stationid: [],
        stationname: [],
        updateInterval: 5 * 60 * 1000,
        uiUpdateInterval: 1000,
        delayThreshhold: 60,
        direction: '',
        lines: [],
        showdisturbances: false,
        fade: true,
        fadePoint: 0.2,
        displaycount: 10,
        SSL: false,
        ignoreSanityCheck: false,
        useDisplayTime: false,
        cleanHeader: false,
        showIcon: true,
    },

    // --------------------------------------- Define required scripts
    getScripts: function () {
        return [
            //this.file('timehandler.js')
            'moment.js'
        ];
    },
    // --------------------------------------- Define required stylesheets
    getStyles: function() {
            return ["MMM-SL-PublicTransport.css", "font-awesome.css"];
        },
    // --------------------------------------- Get header
    getHeader: function () {
        if (this.currentDepartures !== undefined) {
             var stationname = this.currentDepartures[0].StationName; //config.stationname[0] + " ";
            if (this.currentDepartures.length > 1) { //config.stationname.length > 1) {
                stationname = "";
            }
        }

        if (this.currentDepartures !== undefined && this.currentDepartures.length > 0) {
            var format = (this.config.debug ? 'HH:mm:ss' : 'HH:mm');
            return this.data.header + " " + stationname + " "
                + (this.loaded && !this.config.cleanHeader ? '(' 
                    + moment(this.currentDepartures[0].LatestUpdate).format(format) + ')'
                    + (this.config.debug ? '/('+moment(this.currentDepartures[0].obtained).format(format)+')' : '') 
                    : ""
                );
        } else {
            return this.data.header + " " + stationname ;
        }
    },

    // --------------------------------------- Start the module
    start: function () {
        Log.info("Starting module: " + this.name);
        // Fix config so that its backward compatible
        if (!Array.isArray(this.config.stationid)) {
            this.config.stationid = [this.config.stationid];
        }
        if (!Array.isArray(this.config.stationname)) {
            this.config.stationname = [this.config.stationname];
        }
        // Sanity check config
        if (!this.config.ignoreSanityCheck) {
            var msg = "";
            if (this.config.updateInterval < 1*60*1000) {
                msg = msg + "\rupdateInterval too low, set to 1min";
                this.config.updateInterval = 1*60*1000;
            }
            if (this.config.uiUpdateInterval > 10*1000) {
                msg = msg + "\ruiUpdateInterval too high, set to 10s";
                this.config.uiUpdateInterval = 10*1000;
            }
            if (this.config.updateInterval < this.config.uiUpdateInterval) {
                msg = msg + "\rupdateInterval lower then uiUpdate, set to uiUpdateInterval";
                this.config.updateInterval = this.config.uiUpdateInterval;
            }
            if (this.config.stations === undefined) {
                msg = msg + "\rAs of version 1.5 a new station definition"
                msg = msg + "\rhas been implemented. Please review the"
                msg = msg + "\rconfiguration documentation and update"
                msg = msg + "\ryour config as appropriate."
            }
            if (msg.length > 0) this.config.sanityCheck = msg;
        }

        // Set locale.
        moment.locale(config.language);

        this.loaded = false;
        this.sendSocketNotification('CONFIG', this.config); // Send config to helper and initiate an update

        // Start timer for ui-updates
        var self = this;
        this.uitimer = setInterval(function () { // This timer is saved in uitimer so that we can cancel it
            self.updateDom();
        }, self.config.uiUpdateInterval);
    },

    // --------------------------------------- Generate dom for module
    getDom: function () {
        var wrapper = document.createElement("div");
        if (this.config.apikey === "" || this.config.apikey === 'PleaseProvideYourOwn') {
            wrapper.innerHTML = this.name + ": Please set API key in config.js.";
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

        if (this.currentDepartures !== undefined) {
            for (var is = 0; is < this.currentDepartures.length; is++) {
                if (is > 0) { // Create empty row
                    var row = document.createElement("tr");
                    var th = document.createElement("th");                        
                    th.innerHTML = "&nbsp;"
                    row.appendChild(th);
                    table.appendChild(row);
                }
                if (this.currentDepartures.length > 1) {
                    var row = document.createElement("tr");
                    var th = document.createElement("th");                        
                    th.innerHTML = this.currentDepartures[is].StationName; //this.config.stationname[is];
                    th.className = 'align-left';
                    row.appendChild(th);
                    table.appendChild(row);
                }
                // ------ Table header
                var row = document.createElement("tr");
                var th = document.createElement("th");
                th.innerHTML = "Line&nbsp;"
                th.className = 'align-left';
                th.colSpan = (this.config.showIcon ? 2 : 1);
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
                for (var ix = 0; ix < this.currentDepartures[is].departures.length; ix++) {
                    var dep = this.currentDepartures[is].departures[ix];
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
                        
                        var td = undefined;

                        if (this.config.showIcon) {
                            td = document.createElement("td");
                            td.className = 'align-left '+ this.getRideIcon(dep);
                            td.innerHTML = '&nbsp';
                            row.appendChild(td);
                        }

                        var td = document.createElement("td");
                        td.className = 'align-left';
                        td.innerHTML = dep.LineNumber;
                        row.appendChild(td);
                        td = document.createElement("td");
                        td.innerHTML = dep.Destination;
                        td.className = 'align-left';
                        row.appendChild(td);
                        td = this.getDepartureTime(dep.TimeTabledDateTime, dep.ExpectedDateTime, dep.DisplayTime);
                        row.appendChild(td);
                        table.appendChild(row);
                        this.setFade(row, /*ix*/displayCount, /*this.currentDepartures.departures.length*/this.config.displaycount, this.config.fade, this.config.fadePoint);
                    }
                }
            }
        }
        wrapper.appendChild(table);

        // ----- Show service failure if any
        if (this.failure !== undefined) {
            var div = document.createElement("div");
            // TODO This logic needs to be looked over, does not work 100%
            var msg = (this.failure.Message !== undefined ? this.failure.Message 
                : (this.failure.resp.Message.Message !== undefined ? this.failure.resp.Message 
                    : this.failure.resp.Message.message ));
            var status = (this.failure.Message !== undefined ? this.failure.StatusCode 
                : (this.failure.resp.Message.Message !== undefined ? this.failure.resp.StatusCode 
                    : this.failure.resp.Message.StatusCode ));
            div.innerHTML = moment(new Date()).format('HH:mm') +" Service: " + status + '-' + msg;
            div.style.color = "red"; // TODO Change this to a custom style
            div.className = "xsmall";
            wrapper.appendChild(div);
        }

        // ----- Show other problems
        if (this.config.sanityCheck !== undefined) {
            var div = document.createElement("div");
            var msg = this.config.sanityCheck.replace(/\r/g, '<br />');
            div.innerHTML = " Sanity check failed. Correct configuration: " + msg;
            div.style.color = "red"; // TODO Change this to a custom style
            div.className = "xsmall";
            wrapper.appendChild(div);
        }

        return wrapper;
    },

    // --------------------------------------- Find the icon for this type of ride
    // Returns a HTML element that shall be added to the current row
    getRideIcon: function (dep) {
        switch (dep.TransportMode) {
            case 'BUS': return 'fa fa-bus';
            case 'TRAIN': return 'fa fa-train';
            case 'METRO': return 'fa fa-subway';
            case 'SHIP': return 'fa fa-ship';
            case 'TRAM': return 'fa fa-train';
        }
        return '';
    },

    // --------------------------------------- Calculate departure time
    // Returns a HTML element that shall be added to the current row
    getDepartureTime: function (tableTime, expectedTime, displayTime) {
        var td = document.createElement("td");

        if (!this.config.useDisplayTime && ( tableTime != null && expectedTime != null)) {
            tt = moment(tableTime);
            et = moment(expectedTime);
            var dur = tt.diff(et, 'seconds');
            //Log.info("TT="+tt + "ET="+et + " Dur=" + dur);
            if (dur < this.config.delayThreshhold && dur > -this.config.delayThreshhold) { // (tableTime == expectedTime) { // There's no delay
                td.innerHTML = this.timeRemaining(tt) + (this.config.debug ? " " + dur : "");
            } else {
                td.innerHTML = this.timeRemaining(moment(expectedTime)) + ' ';
                var sp = document.createElement("span");
                sp.innerHTML = this.timeRemaining(tt, true) + (this.config.debug ? " " + dur : "");
                sp.style.textDecoration = "line-through" // TODO Change this to a custom style
                td.appendChild(sp);
            }
        } else { //Use Displaytime instead
            // TODO Calculate the actual displaytime depending on when the API answer was received.
            td.innerHTML = displayTime+".";
        }
        
        td.className = "align-right bright";
        return td;
    },

    // --------------------------------------- Get a human readable duration 
    // Dont like the moment.js humanize stuff, too lonmg in swedish and too crud.
    timeRemaining: function (tt, noPrefix) {
        var now = moment();
        var dur = tt.diff(now, 'seconds');

        if (dur < 0) return 'left';
        if (dur < 30) return 'now';
        if (30 <= dur && dur < 60) return (noPrefix ? '' : 'in ') + ' 1 min';
        if (60 <= dur && dur < 15 * 60) return (noPrefix ? '' : 'in ') + Math.round(dur / 60) + ' min';

        return (noPrefix ? '' : 'at ') + tt.format('HH:mm');
    },

    // --------------------------------------- Are we asking for this direction
    isWantedDirection: function (dir) {
        if (this.config.direction !== undefined && this.config.direction != '') {
            return dir == this.config.direction;
        }
        return true;
    },

    // --------------------------------------- Handle table fading
    setFade: function (row, ix, len, fade, fadePoint) {
        len = len + 1; // If we dont do this the last line will have opacity 0
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
    socketNotificationReceived: function (notification, payload) {
        if (notification === "DEPARTURES") {
            this.loaded = true;
            this.failure = undefined;
            // Handle payload
            this.currentDepartures = payload;
            if (this.currentDepartures.length> 0) Log.info("Departures updated: " + this.currentDepartures[0].departures.length);
            this.currentDepartures.obtained = new Date();
            this.updateDom();
        }
        if (notification == "SERVICE_FAILURE") {
            this.loaded = true;
            this.failure = payload;
            Log.info("Service failure: " + this.failure.resp.StatusCode + ':' + this.failure.resp.Message);
            this.updateDom();
        }
    }
})