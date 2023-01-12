import { Injectable } from "@angular/core";
import { BehaviorSubject, filter, map, startWith } from "rxjs";
import { isNotNull } from "src/utils";
import { WorkSheet } from "xlsx";

@Injectable({providedIn: 'root'})
export class AppService {

  worksheet = new BehaviorSubject<WorkSheet | null>(null);
  template = new BehaviorSubject<string>('');

  columns$ = this.worksheet.pipe(
    map( ws => ws?.['!data']?.[0].map(c => `${c.v}`))
  )

  setData(ws: WorkSheet){
    this.worksheet.next(ws);
  }

  setTemplate(template: string){
    this.template.next(template);
  }
}