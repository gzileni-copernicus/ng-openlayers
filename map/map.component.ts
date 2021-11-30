import { Component, OnInit, ElementRef, ViewChild, OnDestroy, EventEmitter, Output } from '@angular/core';
import { MapService } from '@ol/map.service';

import { fromEvent } from 'rxjs';

@Component({
  selector: 'map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit, OnDestroy {

  @Output() mapMoveStart = new EventEmitter<void>();

  @ViewChild('mapRef', { static: true })
  mapElement!: ElementRef;

  constructor(private mapSvc: MapService) {}

  ngOnInit(): void {

    fromEvent(window, 'resize').subscribe(() => {
      this.mapSvc.resize();
    });

    this.mapSvc.mapMoveStart.subscribe(() => {
      this.mapMoveStart.emit();
    })

    this.mapSvc.geolocation_position.subscribe(pos => {
      console.log('position: ' + pos);
      this.mapSvc.moveTo(pos);
    });

    this.mapSvc.geolocation_error.subscribe(error => {
      console.log('error: ' + error);
    });

    this.mapSvc.geolocation_change.subscribe(result => {
      console.log(JSON.stringify(result));
    });

  }

  ngAfterViewInit(): void {
    this.mapSvc.init(this.mapElement.nativeElement);
    this.mapSvc.enableGeolocation(true);
  }

  /** enable/disable geolocation */
  ngOnDestroy(): void {}

  /** zoomin to map */
  public onZoomIn() {
    this.mapSvc.zoomIn();
  }

  /** zoomout on the map */
  public onZoomOut() {
    this.mapSvc.zoomOut();
  }

}
