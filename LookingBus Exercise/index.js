
let KEY_511 = '511.org API KEY';
let KEY_MAPS = 'Google Maps API Key';
let url = 'https://api.511.org/transit';

var liveVehicles = []

// Display All routes
axios.get(url+'/lines?api_key='+KEY_511+'&operator_id=SC') // BUS ROUTES
    .then(function (response) {
        console.log("SC VTA BUS LINES");
        var tabledata = []
        for(let i=0 ; i < response.data.length; i++){
            var id = response.data[i].Id
            var name = response.data[i].Name
            var monitored = response.data[i].Monitored
    
            var obj = {busid: id, busname: name, buslive:monitored}
            tabledata.push(obj)
        }

        //create Tabulator on DOM element with id "example-table"
    var table = new Tabulator("#Routes", {
        height:205, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
        data:tabledata, //assign data to table
        layout:"fitColumns", //fit columns to width of table (optional)
        columns:[ //Define Table Columns
            {title:"Line ID", field:"busid", width:150},
            {title:"Line Name", field:"busname"},
            {title:"Currently Running", field:"buslive"}
        ],
        rowClick:function(e, row){ 
            getLiveVehicles(row.getData().busref)
            
        },
    });
       
    })
    .catch(function (error) {
        console.log(error)
    })


// Display All Live Routes, Click to display live bus on map 
axios.get(url+'/VehicleMonitoring?api_key='+KEY_511+'&agency=SC') 
.then(response => {
    var tabledata = []
    var data = response.data.Siri.ServiceDelivery.VehicleMonitoringDelivery.VehicleActivity 
    console.log("data:", data)
    for(let i=0 ; i < data.length; i++){
        if(data[i].MonitoredVehicleJourney.LineRef != null){
            let entry =data[i].MonitoredVehicleJourney
            console.log(data[i])
            var destination = entry.DestinationName
            var direction = entry.DirectionRef
            var occupancy = entry.Occupancy 
            var origin = entry.OriginName
            var publishedname = entry.PublishedLineName
            var long = parseFloat(entry.VehicleLocation.Longitude)
            var lat = parseFloat(entry.VehicleLocation.Latitude)
            var vehicle = entry.VehicleRef
            var line = entry.LineRef
            var nextStopRef = 'unavailable'
            var nextStopName = 'unavailable'
            var expectedArrival = 'unavailable'
            if(typeof (entry.OnwardCalls) != 'undefined'){
                if(entry.OnwardCalls.OnwardCall.length > 0){
                    nextStopRef = entry.OnwardCalls.OnwardCall[0].StopPointRef 
                    nextStopName = entry.OnwardCalls.OnwardCall[0].StopPointName 
                    expectedArrival = entry.OnwardCalls.OnwardCall[0].ExpectedArrivalTime 
                }
            }

            var obj = {
                vehicleRef:vehicle,
                busname: publishedname,
                nextStopRef: nextStopRef,
                nextStop: nextStopName,
                expArrival: expectedArrival
            };
            tabledata.push(obj)
        }
    }

    //create Tabulator on DOM element with id "example-table"
    var table = new Tabulator("#Live", {
        height:205, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
        data:tabledata, //assign data to table
        layout:"fitColumns", //fit columns to width of table (optional)
        columns:[ //Define Table Columns
            {title:"Vehicle Ref", field:"vehicleRef", width:150},
            {title:"Line Name", field:"busname"},
            {title:"Next Stop Ref", field:"nextStopRef"},
            {title:"Next Stop", field:"nextStop"},
            {title:"Expected Arrival", field:"expArrival"}
        ],
        rowClick:function(e, row){ //trigger an alert message when the row is clicked
            getLiveVehicles(row.getData().vehicleRef)
            alertSpeed(row.getData().nextStopRef, {Longitude:long, Latitude: lat}, row.getData().expArrival)
            
        },
    });
})
.catch(function (error) {
    console.log(error)
})

