import { Component, ElementRef, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { BehaviorSubject, combineLatest, filter, map, take, tap } from 'rxjs';
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
  // replace html entities for left/right angle quotes for more readable regexes below
  template = template.replace( /&laquo;/gm, '«');
  template = template.replace( /&raquo;/gm, '»');

  // template = template.replace( /<\/?mark( contenteditable="false")?>/g, '');

  // escaped newlines and whitespace
  template = template.replace( /«(\s*(&nbsp;)*\s*)*/g, '«');
  template = template.replace( /(\s*(&nbsp;)*\s*)*»/g, '»');
  template = template.replace( /«((\s*(&nbsp;)*\s*)*<br>(\s*(&nbsp;)*\s*)*)*»/gm, '');

  // conditionals
  template = template.replace(
    /«If\((?:'|"|«)?(.*?)(?:'|"|»)? ?(=|==|EQ|!=|NEQ) ?(.*?)\)»(.*?)(?:«Else»(.*?))?«End\(If\)»/g,
    (_, field, fn, val, content, altContent = '') => {
      val = val.slice(1, val.length - 1);
      return fns[fn]( context[field], val) ? content : altContent;
    }
  );
  template = template.replace(
    /«If\((.*?) ?(=|==|EQ|!=|NEQ) ?(.*?)\)»(.*?)«End\(If\)»/g, 
    (_, field, fn, val, content) => {
      val = val.slice(1, val.length - 1);
      return fns[fn]( context[field], val) ? content : '';
    }
  );
  
  // field references
  template = template.replace(/«(.*?)»/g, (match, name: string) => {
    return name in context ? `${context[name]}` : match;
  })

  // trim
  template = template.replace(
    /«Trim\((.*?)\)»(.*?)«End\(Trim\)»/g, 
    (_, chars, content) => {
      return content.replace(new RegExp(`(${chars})+$`, 'g'), '');
    }
  );
  
  return template
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

  @ViewChild('outputContainer')
  outputContainer!: ElementRef<Element>;

  copied$ = new BehaviorSubject(false);

  output$ = combineLatest([
    this.appSvc.worksheet,
    this.appSvc.template
  ]).pipe(
    filter( ([ws, _]) => ws != undefined),
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
    window.getSelection()?.selectAllChildren(
      this.outputContainer.nativeElement
    );
    document.execCommand("copy");
    window.getSelection()?.empty();
    this.copied$.next(true);
    window.setTimeout(() => this.copied$.next(false), 3000);
  }

}
