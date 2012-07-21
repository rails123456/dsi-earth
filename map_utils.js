Ext.Loader.setConfig({
    enabled: true,
    disableCaching: false,
    paths: {
        GeoExt: "geoext2/src/GeoExt",
        Ext: "extjs4/src",
        "GeoExt.ux": "geoext_ux"
    }
});
var mapPanel, tree, store, vectorLayer,overlay,panel_west,markers,map,ge,hili;
var gcs = new OpenLayers.Projection("EPSG:4326");
var merc = new OpenLayers.Projection("EPSG:900913");
var utm = new OpenLayers.Projection("EPSG:32647");
var indian = new OpenLayers.Projection("EPSG:24047");
google.load("earth", "1");
//////////////////////////////////////////////
// GPS
////////////////////////////////////////////
function dms2dd(ddd,mm,ss){
  var d = parseFloat(ddd);
  var m = parseFloat(mm)/60.0;
  var s = parseFloat(ss)/3600.0;
  return d + m + s;
}
function dd2dms(ll){
  //debugger;
  var d1 = ll;
  var d2 = parseInt(d1 / 100 * 100);
  var d3 = d1 - d2;
  var d4 = d3 * 60;
  var d5 = parseInt(d4);
  var d6 = d4 - d5;
  var d7 = d6 * 60;
  var dms = [];
  dms[0] = d2;
  dms[1] = d5;
  dms[2] = d7.toFixed(2);
  return dms;
}
function setMarker(lon, lat, msg){
  var lonLatMarker = new OpenLayers.LonLat(lon, lat).transform(gcs,merc);
  var feature = new OpenLayers.Feature(markers, lonLatMarker);
  feature.closeBox = true;
  feature.popupClass = OpenLayers.Class(OpenLayers.Popup.AnchoredBubble,
    {maxSize: new OpenLayers.Size(120, 75) } );
  feature.data.popupContentHTML = msg;
  feature.data.overflow = "hidden";

  var size = new OpenLayers.Size(21,25);
  var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
  var icon = new OpenLayers.Icon('http://www.google.com/mapfiles/marker.png', size, offset);
  var marker = new OpenLayers.Marker(lonLatMarker, icon);
  marker.feature = feature;

  var markerClick = function(evt) {
    if (this.popup == null) {
      this.popup = this.createPopup(this.closeBox);
      map.addPopup(this.popup);
      this.popup.show();
    } else {
      this.popup.toggle();
    }
    OpenLayers.Event.stop(evt);
  };
  markers.addMarker(marker);
  //map.events.register("click", feature, markerClick);
}
//define variable for framed cloud
//disable the autosize for the purpose of our matrix
OpenLayers.Popup.FramedCloud.prototype.autoSize = false;
AutoSizeFramedCloud = OpenLayers.Class(OpenLayers.Popup.FramedCloud, {
  'autoSize': true
});
AutoSizeFramedCloudMinSize = OpenLayers.Class(OpenLayers.Popup.FramedCloud, {
  'autoSize': true, 
  'minSize': new OpenLayers.Size(400,400)
});
AutoSizeFramedCloudMaxSize = OpenLayers.Class(OpenLayers.Popup.FramedCloud, {
  'autoSize': true, 
  'maxSize': new OpenLayers.Size(100,100)
});

function addMarkers() {

  var ll, popupClass, popupContentHTML;

  //
  //FRAMED NO OVERFLOW
  //

  //anchored bubble popup wide short text contents autosize closebox
  ll = new OpenLayers.LonLat(13, 100);
  popupClass = AutoSizeFramedCloud;
  popupContentHTML = '<div style="background-color:red;">Popup.FramedCloud<br>autosize - wide short text<br>closebox<br>' + samplePopupContentsHTML_WideShort + '</div>' 
  addMarker(ll, popupClass, popupContentHTML, true);
}

/**
 * Function: addMarker
 * Add a new marker to the markers layer given the following lonlat, 
 *     popupClass, and popup contents HTML. Also allow specifying 
 *     whether or not to give the popup a close box.
 * 
 * Parameters:
 * ll - {<OpenLayers.LonLat>} Where to place the marker
 * popupClass - {<OpenLayers.Class>} Which class of popup to bring up 
 *     when the marker is clicked.
 * popupContentHTML - {String} What to put in the popup
 * closeBox - {Boolean} Should popup have a close box?
 * overflow - {Boolean} Let the popup overflow scrollbars?
 */

