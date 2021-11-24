import { Injectable, EventEmitter } from '@angular/core';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import Feature from 'ol/Feature';
import Geolocation from 'ol/Geolocation';
import Point from 'ol/geom/Point';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import { Vector as VectorSource } from 'ol/source';
import { Vector as VectorLayer } from 'ol/layer';

import { Subject } from 'rxjs';

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

  geolocation_result: GeolocationResult = {
    accuracy: '',
    altitude: '',
    altitudeAccuracy: '',
    heading: '',
    speed: ''
  };

  _ZOOMDEFAULT_: number = 7

  layerGeolocation!: any;
  sourceGeolocation!: any;
  isGeolocation: boolean = false;

  center: Array<number> = [0,0];
  map : Map = new Map({});

  view: View = new View({
    center: [0, 0],
    zoom: this._ZOOMDEFAULT_
  });

  geolocation = new Geolocation({});
  coordinates: any = null;

  positionFeature!: any;
  accuracyFeature!: any;

  public geolocationSubject: any = new Subject();
  public heighSubject: any = new Subject();

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
    this._setGeoLocation();

    this.map = new Map({
      controls: [],
      target: target,
      layers: [
        new TileLayer({
          source: new OSM()
        })
      ],
      view: this.view
    });

  }

  /**
   * set position cursor point
   */
  private _setPositionPoint(): void {
    this.positionFeature.setStyle(
      new Style({
        image: new CircleStyle({
          radius: 6,
          fill: new Fill({
            color: '#3399CC',
          }),
          stroke: new Stroke({
            color: '#fff',
            width: 2,
          }),
        }),
      })
    );
  }

  /**
   * set view map
   */
  private _setView(center?: Array<number>, zoom?: number) {

    let centerPos: Array<number> = [0,0];
    let zoomLevel: number = this._ZOOMDEFAULT_;

    if (center != null && center != undefined) {
        centerPos = center;
    };

    if (zoom != null && zoom != undefined) {
      zoomLevel = zoom
    };

    this.view = new View({
      center: centerPos,
      zoom: zoomLevel
    })
  }

  /**
   * setup layer geolocation
   */
  private _setLayerGeolocation() {

    this.sourceGeolocation = new VectorSource({
      features: [this.accuracyFeature, this.positionFeature],
    });

    this.layerGeolocation = new VectorLayer({
      map: this.map,
      source: this.sourceGeolocation,
    });

  }

  /**
   *
   */
  private _setGeoLocation() {

    this.geolocation = new Geolocation({
      /** enableHighAccuracy must be set to true to have the heading value. */
      trackingOptions: {
        enableHighAccuracy: true,
      },
      projection: this.view.getProjection(),
    });

    this._setPositionPoint();
    this._setGeolocationEvents();
    this._setLayerGeolocation();
  }

  /**
   * initialization events geolocation
   */
  private _setGeolocationEvents() {

    this.geolocation.on('change', () => {
      this.geolocation_result = {
          accuracy: this.geolocation.getAccuracy() + ' [m]',
          altitude: this.geolocation.getAltitude() + ' [m]',
          altitudeAccuracy: this.geolocation.getAltitudeAccuracy() + ' [m]',
          heading: this.geolocation.getHeading() + ' [rad]',
          speed: this.geolocation.getSpeed() + ' [m/s]'
      };
      this.geolocation_change.emit(this.geolocation_result);
    });

    this.geolocation.on('change:accuracyGeometry', () => {
      this.accuracyFeature.setGeometry(this.geolocation.getAccuracyGeometry());
    });

    /** change position */
    this.geolocation.on('change:position', () => {
      this.coordinates = this.geolocation.getPosition();
      if (this.coordinates != null && this.coordinates != undefined) {
        const newPoint: Point = new Point(this.coordinates);
        this.positionFeature.setGeometry(newPoint);
        this.geolocation_position.emit(this.coordinates);
      }
    });

    /** handle geolocation error. */
    this.geolocation.on('error', (error: any) => {
      this.geolocation_error.emit(error.message);
    });
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
