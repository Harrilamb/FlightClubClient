

// Initialize map
var viewer = new Cesium.Viewer('cesiumContainer', {
	timeline: false,
	skyAtmosphere: false,
	animation: false,
	scene3DOnly: true,
	fullscreenButton: false,
	homeButton: false,
	geocoder: false,
  baseLayerPicker: true
  
});

var terrainProvider = new Cesium.CesiumTerrainProvider({
    url : '//assets.agi.com/stk-terrain/world',
    requestWaterMask: true
});
viewer.terrainProvider = terrainProvider;
