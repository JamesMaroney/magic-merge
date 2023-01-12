import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { lastValueFrom, map, Subscription, take, tap } from 'rxjs';
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

  setup = (editor: Editor) => {
    editor.ui.registry.addButton('field', {
      text: '«Field»',
      onAction: function () {
        const field = editor.selection.getContent() || 'Field';
        editor.insertContent(`«${field}»`);
      }
    });
    editor.ui.registry.addMenuButton('cond', {
      text: '«If()»',
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
    editor.ui.registry.addButton('trim', {
      text: '«Trim()»',
      tooltip: 'trim characters from the end of the contained content',
      onAction: function () {
        const content = editor.selection.getContent() || 'Content';
        editor.insertContent(`«Trim(Chars)»${content}«End(Trim)»`);
      }
    });
    editor.ui.registry.addButton('space', {
      text: '« »',
      tooltip: 'formatting space',
      onAction: function () {
        editor.insertContent(`«<br>»`);
      }
    });

    editor.ui.registry.addAutocompleter('codepoints', {
      ch: '<',
      minChars: 0,
      columns: 1,
      onAction: function (autocompleteApi, rng, value) {
        editor.selection.setRng(rng);
        editor.insertContent(value);
        autocompleteApi.hide();
      },
      fetch: (pattern) => {
        pattern = pattern.toLocaleLowerCase();
        return new Promise( resolve => {
          this.appSvc.columns$.pipe(
            take(1),
            map( cols => [
                  { text: '« »', value: `«<br>»` },
                  { text: '«If()»', value: `«If(Field = 'Value')»Content«End(If)»` },
                  { text: '«Trim()»', value: `«Trim(Chars)»Content«End(Trim)»` },
                  ...((cols || []).map( col => ({
                    value: `«${col}»`,
                    text: `«${col}»`,
                  })))
                ].filter( col => col.text.toLocaleLowerCase().includes(pattern))
            ),
            tap(config => resolve(config || []) ),
          ).subscribe();
        })
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
