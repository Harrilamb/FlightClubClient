
var fullData = [], eventsData = [];
var stageMap = {}, queryParams = {};
var numCols= 16;

function doPage() {
  
  var queryString = window.location.search.substring(1);
  queryParams = parseQueryString(queryString);
  
  httpRequest(api_url + '/missions/' + queryParams['code'], 'GET', null, fillData, null);
  httpRequest(api_url+'/simulator/results?'+queryString, 'GET', null, fillOutputArray, null);

}

$(document).ready(doPage());
//$(window).resize(doPage()); // doesn't work ???

$(document).on('click', '#liveInitButton', function() {
  var queryString = window.location.href.slice(window.location.href.indexOf('?') + 1)
          + '&auth=' + $.cookie('authToken');
  httpRequest(api_url+'/live/init?'+queryString, 'GET', null, setOverrideSuccess, setOverrideFailure);  
});

function fillData(data)
{

  if(data.Mission !== undefined) {
    $.each(data.Mission.Profile.Stages, function(key,val) {
      stageMap[val.Core.id] = val.Core.name;
    });
  }
  else { // guess two stage
    stageMap[0] = "Booster";
    stageMap[1] = "UpperStage";
  }

  getDataFile(0);
  
}

function getDataFile(stage) {
  if (stageMap[stage] === undefined)
    initialisePlots();
  else {
    var url = client + '/output/' + queryParams['id'] + '_' + stageMap[stage] + '.dat';
    $.ajax({type: 'GET', url: url, contentType: 'text', data: null,
      xhrFields: {withCredentials: false},
      success: successfn,
      error: errorfn
    });
  }

  function successfn(data) {
    var lines = data.split("\n");

    fullData[stage] = [];
    for(var j=0;j<=numCols;j++) {
      fullData[stage][j] = [];
      for (var i = 1; i < lines.length; i++) {
        var data = lines[i].split("\t");
        fullData[stage][j][i] = parseFloat(data[j]);
      }
    }
    getEventsFile(stage);
  }

  function errorfn(data) {
    //console.log(data);
  }
}

function getEventsFile(stage) {
  var url = client + '/output/' + queryParams['id'] + '_' + stageMap[stage] + '_events.dat';
  $.ajax({type: 'GET', url: url, contentType: 'text', data: null,
    xhrFields: {withCredentials: false},
    success: successfn,
    error: errorfn
  });

  function successfn(data) {
    var lines = data.split("\n");
    
    eventsData[stage] = [];
    for(var j=0;j<=numCols;j++) {
      eventsData[stage][j] = [];
      for (var i = 1; i < lines.length; i++) {
        var data = lines[i].split("\t");
        eventsData[stage][j][i] = parseFloat(data[j]);
      }
    }
    getDataFile(stage + 1);
  }

  function errorfn(data) {
    //console.log(data);
  }
}

