import { Injectable } from "@angular/core";
import { BehaviorSubject, filter, map, share, startWith } from "rxjs";
import { isNotNull } from "src/utils";
import { WorkSheet } from "xlsx";

@Injectable({providedIn: 'root'})
export class AppService {

  worksheet = new BehaviorSubject<WorkSheet | null>(null);
  template = new BehaviorSubject<string>('');

  columns$ = new BehaviorSubject<string[]>([]); 

  constructor() {
    this.worksheet.pipe(
      map( ws => (ws?.['!data']?.[0].map(c => `${c.v}`)) || [])
    ).subscribe(this.columns$)
  }

  setData(ws: WorkSheet){
    this.worksheet.next(ws);
  }

  setTemplate(template: string){
    this.template.next(template);
  }
}