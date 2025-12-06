// ASTER Mineral alteration indices

// 1. Select scene by search or ID
// Ensure you have a geometry point placed on the map
var point = geometry;
Map.centerObject(point, 9);
Map.addLayer(point, { color: 'red' }, 'Search Point');

// Search for ASTER scenes
var asterCollection = ee.ImageCollection("ASTER/AST_L1T_003")
  .filterBounds(point)
  .filterDate('2000-01-01', '2007-12-31')
  .filter(ee.Filter.lt('CLOUDCOVER', 20));

print('Available ASTER Scenes:', asterCollection);

// Select a specific image 
//[(Update this ID if needed based on the collection search)]
var aster = asterCollection.first();
//var aster = ee.Image('ASTER/AST_L1T_003/20070331082617'); 

print('Selected ASTER Scene:', aster);
var aoi = aster.geometry();

// Visualize Natural Color
Map.addLayer(aster, { bands: ['B3N', 'B02', 'B01'], min: 0, max: 255 }, 'ASTER Natural Color', true);
Map.addLayer(aoi, { color: 'red' }, 'Study Area (AOI)', false);

// 2. Preprocessing: "Cross-talk & Atmosphric Correction"

function dos(img) {
  var ms = img.select('B0[1-9]', 'B3N');
  var tir = img.select('B1[0-4]');
  var dark_object = ms.reduceRegion({
    reducer: ee.Reducer.min(),
    geometry: aoi,
    scale: 30,
    maxPixels: 1e13,
    bestEffort: true
  });

  var bands = ms.bandNames();

  var cor = bands.map(function (band_name) {
    var do_val = ee.Number(dark_object.get(band_name));
    return ms.select([band_name]).subtract(do_val).max(0);
  });

  return ee.ImageCollection(cor).toBands().addBands(tir);
}

var aster_cor = dos(aster);

// 3. Mineral alteration (BAND RATIOS)

function calculateGoldRatios(img) {

  // GROUP 1: Argillic & Advanced Argillic
  var alunite_kao_pyro = img.expression('(b4 + b6) / b5',
    {
      'b4': img.select('2_B04'), 'b5': img.select('3_B05'),
      'b6': img.select('4_B06')
    }).rename('Alunite_Kaolinite_Pyrophyllite');

  var kaolinite = img.expression('b4 / b6',
    { 'b4': img.select('2_B04'), 'b6': img.select('4_B06') }).rename('Kaolinite_Index');

  var alunite = img.expression('b4 / b5',
    { 'b4': img.select('2_B04'), 'b5': img.select('3_B05') }).rename('Alunite_Index');

  var argillic_general = img.expression('(b5 + b7) / b6',
    {
      'b5': img.select('3_B05'), 'b6': img.select('4_B06'),
      'b7': img.select('5_B07')
    }).rename('Argillic_General');

  // GROUP 2: Phyllic
  var sericite_muscovite = img.expression('(b5 + b7) / b6',
    {
      'b5': img.select('3_B05'), 'b6': img.select('4_B06'),
      'b7': img.select('5_B07')
    }).rename('Sericite_Muscovite');

  var phyllic = img.expression('b5 / b6',
    { 'b5': img.select('3_B05'), 'b6': img.select('4_B06') }).rename('Phyllic_Alteration');

  // GROUP 3: Propylitic
  var propylitic = img.expression('(b7 + b9) / b8',
    {
      'b7': img.select('5_B07'), 'b8': img.select('6_B08'),
      'b9': img.select('7_B09')
    }).rename('Propylitic_Index');

  var chlorite = img.expression('(b6 + b9) / b8',
    {
      'b6': img.select('4_B06'), 'b8': img.select('6_B08'),
      'b9': img.select('7_B09')
    }).rename('Chlorite_Index');

  var epidote_calcite = img.expression('b13 / b14',
    { 'b13': img.select('B13'), 'b14': img.select('B14') }).rename('Epidote_Calcite_Carbonate');

  // GROUP 4: Silicification
  var quartz_index = img.expression('b11 / (b10 + b12)',
    {
      'b10': img.select('B10'), 'b11': img.select('B11'),
      'b12': img.select('B12')
    }).rename('Quartz_Index_QI');

  var silica_index = img.expression('b13 / b10',
    { 'b10': img.select('B10'), 'b13': img.select('B13') }).rename('Silica_Index');

  // GROUP 5: Iron Oxides
  var gossan = img.expression('b4 / b2',
    { 'b4': img.select('2_B04'), 'b2': img.select('1_B02') }).rename('Gossan_Index');

  var ferric_hematite = img.expression('b2 / b1',
    { 'b1': img.select('0_B01'), 'b2': img.select('1_B02') }).rename('Ferric_Iron_Hematite');

  var ferrous = img.expression('b5 / b3',
    { 'b5': img.select('3_B05'), 'b3': img.select('8_B3N') }).rename('Ferrous_Iron');

  return alunite_kao_pyro
    .addBands(kaolinite)
    .addBands(alunite)
    .addBands(argillic_general)
    .addBands(sericite_muscovite)
    .addBands(phyllic)
    .addBands(propylitic)
    .addBands(chlorite)
    .addBands(epidote_calcite)
    .addBands(quartz_index)
    .addBands(silica_index)
    .addBands(gossan)
    .addBands(ferric_hematite)
    .addBands(ferrous);
}

var goldIndices = calculateGoldRatios(aster_cor);

// 4. Visualization

var ratioVis = { min: 0.8, max: 1.5 };
var thermalVis = { min: 0.4, max: 0.6 };

var bandNames = goldIndices.bandNames().getInfo();

bandNames.forEach(function (band) {
  var vis = ratioVis;
  if (band.indexOf('Quartz') > -1 || band.indexOf('Epidote') > -1) vis = thermalVis;

  Map.addLayer(goldIndices.select(band), vis, band, false);
});

// 6. Export

var sceneId = ee.String(aster.get('system:index')).getInfo();

Export.image.toDrive({
  image: goldIndices.toFloat(),
  description: 'ASTER_Gold_Indices_Composite_' + sceneId,
  scale: 30,
  region: aoi,
  fileFormat: 'GeoTIFF',
  crs: 'EPSG:4326',
  folder: 'GEE_Gold_Exploration',
  maxPixels: 1e13
});