# MMM-SL-PublicTransport
Magic Mirror module - Display public transport in Stockholm/Sweden. This module use the API's provided by [Trafiklab](https://www.trafiklab.se/api).

## Get API key
You need to obtain your own API key's from TrafikLab for the following API's

* [SL Realtidinformation 4](https://www.trafiklab.se/api/sl-realtidsinformation-4)
* [SL Platsuppslag](https://www.trafiklab.se/api/sl-platsuppslag)

## Install
1. Clone repository into ``../modules/`` inside your MagicMirror folder.
2. Run ``npm install`` inside ``../modules/MMM-HH-LocalTransport/`` folder
3. Run ``node findStation.js apiKey apiUser stationName`` to find out your Station ID.
4. Add the module to the MagicMirror config

## Configuration
```
modules: [
    ...
    {
        module: 'MMM-SL-PublicTransport',
        position: 'top-right'
        config: {
            apikey: 'your-api-key',
            stationid: 'your-station-id',   // You need to run the utility findStation to get this
            direction: 1,                   // Optional, if set only show departures in that direction
            lines: [],                      // Optional, only show the lines listed in the array
            showdisturbances: false,        // Not implemented yet
            animationSpeed: 2000,
            fade: true,
            fadePoint: 0.25,
        }
    },
    ...
]
```

## Find stationid
You need to set a stationid in the configuration and to find that run the following helper

```node findStation.js apikey searchstring```

where ``apikey`` is your API key for the SL Platsuppslag API and ``searchstring`` is the name of the station.

The output will look something like this (searching for 'Erikslund'):

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

## Screenshoot

__TBD__