function initialisePlots() {
  
  var plotMap = [];
  /*
  plotMap.push({id:'globe',stages:[1],title:'Trajectory',
    x:{axis:1,type:"linear"},
    y:{axis:2,type:"linear"},
    z:{axis:3,type:"linear"}});
  
  for(var i=0;i<plotMap.length;i++) {
    initialisePlot3(plotMap[i]);
  }
  */
  plotMap = [];
  plotMap.push({id:'altitude1',stages:[0,1],title:"Altitude",
    x:{axis:0,label:"Time (s)",type:"linear"},
    y:{axis:4,label:"Altitude (km)",type:"linear"}});
  /*
  plotMap.push({id:'altitude2',stages:[1],title:"Upper Stage Altitude",
    x:{axis:0,label:"Time (s)",type:"linear"},
    y:{axis:4,label:"Altitude (km)", type:"linear"}});*/
  plotMap.push({id:'profile1',stages:[0],title:"Booster Profile",
    x:{axis:6,label:"Downrange (km)", type:"linear"},
    y:{axis:4,label:"Altitude (km)", type:"linear"}});
  plotMap.push({id:'total-dv',stages:[0,1],title:"Total dV Expended",
    x:{axis:0,label:"Time (s)",type:"log"},
    y:{axis:9,label:"dV (m/s)", type:"log"}});
  plotMap.push({id:'velocity1',stages:[0,1],title:"Velocity",
    x:{axis:0,label:"Time (s)",type:"linear"},
    y:{axis:5,label:"Velocity (m/s)", type:"linear"}});/*
  plotMap.push({id:'velocity2',stages:[1],title:"Upper Stage Velocity",
    x:{axis:0,label:"Time (s)",type:"linear"},
    y:{axis:5,label:"Velocity (m/s)",type:"linear"}});*/
  plotMap.push({id:'prop',stages:[0,1],title:"Propellant Mass",
    x:{axis:0,label:"Time (s)",type:"log"},
    y:{axis:8,label:"Mass (t)",type:"log"}});
  plotMap.push({id:'phase1',stages:[0],title:"Booster Phasespace",
    x:{axis:4,label:"Altitude (km)",type:"linear"},
    y:{axis:5,label:"Velocity (m/s)",type:"linear"}});
  plotMap.push({id:'q',stages:[0],title:"Aerodynamic Pressure",
    x:{axis:0,label:"Time (s)",type:"linear"},
    y:{axis:7,label:"Altitude (km)",type:"linear"}});
  plotMap.push({id:'accel1',stages:[0,1],title:"Acceleration",
    x:{axis:0,label:"Time (s)",type:"linear"},
    y:{axis:13,label:"Acceleration (g)", type:"linear"}});/*
  plotMap.push({id:'accel2',stages:[1],title:"Upper Stage Acceleration",
    x:{axis:0,label:"Time (s)",type:"linear"},
    y:{axis:13,label:"Acceleration (g)", type:"linear"}});*/
  plotMap.push({id:'aoa',stages:[0,1],title:"Angle of Attack",
    x:{axis:0,label:"Time (s)",type:"linear"},
    y:{axis:14,label:"Angle (degrees)", type:"linear"}});
  plotMap.push({id:'aov',stages:[0,1],title:"Velocity Angle",
    x:{axis:0,label:"Time (s)",type:"linear"},
    y:{axis:15,label:"Angle (degrees)", type:"linear"}});
  plotMap.push({id:'aop',stages:[0,1],title:"Pitch Angle",
    x:{axis:0,label:"Time (s)",type:"linear"},
    y:{axis:16,label:"Angle (degrees)", type:"linear"}});
  
  for(var i=0;i<plotMap.length;i++) {
    initialisePlot2(plotMap[i]);
  }
}

function initialisePlot2(plot) {

  var data = [];  
  for(var i=0;i<plot.stages.length;i++) {
    var s = plot.stages[i];
    data.push({
      x: fullData[s][plot.x.axis],
      y: fullData[s][plot.y.axis],
      mode: 'lines',
      name: stageMap[s]
    });
    data.push({
      x: eventsData[s][plot.x.axis],
      y: eventsData[s][plot.y.axis],
      mode: 'markers',
      showlegend: false,
      name: stageMap[s] + ' Event'
    });
  }
  
  var layout = {
    title: plot.title,
    showlegend: false,
    xaxis: {type: plot.x.type, title: plot.x.label, range: plot.y.axis>13 ? [0,1000] : [null,null]},
    yaxis: {type: plot.y.type, title: plot.y.label}
  };

  Plotly.newPlot(plot.id, data, layout);

}

function initialisePlot3(plot) {

  var data = [];  
  for(var i=0;i<plot.stages.length;i++) {
    var s = plot.stages[i];
    data.push({
      x: fullData[s][plot.x.axis],
      y: fullData[s][plot.y.axis],
      z: fullData[s][plot.z.axis],
      mode: 'lines',
      name: stageMap[s],
      type: 'scatter3d'
    });
  }
  
  var layout = {
    title: plot.title,
    showlegend: false,
    xaxis: {type: plot.x.type, title: plot.x.label,autorange: true,showgrid: false,zeroline: false,showline: false,autotick: true,ticks: '',showticklabels: false},
    yaxis: {type: plot.y.type, title: plot.y.label,autorange: true,showgrid: false,zeroline: false,showline: false,autotick: true,ticks: '',showticklabels: false},
    zaxis: {type: plot.z.type, title: plot.z.label,autorange: true,showgrid: false,zeroline: false,showline: false,autotick: true,ticks: '',showticklabels: false}
  };

  Plotly.newPlot(plot.id, data, layout);

}