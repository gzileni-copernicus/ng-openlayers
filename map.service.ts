import { Injectable, EventEmitter } from '@angular/core';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import Feature from 'ol/Feature';
import Geolocation from 'ol/Geolocation';
import Point from 'ol/geom/Point';
import { Circle as CircleStyle, Fill, Stroke, Style, Icon } from 'ol/style';
import MultiPoint from 'ol/geom/MultiPoint';
import { Vector as VectorSource } from 'ol/source';
import { Vector as VectorLayer } from 'ol/layer';
import _ from 'lodash';
import { Subject } from 'rxjs';
import * as turf from '@turf/turf'

const GEO_ICON = 'assets/img/dot_orange.png';
const _ZOOMDEFAULT_ = 14;

export interface GeolocationResult {
  accuracy: string;
  altitude: string;
  altitudeAccuracy: string;
  heading: string;
  speed: string;
};

@Injectable({
  providedIn: 'root'
})
export class MapService {

  public geolocation_change = new EventEmitter<any>();
  public geolocation_error = new EventEmitter<string>();
  public geolocation_position = new EventEmitter<any>();

  protected _mapMoveStart = new Subject<void>();
  public mapMoveStart = this._mapMoveStart.asObservable();

  geolocation_result: GeolocationResult = {
    accuracy: '',
    altitude: '',
    altitudeAccuracy: '',
    heading: '',
    speed: ''
  };

  layerGeolocation!: any;
  sourceGeolocation!: any;
  isGeolocation: boolean = false;

  center: Array<number> = [0,0];
  map : Map = new Map({});

  view: View = new View({
    center: [0, 0],
    zoom: _ZOOMDEFAULT_
  });

  geolocation: Geolocation = new Geolocation({});
  coordinates: any = null;

  bboxLayer!: any;

  public icon_source: any;
  public icon_layer: any;
  public icon_style!: Style;
  public icon_icon!: Icon;
  public icon_feature: any;

  constructor() {}

  /**
   * resize map
   */
  public resize() {
    this.map.updateSize();
  }

  /**
   * initialize map
   */
  public init(target: any, center?: Array<number>, zoom?: number): void {

    this._setView(center, zoom);

    const key = 'hbIcHQEqGTLXws9lh3uW';
    const attributions =
      '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> ' +
      '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>';

    const raster = new TileLayer({
      source: new XYZ({
        attributions: attributions,
        url: 'https://api.maptiler.com/tiles/satellite/{z}/{x}/{y}.jpg?key=' + key,
        maxZoom: 20,
      }),
    });

    this.map = new Map({
      controls: [],
      target: target,
      layers: [raster],
      view: this.view
    });

    this.map.on('movestart', () => {
      this._mapMoveStart.next()
    })

    this._initGeolocation();

  }

  /**
   *
   */
  public get extent(): any {
    return this.view.calculateExtent(this.map.getSize());
  }

  /**
   *
   */
  public resetExtentCoordinates(): void {
    if (this.bboxLayer != null || this.bboxLayer != undefined) {
      this.map.removeLayer(this.bboxLayer);
    }
  }


  private _createLayerIcon(visible?: boolean) {

    /** Creazione dell'immagine per il radar */
    this.icon_icon = new Icon({
      src: GEO_ICON,
      opacity: 0.7
    });
    this.icon_style = new Style({ image: this.icon_icon });

    /** Aggiunta dell'icona alla feature */
    this.icon_feature = new Feature();
    this.icon_feature.setStyle(this.icon_style);

    this.icon_source = new VectorSource({ features: [this.icon_feature] });
    this.icon_layer = new VectorLayer({
      source: this.icon_source,
      zIndex: _.size(this.map.getLayers()) + 1
    });

    /** Aggiunta del layer alla mappa */
    this.map.addLayer(this.icon_layer);

    if (visible != null && visible != undefined) {
      this.icon_layer.setVisible(visible);
    }

  }

  private _setVisibleIconLayer(visible: boolean) {
    if (this.icon_layer != null && this.icon_layer != undefined) {
      this.icon_layer.setVisible(visible);
    }
  }