// Get location of specific stop
function alertSpeed(StopId, location1, arrivalTime){
    axios.get(url+'/stops?api_key='+KEY_511+'&operator_id=SC')
    .then( response => {
        console.log("stops:", response)
        var data = response.data.Contents.dataObjects.ScheduledStopPoint
        for(let i=0; i<data.length; i++){
            if(data[i].id == StopId){
                let location2 = data[i].Location
                let currTime = new Date()
                let arrTime = new Date(arrivalTime)

                let currHours = currTime.getHours()
                let currMinutes = currTime.getMinutes()
                let currSeconds = currTime.getSeconds();
                let arrHours = arrTime.getHours()
                let arrMinutes = arrTime.getMinutes()
                let arrSeconds = arrTime.getSeconds()

                let hourDiff = arrHours - currHours
                let minuteDiff = arrMinutes - currMinutes
                let secondDiff = arrSeconds - currSeconds

                let totalSecondsDiff = (hourDiff * 3600) + (minuteDiff * 60) + secondDiff
                let totalHourDiff = (totalSecondsDiff/60)/60

                let dist= distance(location1.Latitude, location1.Longitude, parseFloat(location2.Latitude), parseFloat(location2.Longitude), 'M')
                let speed = dist/totalHourDiff
                alert("The bus selected is going at "+speed+"mph")
            }
        }

    })
    .catch(function (error) {
        console.log(error)
        })
}


function getLiveVehicles(busID){
    axios.get(url+'/VehicleMonitoring?api_key='+KEY_511+'&agency=SC&vehicleID='+busID) // BUS LOCATIONS 
        .then( response => {
            var data = response.data.Siri.ServiceDelivery.VehicleMonitoringDelivery.VehicleActivity 
            console.log("data:", data)
            for(let i=0 ; i < data.length; i++){
                if(data[i].MonitoredVehicleJourney.LineRef != null){
                    let entry =data[i].MonitoredVehicleJourney
                    console.log(data[i])
                    var destination = entry.DestinationName
                    var direction = entry.DirectionRef
                    var occupancy = entry.Occupancy 
                    var origin = entry.OriginName
                    var publishedname = entry.PublishedLineName
                    var long = parseFloat(entry.VehicleLocation.Longitude)
                    var lat = parseFloat(entry.VehicleLocation.Latitude)
                    var vehicle = entry.VehicleRef
                    var line = entry.LineRef
                    var nextStopRef = (entry.OnwardCalls ? entry.OnwardCalls.OnwardCall.StopPointRef : null) 
                    var nextStopName = (entry.OnwardCalls ? entry.OnwardCalls.OnwardCall.StopPointName : null)
                    var expectedArrival = (entry.OnwardCalls ? entry.OnwardCalls.OnwardCall.ExpectedArrivalTime: null)
        
        
            
                    var obj = {
                        destination: destination,
                        direction: direction,
                        occupancy: occupancy,
                        origin: origin,
                        publishedname: publishedname,
                        location: {lat:lat, lng:long},
                        vehicle: vehicle,
                        line:line,
                        nextStopRef: nextStopRef,
                        nextStopName: nextStopName,
                        expectedArrival: expectedArrival
                    };
                    liveVehicles.push(obj)
                    
                }        
            }
        const map = new google.maps.Map(document.getElementById("map"), {
            center: { lat: 37.50, lng: -122.10 },
            zoom: 9,
        });



    for(let i=0; i<liveVehicles.length; i++){
        const infowindow = new google.maps.InfoWindow({
        content: liveVehicles[i].line+"- "+liveVehicles[i].publishedname+"<br>"
        
        });
        const marker = new google.maps.Marker({
        position: liveVehicles[i].location,
        map,
        title: "VTA Bus",
        });
        marker.addListener("click", () => {
        infowindow.open({
          anchor: marker,
          map,
          shouldFocus: false,
        });
      });
  }
        })
        .catch(function (error) {
        console.log(error)
        })
}


