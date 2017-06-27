/* findStation.js
 *
 * This is a utility program used to find stationid.
 * 
 * Magic Mirror
 * Module: MMM-SL-PublicTransport
 * 
 * Magic Mirror By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 * 
 * Module MMM-SL-PublicTransport By Anders Boghammar
 */
var request = require('request-promise');
var apikey = process.argv[2];
var searchstring = process.argv[3];

function getStationId() {

    var opt = {
        uri: 'https://api.sl.se/api2/typeahead.json',
        qs : {
            key: apikey,
            searchstring: searchstring,
            stationsonly: true
        },
        json: true
    };

    request(opt)
        .then(function(resp) {
            if (resp.StatusCode == 0) {
                console.log(resp);
           } else {
                console.log("Something went wrong when getting location: " + resp.StatusCode + ': '+ resp.Message);
            }
        })
        .catch(function(err){
            console.error('Problems getting location: '+err);
        });
}

getStationId();