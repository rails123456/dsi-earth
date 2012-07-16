Ext.require([
    'Ext.container.Viewport',
    'Ext.layout.container.Border',
    'GeoExt.tree.Panel',
    'Ext.tree.plugin.TreeViewDragDrop',
    'GeoExt.panel.Map',
    'GeoExt.tree.OverlayLayerContainer',
    'GeoExt.tree.BaseLayerContainer',
    'GeoExt.data.LayerTreeModel',
    'GeoExt.tree.View',
    'GeoExt.tree.Column',
    'GeoExt.ux.GoogleEarthPanel',
    'GeoExt.ux.GoogleEarthClick'
]);

Ext.application({
    name: 'Tree',
    launch: function() {      
        
        
	// DSI location
        var center = new OpenLayers.LonLat(100.5657899,13.89071588);
        var dsi = center.transform(gcs,merc);
        
        var ctrl = new OpenLayers.Control.NavigationHistory();
        
        map = new OpenLayers.Map({
            projection: new OpenLayers.Projection("EPSG:900913"),
            displayProjection: new OpenLayers.Projection("EPSG:4326"),
            units: "m",
            maxResolution: 156543.0339,
            maxExtent: new OpenLayers.Bounds(-20037508.34, -20037508.34,20037508.34, 20037508.34),
            controls: [
                new OpenLayers.Control.PanZoomBar(),
                new OpenLayers.Control.MousePosition(),
                new OpenLayers.Control.Navigation(),
                new OpenLayers.Control.LayerSwitcher(),
                new OpenLayers.Control.Graticule(),
                new OpenLayers.Control.OverviewMap(),
                new OpenLayers.Control.ScaleLine({geodesic: true}),
                ctrl
            ]
        });

        vectorLayer = new OpenLayers.Layer.Vector("vector", {
            displayInLayerSwitcher: true,
            hideIntree: true
        });
        
        markers = new OpenLayers.Layer.Markers( "Markers", {
            displayInLayerSwitcher: true,
            hideIntree: true
        });
        
        hili = new OpenLayers.Layer.WMS("Hili",
            "http://203.151.201.129/cgi-bin/mapserv",
            {map: '/ms603/map/hili.map', layers: 'hili', 'transparent': true},
            {isBaseLayer: false, displayInLayerSwitcher: true, singleTile: true, ratio: 1,hideIntree: true }
        );

          
        hili.setOpacity(0);
        
        
        var toolbarItems = [],action;
      
        action = Ext.create('GeoExt.Action',{
            iconCls: 'zoomfull',
            handler: function(){
              map.setCenter(dsi, 6);
            },
            tooltip: 'Zoom to DSI'
        });
        
        toolbarItems.push(Ext.create('Ext.button.Button', action));
        toolbarItems.push("-");
 
        action = Ext.create('GeoExt.Action',{
            control: new OpenLayers.Control.ZoomBox(),
            tooltip: 'Zoom in: click in the map or use the left mouse button and drag to create a rectangle',
            map: map,
            iconCls: 'zoomin',
            toggleGroup: 'map'
        });
        
        toolbarItems.push(Ext.create('Ext.button.Button', action));
           
        action = Ext.create('GeoExt.Action',{
            control: new OpenLayers.Control.ZoomBox({
                out: true
            }),
            tooltip: 'Zoom out: click in the map or use the left mouse button and drag to create a rectangle',
            map: map,
            iconCls: 'zoomout',
            toggleGroup: 'map'
        });
        
        toolbarItems.push(Ext.create('Ext.button.Button', action));
             
        action = Ext.create('GeoExt.Action',{
            control: new OpenLayers.Control.DragPan({
                isDefault: true
            }),
            tooltip: 'Pan map: keep the left mouse button pressed and drag the map',
            map: map,
            iconCls: 'pan',
            toggleGroup: 'map'
        });
        
        toolbarItems.push(Ext.create('Ext.button.Button', action));
        toolbarItems.push("-");
        
            
        action = Ext.create('GeoExt.Action',{
            control: new OpenLayers.Control.DrawFeature(vectorLayer, OpenLayers.Handler.Point),
            tooltip: 'Draw a point on the map',
            map: map,
            iconCls: 'drawpoint',
            toggleGroup: 'map'
        });
        
        toolbarItems.push(Ext.create('Ext.button.Button', action));
        
        action = Ext.create('GeoExt.Action',{
            control: new OpenLayers.Control.DrawFeature(vectorLayer, OpenLayers.Handler.Path),
            tooltip: 'Draw a linestring on the map',
            map: map,
            iconCls: 'drawline',
            toggleGroup: 'map'
        });
        
        toolbarItems.push(Ext.create('Ext.button.Button', action));
        
        action = Ext.create('GeoExt.Action',{
            control: new OpenLayers.Control.DrawFeature(vectorLayer, OpenLayers.Handler.Polygon),
            tooltip: 'Draw a polygon on the map',
            map: map,
            iconCls: 'drawpolygon',
            toggleGroup: 'map'
        });
        
        toolbarItems.push(Ext.create('Ext.button.Button', action));
        toolbarItems.push("-");
        
        action = Ext.create('GeoExt.Action',{
            control: new OpenLayers.Control.ModifyFeature(vectorLayer),
            tooltip: 'Edit a feature on the map',
            map: map,
            iconCls: 'modifyfeature',
            toggleGroup: 'map'
        });
        
        toolbarItems.push(Ext.create('Ext.button.Button', action));
        
        
        action = Ext.create('GeoExt.Action',{
            control: new OpenLayers.Control.SelectFeature(vectorLayer),
            tooltip: 'Remove a feature on the map',
            map: map,
            iconCls: 'removefeature',
            toggleGroup: 'map',
            handler: function() {
              if (vectorLayer.features)
                vectorLayer.removeFeatures(vectorLayer.features);
            }
        });
        
        toolbarItems.push(Ext.create('Ext.button.Button', action));
        
        action = Ext.create('GeoExt.Action',{
            control: new OpenLayers.Control.SelectFeature(vectorLayer),
            tooltip: 'Show info. when click!',
            map: map,
            iconCls: 'info',
            toggleGroup: 'map',
            handler: function(){
              //selectControl.activate();
              if (vectorLayer.features.length == 1) {
                lon = vectorLayer.features[0].geometry.x;
                lat = vectorLayer.features[0].geometry.y;
                var pt = new OpenLayers.LonLat(lon,lat);
                pt.transform(merc, gcs);
                lon = pt.lon;
                lat = pt.lat;
                var img_url = 'http://maps.googleapis.com/maps/api/streetview?size=400x400&location=' + lat + ',' + lon;
                img_url += '&sensor=false&key=AIzaSyC4JHEDJv-4kV39bU2XTpcoe-05rqvGNAk';

                var html = "<center><img src='" + img_url + "' /></center>";

                Ext.create("Ext.window.Window", {
                  title: "Google Street View",
                  width: 450,
                  height: 450,
                  layout: 'fit',
                  closable: true,
                  html: html
                }).show();
              }
              else
                return false;
            }
        });
        
        toolbarItems.push(Ext.create('Ext.button.Button', action));
        toolbarItems.push("-");
        
        action = Ext.create('GeoExt.Action',{
           tooltip: "Previous view",
           control: ctrl.previous,
           iconCls: 'back',
           disabled: true
        });
        
        toolbarItems.push(Ext.create('Ext.button.Button', action));
        
        action = Ext.create('GeoExt.Action',{
            tooltip: "Next view",
            control: ctrl.next,
            iconCls: 'next',
            disabled: true
        });

        toolbarItems.push(Ext.create('Ext.button.Button', action));
        toolbarItems.push("-");
        
        mapPanel = Ext.create('GeoExt.panel.Map', {
            border: true,
            region: "center",
            map: map,
            center: dsi,
            zoom: 6,
            layers: [
                new OpenLayers.Layer.Google(
                    "Google Hybrid",
                    {type: google.maps.MapTypeId.HYBRID, numZoomLevels: 20,sphericalMercator: true}
                ),
                new OpenLayers.Layer.Google(
                    "Google Physical",
                    {type: google.maps.MapTypeId.TERRAIN,sphericalMercator: true}
                ),
                new OpenLayers.Layer.WMS(
                  "เขตอุทยานแห่งชาติ",
                  "http://203.151.201.129/cgi-bin/mapserv",
                  {map: '/ms603/map/wms-dsi.map', layers: 'npark', transparent: true},
                  {isBaseLayer: false,visibility: false}
                ),
                new OpenLayers.Layer.WMS(
                  "เขตป่าสงวน",
                  "http://203.151.201.129/cgi-bin/mapserv",
                  {map: '/ms603/map/wms-dsi.map', layers: 'rforest', transparent: true},
                  {isBaseLayer: false,visibility: false}
                ),
                new OpenLayers.Layer.WMS(
                  "ชั้นความสูง",
                  "http://203.151.201.129/cgi-bin/mapserv",
                  {map: '/ms603/map/wms-dsi.map', layers: 'contour', transparent: true},
                  {isBaseLayer: false,visibility: false}
                ),
                new OpenLayers.Layer.WMS(
                  "จังหวัด",
                  "http://203.151.201.129/cgi-bin/mapserv",
                  {map: '/ms603/map/wms-dsi.map', layers: 'no_02_province', transparent: true},
                  {isBaseLayer: false,visibility: false}
                ),
                new OpenLayers.Layer.WMS(
                  "อำเภอ",
                  "http://203.151.201.129/cgi-bin/mapserv",
                  {map: '/ms603/map/wms-dsi.map', layers: 'no_03_amphoe', transparent: true},
                  {isBaseLayer: false,visibility: false}
                ),
                new OpenLayers.Layer.WMS(
                  "ตำบล",
                  "http://203.151.201.129/cgi-bin/mapserv",
                  {map: '/ms603/map/wms-dsi.map', layers: 'no_04_tambon', transparent: true},
                  {isBaseLayer: false,visibility: false}
                ),
                new OpenLayers.Layer.WMS(
                  "หมู่บ้าน",
                  "http://203.151.201.129/cgi-bin/mapserv",
                  {map: '/ms603/map/wms-dsi.map', layers: 'no_06_muban', transparent: true},
                  {isBaseLayer: false,visibility: false}
                ),
                new OpenLayers.Layer.WMS(
                  "ธรณีวิทยา",
                  "http://203.151.201.129/cgi-bin/mapserv",
                  {map: '/ms603/map/wms-dsi.map', layers: 'no_13_geology', transparent: true},
                  {isBaseLayer: false,visibility: false}
                ),
                new OpenLayers.Layer.WMS(
                  "แหล่งแร่",
                  "http://203.151.201.129/cgi-bin/mapserv",
                  {map: '/ms603/map/wms-dsi.map', layers: 'no_14_mineral', transparent: true},
                  {isBaseLayer: false,visibility: false}
                ),
                new OpenLayers.Layer.WMS(
                  "พื้นที่สปก.",
                  "http://203.151.201.129/cgi-bin/mapserv",
                  {map: '/ms603/map/wms-dsi.map', layers: 'no_22_spk', transparent: true},
                  {isBaseLayer: false,visibility: false}
                ),
                vectorLayer,
                markers,
                hili
            ],
            dockedItems: [{
                xtype: 'toolbar',
                dock: 'top',
                items: toolbarItems
            }]
        });

        overlay = Ext.create('GeoExt.tree.OverlayLayerContainer',{
            loader: {
                filter: function(record) {
                    var layer = record.getLayer();
                    if (layer.hideIntree || layer.displayInLayerSwitcher == false){
                        return false;
                    }
                    else {
                        return !(layer.displayInLayerSwitcher === true &&
                            layer.isBaseLayer === true); 
                    }
                    
                }
            }
        });


        store = Ext.create('Ext.data.TreeStore', {
            model: 'GeoExt.data.LayerTreeModel',
            root: {
                expanded: true,
                children: [
                    {
                        plugins: ['gx_baselayercontainer'],
                        expanded: true,
                        text: "Base Maps"
                    }, {
                        plugins: [overlay],
                        expanded: true
                    }
                ]
            }
        });
        ///////////////////////////////////
        //  TREE
        ///////////////////////////////////
        tree = Ext.create('GeoExt.tree.Panel', {
            border: true,
            title: "เลือกชั้นข้อมูล",
            width: 250,
            split: true,
            collapsible: true,
            autoScroll: true,
            store: store,
            rootVisible: true,
            lines: false
        });
        
        panel_west = Ext.create("Ext.Panel",{
            region: 'west',
            title: '',
            width: 270,
            border: true,
            margins: '5 0 0 5',
            frame: false,
            split: true,
            layout: 'accordion',
            items: [
                tree,gps,gps_utm,gps_utm_indian,searchquery
            ]
        })
        
        earth = Ext.create('Ext.Panel', {
            region: 'east'
            ,width: 400
            ,layout: 'fit'
            ,collapsible: true
            ,items: [
                {
                    xtype: 'gxux_googleearthpanel',
                    id: 'googleEarthPanelItem',
                    map: map,
                    altitude: 50,
                    heading: 190,
                    tilt: 90,
                    range: 75
                }
            ]
        });
        

        Ext.create('Ext.Viewport', {
            layout: 'fit',
            hideBorders: true,
            items: {
                layout: 'border',
                deferredRender: false,
                items: [mapPanel, panel_west, earth]
            }
        });
    }
});
