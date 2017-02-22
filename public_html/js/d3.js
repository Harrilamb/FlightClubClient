/* global d3 */

angular.module('FlightClub').controller('D3Ctrl', function ($scope, $http, $interval) {

    $scope.$emit('viewBroadcast', 'd3');

    $scope.$parent.toolbarTitle = 'Flight Club | D3';
    $scope.$parent.toolbarClass = "";

    $scope.bodyConfigs = [
        {id: 1, name: "Earth", files: ["Earth"]},
        {id: 2, name: "Earth-Moon", files: ["Earth", "Moon"]},
        {id: 3, name: "Sun-Earth", files: ["Sun", "Mercury", "Venus", "Earth"]},
        {id: 4, name: "Sun-Mars", files: ["Sun", "Mercury", "Venus", "Earth", "Mars"]}
    ];
    $scope.selectedConfig = $scope.bodyConfigs[0];
    
    var trajectories = [];
    
    $scope.updateModel = function(config) {

        config.files.forEach(function(file) {
            
            var newObj = {name: file, data: []};
            trajectories.push(newObj);
            var index = trajectories.indexOf(newObj);
            
            $http.get('ss/' + file + '.dat').then(function (res) {
                var lines = res.data.split("\n");
                lines.forEach(function (line) {
                    line = line.split("\t");
                    var newLine = [];
                    line.forEach(function(el) {
                        newLine.push(parseFloat(el));
                    });
                    trajectories[index].data.push(newLine);
                });
            });
        });
        
        initSVG(); // this executes before above code is finished, and that's ok
        
    };

    angular.element(document).ready(function () {
        $scope.updateModel($scope.selectedConfig);
    });

    var initSVG = function () {

        var fullHeight = document.getElementById('d3-container').clientHeight;

        var spacetime = d3.select('#d3-container');
        var width = fullHeight,
                height = fullHeight,
                radius = Math.min(width, height);

        var radii = {
            "sun": radius / 8,
            "earthOrbit": radius / 2.5,
            "earth": radius / 32,
            "moonOrbit": radius / 16,
            "moon": radius / 96
        };

        // Space
        var svg = spacetime.append("svg")
                .attr("width", width)
                .attr("height", height)
                .append("g")
                .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

        // Sun
        svg.append("circle")
                .attr("class", "sun")
                .attr("r", radii.sun)
                .style("fill", "rgba(255, 204, 0, 1.0)");

        // Earth's orbit
        svg.append("circle")
                .attr("class", "earthOrbit")
                .attr("r", radii.earthOrbit)
                .style("fill", "none")
                .style("stroke", "rgba(255, 204, 0, 0.25)");

        // Current position of Earth in its orbit
        var earthOrbitPosition = d3.svg.arc()
                .outerRadius(radii.earthOrbit + 1)
                .innerRadius(radii.earthOrbit - 1)
                .startAngle(0)
                .endAngle(0);
        svg.append("path")
                .attr("class", "earthOrbitPosition")
                .attr("d", earthOrbitPosition)
                .style("fill", "rgba(255, 204, 0, 0.75)");

        // Earth
        svg.append("circle")
                .attr("class", "earth")
                .attr("r", radii.earth)
                .attr("transform", "translate(0," + -radii.earthOrbit + ")")
                .style("fill", "rgba(113, 170, 255, 1.0)");

        // Time of day
        var day = d3.svg.arc()
                .outerRadius(radii.earth)
                .innerRadius(0)
                .startAngle(0)
                .endAngle(0);
        svg.append("path")
                .attr("class", "day")
                .attr("d", day)
                .attr("transform", "translate(0," + -radii.earthOrbit + ")")
                .style("fill", "rgba(53, 110, 195, 1.0)");

        // Moon's orbit
        svg.append("circle")
                .attr("class", "moonOrbit")
                .attr("r", radii.moonOrbit)
                .attr("transform", "translate(0," + -radii.earthOrbit + ")")
                .style("fill", "none")
                .style("stroke", "rgba(113, 170, 255, 0.25)");

        // Current position of the Moon in its orbit
        var moonOrbitPosition = d3.svg.arc()
                .outerRadius(radii.moonOrbit + 1)
                .innerRadius(radii.moonOrbit - 1)
                .startAngle(0)
                .endAngle(0);
        svg.append("path")
                .attr("class", "moonOrbitPosition")
                .attr("d", moonOrbitPosition)
                .attr("transform", "translate(0," + -radii.earthOrbit + ")")
                .style("fill", "rgba(113, 170, 255, 0.75)");

        // Moon
        svg.append("circle")
                .attr("class", "moon")
                .attr("r", radii.moon)
                .attr("transform", "translate(0," + (-radii.earthOrbit + -radii.moonOrbit) + ")")
                .style("fill", "rgba(150, 150, 150, 1.0)");

        $interval(function () {
            update(radii, earthOrbitPosition, day, moonOrbitPosition);
        }, 1000);

    };

    var update = function (radii, earthOrbitPosition, day, moonOrbitPosition) {

        // Update the clock every second
        var now = new Date();

        var interpolateEarthOrbitPosition = d3.interpolate(earthOrbitPosition.endAngle()(), (2 * Math.PI * d3.time.hours(d3.time.year.floor(now), now).length / d3.time.hours(d3.time.year.floor(now), d3.time.year.ceil(now)).length));

        var interpolateDay = d3.interpolate(day.endAngle()(), (2 * Math.PI * d3.time.seconds(d3.time.day.floor(now), now).length / d3.time.seconds(d3.time.day.floor(now), d3.time.day.ceil(now)).length));

        var interpolateMoonOrbitPosition = d3.interpolate(moonOrbitPosition.endAngle()(), (2 * Math.PI * d3.time.hours(d3.time.month.floor(now), now).length / d3.time.hours(d3.time.month.floor(now), d3.time.month.ceil(now)).length));

        d3.transition().tween("orbit", function () {
            return function (t) {
                // Animate Earth orbit position
                d3.select(".earthOrbitPosition")
                        .attr("d", earthOrbitPosition.endAngle(interpolateEarthOrbitPosition(t)));

                // Transition Earth
                d3.select(".earth")
                        .attr("transform", "translate(" + radii.earthOrbit * Math.sin(interpolateEarthOrbitPosition(t) - earthOrbitPosition.startAngle()()) + "," + -radii.earthOrbit * Math.cos(interpolateEarthOrbitPosition(t) - earthOrbitPosition.startAngle()()) + ")");

                // Animate day
                // Transition day
                d3.select(".day")
                        .attr("d", day.endAngle(interpolateDay(t)))
                        .attr("transform", "translate(" + radii.earthOrbit * Math.sin(interpolateEarthOrbitPosition(t) - earthOrbitPosition.startAngle()()) + "," + -radii.earthOrbit * Math.cos(interpolateEarthOrbitPosition(t) - earthOrbitPosition.startAngle()()) + ")");

                // Transition Moon orbit
                d3.select(".moonOrbit")
                        .attr("transform", "translate(" + radii.earthOrbit * Math.sin(interpolateEarthOrbitPosition(t) - earthOrbitPosition.startAngle()()) + "," + -radii.earthOrbit * Math.cos(interpolateEarthOrbitPosition(t) - earthOrbitPosition.startAngle()()) + ")");

                // Animate Moon orbit position
                // Transition Moon orbit position
                d3.select(".moonOrbitPosition")
                        .attr("d", moonOrbitPosition.endAngle(interpolateMoonOrbitPosition(t)))
                        .attr("transform", "translate(" + radii.earthOrbit * Math.sin(interpolateEarthOrbitPosition(t) - earthOrbitPosition.startAngle()()) + "," + -radii.earthOrbit * Math.cos(interpolateEarthOrbitPosition(t) - earthOrbitPosition.startAngle()()) + ")");

                // Transition Moon
                d3.select(".moon")
                        .attr("transform", "translate(" + (radii.earthOrbit * Math.sin(interpolateEarthOrbitPosition(t) - earthOrbitPosition.startAngle()()) + radii.moonOrbit * Math.sin(interpolateMoonOrbitPosition(t) - moonOrbitPosition.startAngle()())) + "," + (-radii.earthOrbit * Math.cos(interpolateEarthOrbitPosition(t) - earthOrbitPosition.startAngle()()) + -radii.moonOrbit * Math.cos(interpolateMoonOrbitPosition(t) - moonOrbitPosition.startAngle()())) + ")");
            };
        });
    };

});