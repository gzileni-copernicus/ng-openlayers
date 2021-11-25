import { Component, OnInit, ElementRef, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { MapService } from '@ol/map.service';

import { fromEvent } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit, OnDestroy {

  @ViewChild('mapRef', { static: true })
  mapElement!: ElementRef;

  constructor(private mapSvc: MapService) {}

  ngOnInit(): void {

    fromEvent(window, 'resize').subscribe(() => {
      this.mapSvc.resize();
    });

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

    this.mapSvc.geolocationSubject.subscribe((result: boolean) => {
      this.mapSvc.enableGeolocation(result);
    });

    this.mapSvc.heighSubject.subscribe((height: number) => {
      this.mapElement.nativeElement.style.height = `${height}px`;
      this.mapSvc.resize();
    })
  }

  ngAfterViewInit(): void {
    this.mapSvc.init(this.mapElement.nativeElement);
  }

  /** enable/disable geolocation */
  ngOnDestroy(): void {

  }

  /** zoomin to map */
  public onZoomIn() {
    this.mapSvc.zoomIn();
  }

  /** zoomout on the map */
  public onZoomOut() {
    this.mapSvc.zoomOut();
  }

}
