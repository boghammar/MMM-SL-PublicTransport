# MMM-SL-PublicTransport
Magic Mirror module - Display public transport in Stockholm/Sweden. This module use the API's provided by [Trafiklab](https://www.trafiklab.se/api).

## Get API key
You need to obtain your own API key's from TrafikLab for the following API's

* [SL Realtidinformation 4](https://www.trafiklab.se/api/sl-realtidsinformation-4)
* [SL Platsuppslag](https://www.trafiklab.se/api/sl-platsuppslag)

## Install
1. Clone repository into ``../modules/`` inside your MagicMirror folder.
2. Run npm install inside ``../modules/MMM-HH-LocalTransport/`` folder
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
            stationid: 'your-station-id' // You need to run the utility findStation to get this
        }
    },
    ...
]
```

## Find stationid

## Screenshoot

