# MMM-SL-PublicTransport
[Magic Mirror](https://magicmirror.builders/) Module - Display public transport in Stockholm/Sweden. This module use the API's provided by [Trafiklab](https://www.trafiklab.se/api).

## Get API key
You need to obtain your own API key's from TrafikLab for the following API's

* [SL Realtidinformation 4](https://www.trafiklab.se/api/sl-realtidsinformation-4)
* [SL Platsuppslag](https://www.trafiklab.se/api/sl-platsuppslag)

~~**Please note**: There's currently some issues at TrafikLab that causes this module to fail sometimes. I have reported the issue and they are working on it. Please follow the thread at [TrafikLab's supportsite]( https://kundo.se/org/trafiklabse/d/problem-med-realtidsinformation-4-och-https/#c2726378)~~

## Install
1. Clone repository into ``../modules/`` inside your MagicMirror folder.
2. Run ``npm install`` inside ``../modules/MMM-SL-PublicTransport/`` folder
3. Run ``node findStation.js apiKey stationName`` to find out your Station ID.
4. Add the module to the MagicMirror config

## Update
1. Run ``git pull`` inside ``../modules/MMM-SL-PublicTransport/`` folder.
2. Run ``npm install`` inside ``../modules/MMM-SL-PublicTransport/`` folder

## Configuration
**Note**: This is a major change of the configuration. Please read through carefully and update your configration appropriately. All features present in earlier releases are available but you need to redefine your configuration. The new configuration ``stations`` will allow you to define in more detail what you want to see. For examples see the section [How to use the stations parameter](#how-to-use-the-stations-parameter) below.

```
modules: [
    ...
    {
        module: 'MMM-SL-PublicTransport',
        position: 'top_right',
        header: 'Busses',
        config: {
            apikey: 'your-api-key',         // REQUIRED.
            stations: [                     // REQUIRED at least one entry. 
                                            // Definition of the stations that you would like to see
              {
                stationId: station-id,      // REQUIRED. An id of a station. You need to run the utility
                                            // findStation to get the id(s) of the station(s) you want.
                stationName: 'station-name',// Optional. This is the name of the station.
                                            // It's shown in the header if you have set a header on the module
                lines: [                    // Optional. An array of lines that you want to see departing from
                                            // this station.
                  line: line-id,            // The id of the line
                  direction: dir,           // Optional. If present only show departures in this direction 
                                            // for this line.
                  swapDir: [olddir, newdir] // Optional. If present, if direction is olddir change this to
                                            // newdir. Shall be used with the "In to town" feature. Note that
                                            // if direction is defined, that shall be newdir.
                ]
              },
            ]
            displaycount: 10,               // Optional, show this number of departures for each direction.
            showdisturbances: false,        // Not implemented yet
            fade: true,                     // Optional. Shall the table of departures be faded or not
            fadePoint: 0.2,                 // Optional. Fraction from end where to start fading
            delayThreshhold: 60,            // Optional. If a departure is delayed or in advance only
                                            // show this
                                            // if the delay/advance is greater than this number in
                                            // seconds.            
            updateInterval: 5*60*1000,      // Optional. Number of milliseconds between calls to
                                            // Trafiklab's API. This value shall preferably be larger then 1 min
                                            // There are limitations on number of calls per minute and month
            highUpdateInterval: {},         // Optional if you dont need it don't define it.
                                            // If defined use higher frequences for updates, see
                                            // "Set what times to update more frequently" below
            uiUpdateInterval: 1000,         // Optional. Number of milliseconds between updates of the
                                            // departure list. This value shall preferably be less then 10 sec
            SSL: false,                     // Optional. Use https to access the TrafikLab services,
                                            // defaults to false since I have experienced problems  
                                            // accessing this service over https. Have an ongoing  
                                            // discussion with TrafikLab
            debug: false,                   // Optional. Enable some extra output when debugging
            ignoreSanityCheck: false,       // Optional. If set to true config sanity checks are not done.
            useDisplayTime: false,          // Optional. If true use the actual displaytime that is
                                            // received via the API instead of the ExpectedDateTime and
                                            // TimeTabledDateTime. See the DisplayTime section below.
            cleanHeader: false,             // If set to true the last update time is not shown
                                            // in the header

        }
    },
    ...
]
```
By default the following sanity checks are done on the configuration. The sanity checks can be ignored with the ``ignoreSanityCheck`` parameter.

* ``updateInterval`` shall be larger or equal to 1 min (1\*60\*1000 milliseconds)
* ``uiUpdateInterval`` shall be smaller or equal to 10 sec (10\*1000 milliseconds)
## How to use the stations parameter
With the ``stations`` configuration parameter you are able to in detail define what you want to see. The basic configuration is that if an optional parameter is not present everything will be shown, i.e. if the ``lines`` parameter is not present for a station all lines will be displayed. However, if it is present you will need to define all lines that you want to see.

### Examples
Show all departures from one station:
```
    ...
    stations: [
        {
            stationId: 2322,
            stationName: 'Erikslund'
        }
    ]
    ...
```

Show all departures from two station:
```
    ...
    stations: [
        {
            stationId: 2322,
            stationName: 'Erikslund'
        },
        {
            stationId: 2321,
            stationName: 'Täbyvägen'
        }
    ]
    ...
```

Show all departures from one station and only line 610 from the other station:
```
    ...
    stations: [
        {
            stationId: 2322,
            stationName: 'Erikslund'
        },
        {
            stationId: 2321,
            stationName: 'Täbyvägen',
            lines: {
                line: 610
            }
        }
    ]
    ...
```

Show all departures from one station and only line 610 from the other station in one direction:
```
    ...
    stations: [
        {
            stationId: 2322,
            stationName: 'Erikslund'
        },
        {
            stationId: 2321,
            stationName: 'Täbyvägen',
            lines: {
                line: 610,
                direction: 1
            }
        }
    ]
    ...
```


## In to town **OBSOLETE see new linefiltering**

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
The feature has some limitations. It changes internally the direction number for the lines that are represented as ['line#', dir] so that dir for that line will get the value of ``direction``. It will only show departures that go in ``direction`` or in the direction described by the ['line#', dir] format. Hence there will only be one list.

## Set what times to update more frequently
If you want the module to update departure
 times more frequently between certain hours use the ``highUpdateInterval`` config parameter. This is a feature that will preserve API calls to the TrafikLab API's.

This parameter is used like this:

```
    ...
    updateInterval: 5*60*1000,
    highUpdateInterval: {
        updateInterval: 1*60*1000,
        times: [
            {days: 'weekdays', start: '07:00', stop: '09:00'},
            {days: 'weekends', start: '16:00', stop: '18:00'}
        ]
    },
    ...
```
where
* ``updateInterval`` is the frequency to use during the high update periods
* ``times`` is an array of time ranges defined by
  * ``days`` is one of
    * ``'weekdays'`` meaning Monday to Friday
    * ``'weekends'`` meaning Saturday and Sunday
  * ``start`` is time of day when the high update should start in hh:mm format
  * ``stop`` is time of day when the high update should stop in hh:mm format

In the example above the module will update the departures every 5th minute but between 7 and 9 weekdays and 16 and 18 on weekends the update will be done every minute. You can have as many entries in the times array as you want.

## Having multiple stations OBSOLETE rewrite
By adding more then one ``stationid`` in the stationid array you can monitor several stations. If you have multiple stations the ``stationname`` array also need to hold the same number of stationnames.

Example of such config is:
```
    ...
    stationid: [2322, 2326],
    stationname: ['Erikslund', 'Anbudsvägen'],        
    ...
```
Please note that having multiple stations will increase the number of API calls made since there's one call per station. You can mitigate this by carefully setting the ``updateInterval`` and ``highUpdateInterval`` configuration parameters.

Also, having multiple stations will increase the space that this module takes on screen so use the ``displaycount`` parameter to limit the number of departures shown.

## Use DisplayTime
The Trafiklab API will return a number of different departure times, TimeTabledDateTime, ExpectedDateTime and DisplayTime. Originally this module used the two first to calculate the departure time and display it. However, it has turned out that for some metro lines these are null (do not have a value) due to some infrastructure changes going on.

When that was discovered the ``useDisplayTime`` configuration parameter was introduced. It is false per default but if it's true the DisplayTime value is presented instead of the calculated departure time based on TimeTabledDateTime and ExpectedDateTime.

Also, if the TimeTabledDateTime and ExpectedDateTime do not have a value (are null) the DisplayTime is used instead. The following screenshot shows how it looks when having ``useDisplayTime`` set to false and have a station that returns null for TimeTabledDateTime and ExpectedDateTime.

![SL PublicTransport Module](https://github.com/boghammar/MMM-SL-PublicTransport/blob/master/docs/useDisplayTime.PNG)

You see that the station Midsommarkransen uses DisplayTime (it's a dot '.' at the end) but the station Erikslund uses the calculated departure time from TimeTabledDateTime and ExpectedDateTime.

Note that if DisplayTime is used there is (currently) no update of that value between ``uiUpdateInterval``. So if there is a big difference between ``uiUpdateInterval`` and ``updateInterval`` there will be a discrepancy. This will be handled in future releases.


## Find stationid
You need to set a stationid in the configuration and to find that run the following helper

```node findStation.js apikey searchstring```

where ``apikey`` is your API key for the SL Platsuppslag API and ``searchstring`` is the name of the station.

__NOTE__: This API key is not the same as the API key for "SL Realtidinformation 4" API that you have to enter in the module configuration.

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

![SL PublicTransport Module](https://github.com/boghammar/MMM-SL-PublicTransport/blob/master/docs/MMMScreenshot2.PNG)