function addMarker(ll, popupClass, popupContentHTML, closeBox, overflow) {
  var feature = new OpenLayers.Feature(markers, ll); 
  feature.closeBox = closeBox;
  feature.popupClass = popupClass;
  feature.data.popupContentHTML = popupContentHTML;
  feature.data.overflow = (overflow) ? "auto" : "hidden";
            
  var marker = feature.createMarker();

  var markerClick = function (evt) {
    if (this.popup == null) {
      this.popup = this.createPopup(this.closeBox);
      map.addPopup(this.popup);
      this.popup.show();
    } else {
      this.popup.toggle();
    }
    currentPopup = this.popup;
    OpenLayers.Event.stop(evt);
  };
  marker.events.register("mousedown", feature, markerClick);

  markers.addMarker(marker);
}        

var test_gps = function() {
  Ext.getCmp('londd').setValue(100);
  Ext.getCmp('lonmm').setValue(33);
  Ext.getCmp('lonss').setValue(57.9126);
  Ext.getCmp('latdd').setValue(13);
  Ext.getCmp('latmm').setValue(53);
  Ext.getCmp('latss').setValue(26.757);
}

var check_gps = function(){
var lodd = Ext.getCmp('londd').getValue();        
var lomm = Ext.getCmp('lonmm').getValue();        
var loss = Ext.getCmp('lonss').getValue();        
var ladd = Ext.getCmp('latdd').getValue();        
var lamm = Ext.getCmp('latmm').getValue();        
var lass = Ext.getCmp('latss').getValue();        

report(lodd,lomm,loss,ladd,lamm,lass);
}

var report = function(lodd,lomm,loss,ladd,lamm,lass) {
  
  Ext.Ajax.request({
    url: 'rb/checkLonLat2.rb'
    ,params: {
      method: 'GET'
      ,lodd: lodd
      ,lomm: lomm
      ,loss: loss
      ,ladd: ladd
      ,lamm: lamm
      ,lass: lass
      ,format: 'json'
    }
,failure: function(response, opts){
alert("checkLonLat2 > failure");
return false;            
    }
    ,success: function(response, opts){
      // var data = eval( '(' + response.responseText + ')' );
      // No response from IE

      var data = Ext.decode(response.responseText);
      var lon = parseFloat(data.lon);
      var lat = parseFloat(data.lat);
      var msg = data.msg;

      var p1 = new OpenLayers.LonLat(lon,lat);
      var p2 = p1.transform(gcs,merc);
      map.setCenter(p2, 14);

      var size = new OpenLayers.Size(42,50);
      var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
      var icon = new OpenLayers.Icon('http://www.google.com/mapfiles/marker.png', size, offset);
      markers.addMarker(new OpenLayers.Marker(p2,icon));
      Ext.Msg.alert('Result',data.msg);
    }
  });
};