  private _removeLayerIcon() {
    if (this.icon_layer != null && this.icon_layer != undefined) {
      this.icon_source.clear();
      this.map.removeLayer(this.icon_layer);
    }
  }

  /**
   * upgrade new position and rotation radar
   * @param position coordinates
   * @param rotation radians rotation
   */
  public newPositionIcon(position: Array<number>, rotation: number) {
    if (this.icon_feature != null && this.icon_feature != undefined) {
      /** Spostamento dell'immagine radar in osm */
      this.icon_feature.setGeometry(new Point([position[0], position[1]]));
      /** Rotazione dell'immagine radar in radianti */
      this.icon_icon.setRotation(rotation);
    }
  }

  /**
   *
   */
  public get extentPolygon(): any {
    const geom: any = turf.bboxPolygon(this.extent);
    const coordinates: Array<string> = _.map(geom.geometry.coordinates[0], (coords: Array<number>) => {
      return coords.join(' ')
    });
    return coordinates.join();
  }

  /**
   * set view map
   */
  private _setView(center?: Array<number>, zoom?: number) {

    let centerPos: Array<number> = [0,0];
    let zoomLevel: number = _ZOOMDEFAULT_;

    if (center != null && center != undefined) {
        centerPos = center;
    };

    if (zoom != null && zoom != undefined) {
      zoomLevel = zoom
    };

    this.view = new View({
      center: centerPos,
      projection: 'EPSG:4326',
      zoom: zoomLevel
    })
  }

  /**
   * setupo geolocation
   */
  private _initGeolocation() {

    this._createLayerIcon(false);

    this.geolocation = new Geolocation({
      /** enableHighAccuracy must be set to true to have the heading value. */
      trackingOptions: {
        enableHighAccuracy: true,
      },
      projection: this.view.getProjection(),
    });

    /** geolocation events */
    this.geolocation.on('change', () => {
      this.geolocation_result = {
          accuracy: this._getGeolocationValue(this.geolocation.getAccuracy(), 'm'),
          altitude: this._getGeolocationValue(this.geolocation.getAltitude(), 'm'),
          altitudeAccuracy: this._getGeolocationValue(this.geolocation.getAltitudeAccuracy(), 'm'),
          heading: this._getGeolocationValue(this.geolocation.getHeading(), 'rad'),
          speed: this._getGeolocationValue(this.geolocation.getSpeed(), 'm/s')
      };
      this.geolocation_change.emit(this.geolocation_result);
    });

    /** change position */
    this.geolocation.on('change:position', () => {
      this.coordinates = this.geolocation.getPosition();
      if (this.coordinates != null && this.coordinates != undefined) {
        // const newPoint: Point = new Point(this.coordinates);
        this.newPositionIcon(this.coordinates, 0)
        this.geolocation_position.emit(this.coordinates);
      }
    });

    /** handle geolocation error. */
    this.geolocation.on('error', (error: any) => {
      this.geolocation_error.emit(error.message);
    });

  }

  private _getGeolocationValue(value: any, um: any): string {
    return value == null || value == undefined ? '' : `${value} [${um}]`;
  }

  /**
   * move mao to coordinates
   * @param coords
   */
  public moveTo(coords: any): void {
    this.view.setCenter(coords);
  }

  /**
   * enable geolocation
   * @param enable
   */
  public enableGeolocation(enable: boolean) {
    this.isGeolocation = enable;
    this.geolocation.setTracking(enable);
    this._setVisibleIconLayer(enable);
  }

  /**
   * get current map zoom
   * @returns
   */
  public get zoom(): any {
    return this.view.getZoom();
  }

  /**
   * Zoom In
   */
  public zoomIn() {
    this.view.animate({
      zoom: this.zoom + 1,
      duration: 500,
    });
  }

  /**
   * Zoom Out
   */
  public zoomOut() {
    this.view.animate({
      zoom: this.zoom - 1,
      duration: 500,
    });
  }

}
