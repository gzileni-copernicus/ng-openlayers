import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MapComponent } from '@ol/map/map.component'
import { MapService } from '@ol/map.service'

@NgModule({
  declarations: [
    MapComponent
  ],
  providers: [
    MapService
  ],
  imports: [
    CommonModule
  ],
  exports: [
    MapComponent
  ]
})
export class NgOpenlayersModule { }