var gps = Ext.create("Ext.form.Panel",{
    title: 'ตำแหน่งพิกัด GPS',
    id: 'id_gps',
    frame: true,
    items: [
        {
            xtype: 'fieldcontainer',
            layout: {
                type: 'hbox',
                padding:'5',
                pack:'center'
            },
            fieldDefaults: {
                labelSeparator: '',
                labelAlign: 'top',
                margin: '0 5 0 0'
            },
            items: [
                {
                    xtype:'textfield',
                    id: 'londd',
                    fieldLabel: 'Lon:DD',
                    width:50
                }
                ,{
                    xtype:'textfield',
                    id: 'lonmm',
                    fieldLabel: 'Lon:MM',
                    width:50
                }
                ,{
                    xtype:'textfield',
                    id: 'lonss',
                    fieldLabel: 'Lon:SS',
                    width:50
                }
                ,{
                    xtype: 'displayfield',
                    fieldLabel: '&nbsp;',
                    value: 'E'
                }
            ]
        }
        ,{
            xtype: 'fieldcontainer',
            layout: {
                type: 'hbox',
                padding:'5',
                pack:'center'
            },
            fieldDefaults: {
                labelSeparator: '',
                labelAlign: 'top',
                margin: '0 5 0 0'
            },
            items: [
                {
                    xtype:'textfield',
                    id: 'latdd',
                    fieldLabel: 'Lat:DD',
                    width:50
                    
                }
                ,{
                    xtype:'textfield',
                    id: 'latmm',
                    fieldLabel: 'Lat:MM',
                    width:50
                    
                }
                ,{
                    xtype:'textfield',
                    id: 'latss',
                    fieldLabel: 'Lat:SS',
                    width:50
                }
                ,{
                    xtype: 'displayfield',
                    fieldLabel: '&nbsp;',
                    value: 'N'
                }
            ]
        }
        ,{
            xtype: 'fieldcontainer',
            layout: {
                type: 'hbox',
                padding:'5',
                pack:'center'
            },
            fieldDefaults: {
                labelSeparator: '',
                labelAlign: 'top',
                margin: '0 5 0 0'
            },
            items: [{
                    xtype: "button",
                    text: 'Check',
                    handler: check_gps,
                    width: 80
                },{
                    xtype: "button",
                    text: 'Clear',
                    handler: function(){
                      gps.getForm().reset();
                      markers.clearMarkers();
                    },
                    width: 80
                },{
                    xtype: "button",
                    text: 'Test',
                    handler: test_gps,
                    width: 80
            }]
        }
    ],     
});


//////////////////////////////
///UTM
//////////////////////////////
var check_gps_utm = function(){
  var utmn = Ext.getCmp('utmn').getValue();
  var utme = Ext.getCmp('utme').getValue();
  var zone47 = Ext.getCmp('zone47').checked;
  if (zone47 == true)
    zone = '47';
  else
    zone = '48';

  report_utm(utmn, utme, zone);
}

var report_utm = function(utmn, utme, zone) {
  
  Ext.Ajax.request({
    url: 'rb/checkUTM.rb'
    ,params: {
      method: 'GET'
      ,utmn: utmn
      ,utme: utme
      ,zone: zone
      ,format: 'json'
    }
,failure: function(response, opts){
alert("checkUTM > failure");
return false;            
    }
    ,success: function(response, opts){
      //var data = eval( '(' + response.responseText + ')' );

      var data = Ext.decode(response.responseText);
      var lon = parseFloat(data.lon);
      var lat = parseFloat(data.lat);
      var msg = data.msg;

      var p1 = new OpenLayers.LonLat(lon,lat);
      var p2 = p1.transform(gcs,merc);
      map.setCenter(p2, 14);

      var size = new OpenLayers.Size(21,25);
      var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
      var icon = new OpenLayers.Icon('http://www.google.com/mapfiles/marker.png', size, offset);
      markers.addMarker(new OpenLayers.Marker(p2,icon));
      Ext.Msg.alert('Result', data.msg);
    }
  });
};

var test_gps_utm = function(){
  Ext.getCmp('utmn').setValue(1536201);
  Ext.getCmp('utme').setValue(669221);
}

