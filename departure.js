function Departure(data) {
    this.TransportMode = data.TransportMode;
    this.LineNumber = data.LineNumber;
    this.Destination = data.Destination;
    this.TimeTabledDateTime = data.TimeTabledDateTime;
    this.ExpectedDateTime = data.ExpectedDateTime;
    this.JourneyDirection = data.JourneyDirection;
    this.DisplayTime = data.DisplayTime;
}

Departure.prototype.ToString = function() {
    return this.TransportMode+ ' ' + this.LineNumber;
}

module.exports = Departure;