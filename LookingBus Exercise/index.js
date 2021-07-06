let KEY_511 = '511.org API KEY';
let KEY_MAPS = 'Google Maps API Key';
let url = 'https://api.511.org/transit';

var liveVehicles = []
var stops = []

      


axios.get(url+'/lines?api_key='+KEY_511+'&operator_id=SC') // BUS ROUTES
    .then(function (response) {
        console.log("SC VTA BUS LINES");
        var tabledata = []
        for(let i=0 ; i < response.data.length; i++){
            var id = response.data[i].Id
            var name = response.data[i].Name
    
            var obj = {busid: id, busname: name}
            tabledata.push(obj)
        }

        //create Tabulator on DOM element with id "example-table"
    var table = new Tabulator("#example-table", {
        height:205, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
        data:tabledata, //assign data to table
        layout:"fitColumns", //fit columns to width of table (optional)
        columns:[ //Define Table Columns
            {title:"Line ID", field:"busid", width:150},
            {title:"Line Name", field:"busname"}
        ],
        rowClick:function(e, row){ //trigger an alert message when the row is clicked
            alert("Row " + row.getData().id + " Clicked!!!!");
        },
    });
       

    })
    .catch(function (error) {
        console.log(error)
    })
    .then(function() {
        
    })

function getLiveVehicles(){
    return axios.get(url+'/VehicleMonitoring?api_key='+KEY_511+'&agency=SC') // BUS LOCATIONS 
        .then( response => {
            this.response = response.data
        return this.response.Siri.ServiceDelivery.VehicleMonitoringDelivery.VehicleActivity 
        })
        .catch(function (error) {
        console.log(error)
        })
}

getLiveVehicles()
.then(data => {
    console.log("data:" ,data)
    for(let i=0 ; i < data.length; i++){
        if(data[i].MonitoredVehicleJourney.LineRef != null){
            let entry =data[i].MonitoredVehicleJourney
            var destination = entry.DestinationName
            var direction = entry.DirectionRef
            var occupancy = entry.Occupancy 
            var origin = entry.OriginName
            var publishedname = entry.PublishedLineName
            var long = parseFloat(entry.VehicleLocation.Longitude)
            var lat = parseFloat(entry.VehicleLocation.Latitude)
            var vehicle = entry.VehicleRef
            var line = entry.LineRef
            var nextStop = entry.OnwardCalls.OnwardCall[0].StopPointRef

    
            var obj = {
                destination: destination,
                direction: direction,
                occupancy: occupancy,
                origin: origin,
                publishedname: publishedname,
                location: {lat:lat, lng:long},
                vehicle: vehicle,
                line:line,
            };
            liveVehicles.push(obj)
            
        }        
    }

    const map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 37.50, lng: -122.10 },
        zoom: 10,
      });



    for(let i=0; i<liveVehicles.length; i++){
        const infowindow = new google.maps.InfoWindow({
        content: liveVehicles[i].line+"- "+liveVehicles[i].publishedname+"<br>"
        +"Avg.Speed:"
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
    
    
}

)

axios.get(url+'/stops?api_key='+KEY_511+'&operator_id=SC') // BUS LOCATIONS 
.then(function (response) {
    console.log("SC VTA Stops")
    // get vehicle long and lat (VehicleLocation: Longitude and Latitude)
    console.log(response.data.Contents.dataObjects.ScheduledStopPoint);

})
.catch(function (error) {
    console.log(error)
})
.then(function() {
   
})


axios.get('/StopMonitoring?api_key='+KEY_511+'&agency=SC&stopCode='+nextStop)
.then(function(response) {
    console.log(response.data.Siri.ServiceDelivery.StopMonitoringDelivery.MonitoredStopVisit.MonitoredVehicleJourney.OnwardsCalls.Distances.DistanceFromCall)
})