var gps_utm = Ext.create("Ext.form.Panel",{
  id: 'id_gps_utm',
  frame: true,
  title: 'ตำแหน่งพิกัด GPS (UTM)',
  items: [
    {
        xtype: 'fieldcontainer',
        hideLabel: true,
        layout: {
            type: 'hbox',
            padding:'5',
            pack:'center'
        },
        fieldDefaults: {
            labelAlign: 'top',
            margin: '0 5 0 0',
            labelWidth: 90,
            labelSeparator: ''
        },
        items: [
            {
                xtype:'textfield',
                fieldLabel: 'Easting:Meters',
                id: 'utme'
            }
            ,{
                xtype: 'displayfield',
                fieldLabel: '&nbsp;',
                value: 'E'
            }
        ]
    }
    ,{
        xtype: 'fieldcontainer',
        hideLabel: true,
        layout: {
            type: 'hbox',
            padding:'5',
            pack:'center'
        },
        fieldDefaults: {
            labelAlign: 'top',
            margin: '0 5 0 0',
            labelWidth: 90,
            labelSeparator: ''
        },
        items: [
            {
                xtype:'textfield',
                fieldLabel: 'Northing:Meters',
                id: 'utmn'
            }
            ,{
                xtype: 'displayfield',
                fieldLabel: '&nbsp;',
                value: 'N'
            }
        ]
    }
    ,{
        xtype: 'fieldcontainer',
        hideLabel: true,
        layout: {
            type: 'hbox',
            padding:'5',
            pack:'center'
        },
        fieldDefaults: {
            labelAlign: 'top',
            margin: '0 40 0 0',
            labelWidth: 90,
            labelSeparator: ''
        },
        items: [
            {
                xtype: 'radio',
                id: 'zone47',
                name: 'zone',
                fieldLabel: 'Zone 47',
                checked: true,
            }
            ,{
                xtype: 'radio',
                id: 'zone48',
                name: 'zone',
                fieldLabel: 'Zone 48',
            }
        ]
    }
    ,{
        xtype: 'fieldcontainer',
        layout: {
            type: 'hbox',
            padding:'5',
            pack:'center'
        },
        fieldDefaults: {
            labelSeparator: '',
            labelAlign: 'top',
            margin: '0 5 0 0'
        },
        items: [
            {
                xtype: "button",
                text: 'Check',
                handler: check_gps_utm,
                width: 80
            }
            ,{
                xtype: "button",
                text: 'Clear',
                handler: function(){
                  gps_utm.getForm().reset();
                  markers.clearMarkers();
                },
                width: 80
            }
            ,{
                xtype: "button",
                text: 'Test',
                handler: test_gps_utm,
                width: 80
            }
        ]
    }
  ]
});

var check_gps_utm = function(){
  var utmn = Ext.getCmp('utmn').getValue();
  var utme = Ext.getCmp('utme').getValue();
  var zone47 = Ext.getCmp('zone47').checked;
  if (zone47 == true)
    zone = '47';
  else
    zone = '48';

  report_utm(utmn, utme, zone);
}

var report_utm = function(utmn, utme, zone) {
  
  Ext.Ajax.request({
    url: 'rb/checkUTM.rb'
    ,params: {
      method: 'GET'
      ,utmn: utmn
      ,utme: utme
      ,zone: zone
      ,format: 'json'
    }
,failure: function(response, opts){
alert("checkUTM > failure");
return false;            
    }
    ,success: function(response, opts){
      // var data = eval( '(' + response.responseText + ')' );

      var data = Ext.decode(response.responseText);
      var lon = parseFloat(data.lon);
      var lat = parseFloat(data.lat);
      var msg = data.msg;

      var p1 = new OpenLayers.LonLat(lon,lat);
      var p2 = p1.transform(gcs,merc);
      map.setCenter(p2, 14);

      var size = new OpenLayers.Size(21,25);
      var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
      var icon = new OpenLayers.Icon('http://www.google.com/mapfiles/marker.png', size, offset);
      markers.addMarker(new OpenLayers.Marker(p2,icon));
      Ext.Msg.alert('Result', data.msg);
    }
  });
};
///////////////////////////////////////
// UTM INDIAN
//////////////////////////////////////
var check_gps_utm_indian = function(){
  var utmni = Ext.getCmp('utmni').getValue();
  var utmei = Ext.getCmp('utmei').getValue();
  var zone47i = Ext.getCmp('zone47i').checked;
  if (zone47i == true)
    zonei = '47';
  else
    zonei = '48';

  report_utm_indian(utmni, utmei, zonei);
}

var report_utm_indian = function(utmni, utmei, zonei) {
  
  Ext.Ajax.request({
    url: 'rb/checkUTMIndian.rb'
    ,params: {
      method: 'GET'
      ,utmn: utmni
      ,utme: utmei
      ,zone: zonei
      ,format: 'json'
    }
,failure: function(response, opts){
alert("checkUTMIndian > failure");
return false;            
    }
    ,success: function(response, opts){
      // var data = eval( '(' + response.responseText + ')' );

      var data = Ext.decode(response.responseText);
      var lon = parseFloat(data.lon);
      var lat = parseFloat(data.lat);
      var msg = data.msg;

      var p1 = new OpenLayers.LonLat(lon,lat);
      var p2 = p1.transform(gcs,merc);
      map.setCenter(p2, 14);

      var size = new OpenLayers.Size(21,25);
      var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
      var icon = new OpenLayers.Icon('http://www.google.com/mapfiles/marker.png', size, offset);
      markers.addMarker(new OpenLayers.Marker(p2,icon));
      Ext.Msg.alert('Result', data.msg);
    }
  });
};

