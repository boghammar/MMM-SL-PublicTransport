# MMM-SL-PublicTransport
[Magic Mirror](https://magicmirror.builders/) Module - Display public transport in Stockholm/Sweden. This module use the API's provided by [Trafiklab](https://www.trafiklab.se/api).

## Get API key
You need to obtain your own API key's from TrafikLab for the following API's

* [SL Realtidinformation 4](https://www.trafiklab.se/api/sl-realtidsinformation-4)
* [SL Platsuppslag](https://www.trafiklab.se/api/sl-platsuppslag)

## Install
1. Clone repository into ``../modules/`` inside your MagicMirror folder.
2. Run ``npm install`` inside ``../modules/MMM-SL-PublicTransport/`` folder
3. Run ``node findStation.js apiKey stationName`` to find out your Station ID.
4. Add the module to the MagicMirror config

## Configuration
```
modules: [
    ...
    {
        module: 'MMM-SL-PublicTransport',
        position: 'top-right',
        header: 'Busses',
        config: {
            apikey: 'your-api-key',         // REQUIRED.
            stationid: 'your-station-id',   // REQUIRED. You need to run the utility findStation to get this
            stationname: 'name',            // This is the name of the station. 
                                            // It's shown in the header if you have set a header on the module
            direction: 1,                   // Optional, if set only show departures in that direction.
                                            // Direction is either 1 or 2, test to see which one you need.
            displaycount: 10,               // Optional, show this number of departures for each direction.
            lines: [],                      // Optional, only show the lines listed in the array.
            showdisturbances: false,        // Not implemented yet
            fade: true,                     // Shall the table of departures be faded or not
            fadePoint: 0.2,                 // Fraction from end where to start fading
            updateInterval: 5*60*100,       // Number of milliseconds between calls to Trafiklab's API
                                            // There are limitations on number of calls per minute and month
            uiUpdateInterval: 1000,         // Number of milliseconds between updates of the departure list 
        }
    },
    ...
]
```

## Find stationid
You need to set a stationid in the configuration and to find that run the following helper

```node findStation.js apikey searchstring```

where ``apikey`` is your API key for the SL Platsuppslag API and ``searchstring`` is the name of the station.

The output will look something like this (searching for 'Erikslund'). Use the SiteId value as the stationid:

```
{
    "StatusCode": 0,
    "Message": null,
    "ExecutionTime": 0,
    "ResponseData": [
        {
            "Name": "Erikslund (Täby)",
            "SiteId": "2322",
            "Type": "Station",
            "X": "18044128",
            "Y": "59464947"
        },
        {
            "Name": "Erikslundsvägen (Täby)",
            "SiteId": "2329",
            "Type": "Station",
            "X": "18054079",
            "Y": "59462808"
        },
        ...
```

## Screenshot

![SL PublicTransport Module](https://github.com/boghammar/MMM-SL-PublicTransport/blob/master/docs/ScreenShot1.PNG)

