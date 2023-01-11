import { Component } from '@angular/core';
import { filter, map } from 'rxjs';
import { AppService } from 'src/app/app.service';
import { read, utils } from 'xlsx';

function isNotNull<T>(o: T|null): o is T {
  return o !== null;
}

@Component({
  selector: 'importer',
  templateUrl: './importer.component.html',
  styleUrls: ['./importer.component.scss']
})
export class ImporterComponent {

  constructor( public appSvc: AppService ){}

  preview$ = this.appSvc.worksheet.pipe(
    filter( isNotNull ),
    map( ws => utils.sheet_to_html(ws, {header: ''}))
  )

  async onChooseFile(event: Event){
    const element = event.currentTarget as HTMLInputElement;
    const file = element.files?.[0];
    if (file) {
      /* get data as an ArrayBuffer */
      const data = await file.arrayBuffer();

      /* parse and load first worksheet */
      const wb = read(data, {dense: true});
      const ws = wb.Sheets[wb.SheetNames[0]];
      this.appSvc.setData(ws);
    }
  }
}