var test_gps_utm_indian = function(){
  Ext.getCmp('utmni').setValue(1536078);
  Ext.getCmp('utmei').setValue(669198);
}

var gps_utm_indian = Ext.create("Ext.form.Panel",{
    id: 'id_gps_utm_indian',
    frame: true,
    title: 'ตำแหน่งพิกัด GPS (UTM Indian 1975)',
    bodyStyle: 'padding:5px 5px 5px',
    items: [
        {
            xtype: 'fieldcontainer',
            hideLabel: true,
            layout: {
                type: 'hbox',
                padding:'5',
                pack:'center'
            },
            fieldDefaults: {
                labelAlign: 'top',
                margin: '0 5 0 0',
                labelWidth: 90,
                labelSeparator: ''
            },
            items: [
                {
                    xtype:'textfield',
                    fieldLabel: 'Easting:Meters',
                    id: 'utmei'
                }
                ,{
                    xtype: 'displayfield',
                    fieldLabel: '&nbsp;',
                    value: 'E'
                }
            ]
        }
        ,{
            xtype: 'fieldcontainer',
            hideLabel: true,
            layout: {
                type: 'hbox',
                padding:'5',
                pack:'center'
            },
            fieldDefaults: {
                labelAlign: 'top',
                margin: '0 5 0 0',
                labelWidth: 90,
                labelSeparator: ''
            },
            items: [
                {
                    xtype:'textfield',
                    fieldLabel: 'Easting:Meters',
                    id: 'utmni'
                }
                ,{
                    xtype: 'displayfield',
                    fieldLabel: '&nbsp;',
                    value: 'N'
                }
            ]
        }
        ,{
        xtype: 'fieldcontainer',
        hideLabel: true,
        layout: {
            type: 'hbox',
            padding:'5',
            pack:'center'
        },
        fieldDefaults: {
            labelAlign: 'top',
            margin: '0 40 0 0',
            labelWidth: 90,
            labelSeparator: ''
        },
        items: [
            {
                xtype: 'radio',
                id: 'zone47i',
                name: 'zonei',
                fieldLabel: 'Zone 47',
                checked: true,
            }
            ,{
                xtype: 'radio',
                id: 'zone48i',
                name: 'zonei',
                fieldLabel: 'Zone 48',
            }
        ]
    }
        ,{
            xtype: 'fieldcontainer',
            layout: {
                type: 'hbox',
                padding:'5',
                pack:'center'
            },
            fieldDefaults: {
                labelSeparator: '',
                labelAlign: 'top',
                margin: '0 5 0 0'
            },
            items: [
                {
                    xtype: "button",
                    text: 'Check',
                    handler: check_gps_utm_indian,
                    width: 80
                }
                ,{
                    xtype: "button",
                    text: 'Clear',
                    handler: function(){
                      gps_utm_indian.getForm().reset();
                      markers.clearMarkers();
                    },
                    width: 80
                }
                ,{
                    xtype: "button",
                    text: 'Test',
                    handler: test_gps_utm_indian,
                    width: 80
                }
            ]
        }
    ]

});

/////////////////////////////////
// SEARCH
///////////////////////////////
var search_query = function(){
  var query = Ext.getCmp('id_query').getValue();        
  search(query);
}

