import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { EditorModule } from '@tinymce/tinymce-angular';

import { AppComponent } from './app.component';
import { ImporterComponent } from '../importer/importer.component';
import { OutputComponent } from '../output/output.component';
import { TemplateComponent } from '../template/template.component';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    AppComponent,
    ImporterComponent,
    OutputComponent,
    TemplateComponent
  ],
  imports: [
    BrowserModule,
    EditorModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
