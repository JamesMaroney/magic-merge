import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AppService } from 'src/app/app.service';
import { Editor } from 'tinymce';

@Component({
  selector: 'template-editor',
  templateUrl: './template.component.html',
  styleUrls: ['./template.component.scss']
})
export class TemplateComponent implements OnInit, OnDestroy {

  formCtrl = new FormControl("");
  subscription: Subscription | null = null;

  constructor( public appSvc: AppService ){}

  setup(editor: Editor) {
    editor.ui.registry.addButton('field', {
      text: '«Field»',
      onAction: function () {
        const field = editor.selection.getContent() || 'Field';
        editor.insertContent(`«${field}»`);
      }
    });
    editor.ui.registry.addMenuButton('cond', {
      text: '«If»',
      fetch: function (callback) {
        callback([
          {
            type: 'menuitem',
            text: 'Equals',
            onAction: function (_) {
              const content = editor.selection.getContent() || 'Content';
              editor.insertContent(`«If(Field = \'Value\')»${content}«End(If)»`);
            }
          },
          {
            type: 'menuitem',
            text: 'Not Equal',
            onAction: function (_) {
              const content = editor.selection.getContent() || 'Content';
              editor.insertContent(`«If(Field != \'Value\')»${content}«End(If)»`);
            }
          }
        ]);
      }
    });
  }

  ngOnInit(){
    this.subscription = this.formCtrl.valueChanges.subscribe( val => this.appSvc.setTemplate(val || ''))
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }
}