var search = function(query) {
  //debugger;
  Ext.Ajax.request({
    url: 'rb/search-googlex.rb'
    ,params: {
      method: 'GET'
      ,query: query
      ,exact: 1
    }
    ,success: function(response, opts){
      // var data = eval( '(' + response.responseText + ')' );
      // No response from IE

      var data = Ext.decode(response.responseText);
      var gid = data.records[0].loc_gid;
      var text = data.records[0].loc_text;
      var table = data.records[0].loc_table;
      var lon = parseFloat(data.records[0].lon).toFixed(2);
      var lat = parseFloat(data.records[0].lat).toFixed(2);
      var zoom = 14;

      var p1 = new OpenLayers.LonLat(lon,lat);
      var p2 = p1.transform(gcs,merc);

      if (text)
      {
        map.setLayerIndex(markers, 0);
        map.setLayerIndex(hili, 0);
        if (text.indexOf("จ.") == 0) {
          map.setLayerIndex(hili, 99);
          zoom = 8;
        }
        else if (text.indexOf("อ.") == 0) {
          map.setLayerIndex(hili, 99);
          zoom = 10;
        }
        else if (text.indexOf("ต.") == 0) {
          map.setLayerIndex(hili, 99);
          zoom = 12;
        }
        else {
          zoom = 14;
          map.setLayerIndex(markers, 99);
          setMarker(lon, lat, text);
        }
      }

      map.setCenter(p2, zoom);

      //var size = new OpenLayers.Size(21,25);
      //var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
      //var icon = new OpenLayers.Icon('http://www.google.com/mapfiles/marker.png', size, offset);
      //markers.clearMarkers();
      //markers.addMarker(new OpenLayers.Marker(p2,icon));

      Ext.Msg.alert('Result',text + '<br>lat:' + lat + ' lon:' + lon);
      if (text.search(/จ./) == 0 || text.search(/อ./) == 0 || text.search(/ต./) == 0 || text.search(/บ้าน/) == 0)
      {
        hili.setOpacity(.5);
        //addWKT(table, gid);
      }
    }
 });
};

function addWKT(table, gid){
  var url = "rb/getPolygonWKT.rb?table=" + table + "&gid=" + gid;   
  OpenLayers.loadURL(url, '', this, function(response) {
    geom = response.responseText;
    addWKTFeatures(geom);
  });
}
 
function addWKTFeatures(wktString){
  wkt = new OpenLayers.Format.WKT();
  features = wkt.read(wktString);
  var bounds;
  if(features) {
    if(features.constructor != Array) {
      features = [features];
    }
    for(var i=0; i<features.length; ++i) {
      if (!bounds) {
        bounds = features[i].geometry.getBounds();
        bounds = bounds.transform(gcs, merc);
      } else {
        bounds.extend(features[i].geometry.getBounds().transform(gcs,merc));
      }
    }
  }
  vectorLayer.removeFeatures;
  vectorLayer.addFeatures(features[0].geometry.transform(gcs, merc));
  map.zoomToExtent(bounds);
}

var myTextField = Ext.create("GeoExt.ux.QryComboBox",{
  id: 'id_query'
  ,fieldLabel: 'ค้นหา'
  ,labelSeparator: ':'
  ,labelWidth: 50
  ,fieldStore: ['loc_table','loc_gid','loc_text']
  ,hiddenField: ['loc_table','loc_gid']
  ,displayField: 'loc_text'
  ,urlStore: 'rb/search-googlex.rb'
  ,width: '110'
  ,minListWidth: '300'
  ,anchor: '95%'
});


myTextField.on({
    select: {fn: function(){Ext.getCmp("btn_search").enable();}, scope: this}
});


myTextField.on("specialkey", specialKey, this);

function specialKey(field, e) {
  if ( e.getKey() == e.RETURN || e.getKey() == e.ENTER ) {
    search_query();
  }
}

var searchquery = Ext.create("Ext.form.Panel",{
  id: 'id_searchquery',
  labelAlign: 'left',
  align: 'center',
  frame: true,
  title: 'ค้นหาสถานที่',
  bodyStyle: 'padding:5px 5px 5px',
  width: 300,
  items: [{
    layout: 'form'
    ,labelWidth: 30
    ,items: [ myTextField ]
    ,bodyCfg: {tag: 'center'}
    ,frame: true
    ,buttons: [{
      text: 'Search'
      ,id: 'btn_search'
      ,handler: search_query
      ,disabled: true
    },{
      text: 'Clear'
      ,handler: function(){
        searchquery.getForm().reset();
        markers.clearMarkers();
        hili.setOpacity(0);
        Ext.getCmp('id_query').focus();
        Ext.getCmp('btn_search').disable();
      }
    }]
  }]
});