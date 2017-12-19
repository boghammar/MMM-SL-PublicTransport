# MMM-SL-PublicTransport
[Magic Mirror](https://magicmirror.builders/) Module - Display public transport in Stockholm/Sweden. This module use the API's provided by [Trafiklab](https://www.trafiklab.se/api).

## Get API key
You need to obtain your own API key's from TrafikLab for the following API's

* [SL Realtidinformation 4](https://www.trafiklab.se/api/sl-realtidsinformation-4)
* [SL Platsuppslag](https://www.trafiklab.se/api/sl-platsuppslag)

**Please note**: There's currently some issues at TrafikLab that causes this module to fail sometimes. I have reported the issue and they are working on it. Please follow the thread at [TrafikLab's supportsite]( https://kundo.se/org/trafiklabse/d/problem-med-realtidsinformation-4-och-https/#c2726378)

## Install
1. Clone repository into ``../modules/`` inside your MagicMirror folder.
2. Run ``npm install`` inside ``../modules/MMM-SL-PublicTransport/`` folder
3. Run ``node findStation.js apiKey stationName`` to find out your Station ID.
4. Add the module to the MagicMirror config

## Update
1. Run ``git pull`` inside ``../modules/MMM-SL-PublicTransport/`` folder.
2. Run ``npm install`` inside ``../modules/MMM-SL-PublicTransport/`` folder

## Configuration
```
modules: [
    ...
    {
        module: 'MMM-SL-PublicTransport',
        position: 'top_right',
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
                                            // This can be a simple array of strings like ['611', '312', '629'] or 
                                            // a combination of objects with linename and direction
                                            // like [['611', 1], '312', ['629', 2]]. 
                                            // This second variant can only be used when direction has a value
                                            // See the description on "in to town" functionality below.  
            showdisturbances: false,        // Not implemented yet
            fade: true,                     // Optional. Shall the table of departures be faded or not
            fadePoint: 0.2,                 // Optional. Fraction from end where to start fading
            delayThreshhold: 60,            // Optional. If a departure is delayed or in advance only
                                            // show this
                                            // if the delay/advance is greater than this number in
                                            // seconds.            
            updateInterval: 5*60*100,       // Optional. Number of milliseconds between calls to 
                                            // Trafiklab's API
                                            // There are limitations on number of calls per minute and month
            highUpdateInterval: {}          // Optional. If defined use higher frequences for updates, see 
                                            // "Set what times to update more frequently" below
            uiUpdateInterval: 1000,         // Optional. Number of milliseconds between updates of the
                                            // departure list 
            SSL: false,                     // Optional. Use https to access the TrafikLab services, 
                                            // defaults to false since I have experienced problems  
                                            // accessing this service over https. Have an ongoing  
                                            // discussion with TrafikLab
            debug: false,                   // Optional. Enable some extra output when debugging
        }
    },
    ...
]
```
## In to town

If you only want to see the departures "in to town" and your station has several lines that have different directions "in to town" you can configure the module like this
```
    ...
    lines: ['611', ['312', 2], ['629',2]],   // Show 312 and 629 in direction 2. 
    direction: 1,
    ...
```
This will show line 611 in direction 1 intermixed with line 629 in direction 2 intermixed with line 312 in direction 2 like this
```
Line Destination Departure
611  Town        in 1 min
629  Town        in 2 min
611  Town        in 11 min
312  Somewhere   in 12 min 
```
The feature has some limitations. It changes internally the direction number for the lines that are represented as ['line#', dir] so that dir for that line will get the value of direction. It will only show departures that go in 'direction' or in the direction described by the ['line#', dir] format. Hence there will only be one list.

## Set what times to update more frequently
If you want the module to update departure times more frequently between certain hours use the ``highUpdateInterval`` config parameter.

This parameter is used like this:

```
    ...
    highUpdateInterval: {
        updateInterval: 5*60*1000, 
        times: [
            {days: 'weekdays', start: 07:00, stop: 09:00},
            {days: 'weekends', start: 16:00, stop: 18:00}
        ]
    }
    ...
```
where
* ``updateInterval`` is the frequency to use during the high update periods
* ``days`` is one of 
  * ``'weekdays'`` meaning Monday to Friday
  * ``'weekends'`` meaning Saturday and Sunday
* ``start`` is time of day when the high update should start in hh:mm format
* ``stop`` is time of day when the high update should stop in hh:mm format

## Find stationid
You need to set a stationid in the configuration and to find that run the following helper

```node findStation.js apikey searchstring```

where ``apikey`` is your API key for the SL Platsuppslag API and ``searchstring`` is the name of the station.

__NOTE__: This API key is not the same as the API key for SL Realtidinformation 4 API that you hace to enter in the module configuration.

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

