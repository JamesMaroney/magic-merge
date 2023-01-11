import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { WorkSheet } from "xlsx";

@Injectable({providedIn: 'root'})
export class AppService {

  worksheet = new BehaviorSubject<WorkSheet | null>(null);
  template = new BehaviorSubject<string>('');

  setData(ws: WorkSheet){
    this.worksheet.next(ws);
  }

  setTemplate(template: string){
    this.template.next(template);
  }
}