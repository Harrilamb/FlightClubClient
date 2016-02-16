/* global angular, Cesium */

angular
        .module('FCWorld', ['ngMaterial'])
        .controller('sideNavCtrl', function ($scope) {

          var w = new world();

          $scope.backgroundShow = false;
          $scope.cesiumShow = false;
          $scope.sidebarShow = false;
          $scope.rand5 = 5 * 60 * 1000 * Math.random(); // 5 minute range

          $scope.selectedStage = 0;
          $scope.clickStage = function (stage) {
            $scope.selectedStage = stage;
            w.trackEntity(stage);

          };

          $scope.toggleToolbar = function () {
            $scope.toolbar.open = !$scope.toolbar.open;
          };

          angular.element(document).ready(function () {
            var queryString = window.location.search.substring(1);
            w.setProps(parseQueryString(queryString));

            httpRequest(api_url + '/missions/' + w.getProp('code'), 'GET', null, fillData(w, $scope), null);
          });

          setInterval(function () {
            $scope.$apply(function () {
              setClock($scope, w);
            });
          }, 1000);
          
        });

var fillData = function (w, scope) {
  return function (data)
  {
    w.setProp('missionName', data.Mission.description);
    w.setProp('vehicle', data.Mission.launchvehicle);
    if(w.getProp('vehicle') === 'FNH') {
      w.setProp('numStages', 3);
    } else {
      w.setProp('numStages', 2);
    }
        
    scope.missionName = w.getProp('missionName');
    scope.stage0 = w.getStageName(0);
    scope.stage1 = w.getStageName(1);
    scope.stage2 = w.getStageName(2);

    document.title = w.getProp('missionName') + ' Live!';

    var tempDate = data.Mission.date.replace(/-/g, "/") + ' ' + data.Mission.time + ' UTC';
    w.setProp('launchTime', Date.parse(tempDate));

    var now = new Date();
    var timeUntilLaunch = w.getProp('launchTime') - now;
    var textBox = $(".textBox");

    if (w.getProp('watch') === '2') {
      scope.sidebarShow = true;
      scope.cesiumShow = true;
      w.setProp('id', data.Mission.livelaunch);
      w.loadDataAndPlot();
    } else if (w.getProp('id') !== undefined) {
      scope.cesiumShow = true;
      w.loadDataAndPlot();
      w.setCameraLookingAt(data.Mission.launchsite);
    }
    else if (w.getProp('watch') === '1') 
    {
      if (timeUntilLaunch > 1 * 60 * 60 * 1000)
      {
        scope.backgroundShow = true;
        var html =
                "<div>" + w.getProp('missionName') + " will launch in</div>\n" +
                "\t<div id='days'></div>\n" +
                "\t<div id='hours'></div>\n" +
                "\t<div id='minutes'></div>\n" +
                "\t<div id='seconds'></div>\n";
        textBox.append(html);
        scope.displayClock = true;
      }
      else if (timeUntilLaunch < -14 * 60 * 1000)
      {
        scope.backgroundShow = true;
        var html =
                "<div class='text_double centre'>\n" +
                "  <div>" + w.getProp('missionName') + " has already launched.</div>\n" +
                "  <a href='world.php?code=" + w.getProp('code') + "&watch=2'>Rewatch the launch here</a>\n" +
                "</div>";
        textBox.append(html);
      }
      else
      {
        scope.cesiumShow = true;
        scope.sidebarShow = true;
        w.loadDataAndPlot();
        w.setCameraLookingAt(data.Mission.launchsite);
      }
    }

    var fullWidth = angular.element(document.querySelectorAll("body")[0])[0].clientWidth;
    document.getElementById("cesiumContainer").style.width = (fullWidth - (scope.sidebarShow ? 400 : 0)) + 'px';
  };
};
        
function setClock(scope, world) {

  var _second = 1000;
  var _minute = _second * 60;
  var _hour = _minute * 60;
  var _day = _hour * 24;

  if (scope.cesiumShow) {
    if(world.getViewer() !== undefined) {
      var now = Cesium.JulianDate.toDate(world.getViewer().clock.currentTime);
      var distance = world.getLaunchTime() - now;
      var sign = distance > 0 ? '-' : '+';
      var days = Math.floor(distance / _day);
      var hours = Math.abs(Math.floor((distance % _day) / _hour));
      var minutes = Math.abs(Math.floor((distance % _hour) / _minute));
      var seconds = Math.abs(Math.floor((distance % _minute) / _second));

      if (sign === '+') {
        hours -= 1;
        minutes -= 1;
        seconds -= 1;
      }
      if (hours < 10)
        hours = '0' + hours;
      if (minutes < 10)
        minutes = '0' + minutes;
      if (seconds < 10)
        seconds = '0' + seconds;

      if (Math.abs((5 * _minute - scope.rand5) - distance) < 1000)  // polls for aborts between T-5 -> T-0
        world.pollLaunchTime();
      if (Math.abs(scope.rand5 + distance) < 1000 && world.getProp('watch') !== '2') // poll for aborts between T-0 -> T+5
        world.pollLaunchTime();
      if (Math.abs((15 * _minute + 2 * scope.rand5) + distance) < 1000 && world.getProp('watch') !== '2') // plots -> over limit between T+15 -> T+25
        window.location.reload(true);

      scope.clock = 'T' + sign + hours + ':' + minutes + ':' + seconds;
    }

  } else if(scope.displayClock) {
    
    var now = new Date();
    var distance = world.getProp('launchTime') - now;
    var sign = distance > 0 ? '-' : '+';
    var days = Math.floor(distance / _day);
    var hours = Math.abs(Math.floor((distance % _day) / _hour));
    var minutes = Math.abs(Math.floor((distance % _hour) / _minute));
    var seconds = Math.abs(Math.floor((distance % _minute) / _second));

    document.getElementById('days').innerHTML = days + ' day' + ((days !== 1) ? 's' : '');
    document.getElementById('hours').innerHTML = hours + ' hour' + ((hours !== 1) ? 's' : '');
    document.getElementById('minutes').innerHTML = minutes + ' minute' + ((minutes !== 1) ? 's' : '');
    document.getElementById('seconds').innerHTML = seconds + ' second' + ((seconds !== 1) ? 's' : '');

    if (Math.abs((59 * _minute - scope.rand5) - distance) < 1000) // clock -> plots limit between T-59 -> T-54
      window.location.reload(true);

  }
}