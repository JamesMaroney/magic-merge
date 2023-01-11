import { Component } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { combineLatest, filter, map, take, tap } from 'rxjs';
import { AppService } from 'src/app/app.service';

// conditional functions
const fns: Record<string, (a: any, b: any) => boolean> = {
  'EQ': (a, b) => (a || '') == b,
  'NEQ': (a, b) => (a || '') != b
  // TOOD: implement more matchers
}
// fn aliases
fns['='] = fns['=='] = fns['EQ'];
fns['!='] = fns['NEQ'];

function formatRow(template: string, context: Record<string, unknown>){
  template = template.replace(
    /&laquo;If\((.*?) ?(=|==|EQ|!=|NEQ) ?(.*?)\)&raquo;(.*?)&laquo;End\(If\)&raquo;/g, 
    (_, field, fn, val, content) => {
      val = val.slice(1, val.length - 1);
      return fns[fn]( context[field], val) ? content : '';
    }
  );
  return template.replace(/&laquo;(.*?)&raquo;/g, (_, name: string) => {
    return name in context ? `${context[name]}` : `«${name}»`;
  })
}

@Component({
  selector: 'output',
  templateUrl: './output.component.html',
  styleUrls: ['./output.component.scss']
})
export class OutputComponent {

  constructor( 
    public appSvc: AppService,
    public domSanitizer: DomSanitizer
  ){}

  output$ = combineLatest([
    this.appSvc.worksheet,
    this.appSvc.template
  ]).pipe(
    filter( ([ws, template]) => !!ws && !!template),
    map( ([ws, template]) => {
      if(ws === null || ws['!data'] === undefined || template === null) return;
      const cols = ws['!data'][0].map(c => c.v);
      return ws['!data']
        .slice(1)
        .map( row => Object.fromEntries(cols.map( (col, i) => [col, row[i]?.v])))
        .map( row => formatRow(template, row) )
        .join('');
    }),
    map( html => this.domSanitizer.bypassSecurityTrustHtml(html || ''))
  )

  onCopy(){
    this.output$.pipe(
      take(1),
      tap( html => navigator.clipboard.writeText(''+html) )
    )
    
  }

}