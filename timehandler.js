
/* timehandler.js
 *
 * Handle parsing of time. Work with UTC times.
 * 
 * Magic Mirror
 * Module: MMM-SL-PublicTransport
 * 
 * Magic Mirror By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 * 
 * Module MMM-SL-PublicTransport By Anders Boghammar
 */

function TimeHandler() {
}

/*
 * Calculate the time left until the time time occurs. 
 * Return a string representation of the timeleft.
 * The argument time has to be a string in a format that Date.parse() understands and its
 * assumed that the string representation does not carry any timezone info.
 */
TimeHandler.prototype.TimeLeft = function(time) {
    var tt = this.getDate(time);
    var now = new Date(Date.now()-(tt.getTimezoneOffset()*60*1000));
    var diff = tt.valueOf()-now.valueOf();
    if ( diff <= 0) {
        return 'has left';
    } else {
        if (0 < diff && diff <= 30*1000) return '< 30 secs';
        if (30*1000 < diff && diff <= 60*1000) return 'in 1 min';
        if (60*1000 < diff && diff <= 15*60*1000) return 'in '+ Math.round(diff / (60*1000)) +' min';
    }
    return 'at ' + this.tpos(tt.getUTCHours()) + ':' + this.tpos(tt.getUTCMinutes());
}

/*
 * Get the hour and minute part of this time string.
 */
TimeHandler.prototype.getTime = function(time, includeseconds) {
    var tt = this.getDate(time);
    return tt.getUTCHours() + ":" + tt.getUTCMinutes()
        + (includeseconds !== undefined && includeseconds ? ':' + tt.getUTCSeconds(): '');    
}

/*
 * Get a date object from a string 
 */
TimeHandler.prototype.getDate = function(str) {
    return new Date(Date.parse(str));
}

TimeHandler.prototype.Test = function() {
    var tts = '2017-06-26T21:23:38';
    var tt = new Date(Date.parse(tts));
    this.print(tts, tt);

    var nns = 'now';
    var nn = new Date(Date.now()-(tt.getTimezoneOffset()*60*1000));
    this.print(nns, nn);

    var str = this.addTime(nn,  - 3*60*1000);
    console.log(this.TimeLeft(str))
    var str = this.addTime(nn,   20*1000);
    console.log(this.TimeLeft(str))
    var str = this.addTime(nn,   1*60*1000);
    console.log(this.TimeLeft(str))
    var str = this.addTime(nn,   2*60*1000);
    console.log(this.TimeLeft(str))
    var str = this.addTime(nn,   12*60*1000);
    console.log(this.TimeLeft(str))
    var str = this.addTime(nn,   16*60*1000);
    console.log(this.TimeLeft(str))

}

// ---------------------------------------------------- Utilities
/*
 * Add value number of milliseconds to the Date nn and return 
 * an ISO date string.
 */
TimeHandler.prototype.addTime = function(nn, value) {
    var tmp0 = new Date(0);
    tmp0.setUTCHours(nn.getUTCHours());
    tmp0.setUTCMinutes(nn.getUTCMinutes());
    tmp0.setUTCSeconds(nn.getUTCSeconds());
    var tmp = new Date(tmp0.valueOf() + value);
    var str = nn.getUTCFullYear()+'-'
        + this.tpos(nn.getUTCMonth()+1)+'-'
        + this.tpos(nn.getUTCDate())+'T'
        + this.tpos(tmp.getUTCHours())+':'
        + this.tpos(tmp.getUTCMinutes())+':'
        + this.tpos(tmp.getUTCSeconds());
    return str;
}
/* 
 * Format a number two a two digit string with leading zero.
 */
TimeHandler.prototype.tpos = function(val) {
    return (val < 9 ? '0'+val : val);
}

TimeHandler.prototype.print = function(tts, tt) {
    console.log(tt.toISOString() + ' ' + tt.valueOf() + ' ', tts)
}

//module.exports = TimeHandler;