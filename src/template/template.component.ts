import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { map, Subscription, take, tap } from 'rxjs';
import { AppService } from 'src/app/app.service';
import { Editor } from 'tinymce';

const injectionText = {
  cond_eq: (content = 'Content') => `<mark>«If(Field = 'Value')»</mark>${content}<mark>«End(If)</mark><mark contenteditable="false">»</mark> `,
  cond_neq: (content = 'Content') => `<mark>«If(Field != 'Value')»</mark>${content}<mark>«End(If)</mark><mark contenteditable="false">»</mark> `,
  trim: (content = 'Content') => `<mark>«Trim(Chars)»</mark>${content}<mark>«End(Trim)</mark><mark contenteditable="false">»</mark> `,
  space: () => `<mark>«</mark><br><mark contenteditable="false">»</mark> `,
  field: (field = 'Field') => `<mark>«</mark>${field}<mark contenteditable="false">»</mark> ` 
}

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
      onAction: () => {
        const field = editor.selection.getContent() || undefined;
        editor.insertContent( injectionText.field(field) );
      },
    })
    editor.ui.registry.addMenuButton('cond', {
      text: '«If()»',
      fetch: (callback) => {
        callback([
          {
            type: 'menuitem',
            text: 'Equals',
            onAction: function (_) {
              const content = editor.selection.getContent() || undefined;
              editor.insertContent( injectionText.cond_eq(content) );
            }
          },
          {
            type: 'menuitem',
            text: 'Not Equal',
            onAction: function (_) {
              const content = editor.selection.getContent() || undefined;
              editor.insertContent( injectionText.cond_neq(content) );
            }
          }
        ]);
      }
    });
    editor.ui.registry.addButton('trim', {
      text: '«Trim()»',
      tooltip: 'trim characters from the end of the contained content',
      onAction: function () {
        const content = editor.selection.getContent() || undefined;
        editor.insertContent( injectionText.trim(content) );
      }
    });
    editor.ui.registry.addButton('space', {
      text: '« »',
      tooltip: 'formatting space',
      onAction: function () {
        editor.insertContent( injectionText.space() );
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
                  { text: '« »', value: injectionText.space() },
                  { text: '«If()»', value: injectionText.cond_eq() },
                  { text: '«Trim()»', value: injectionText.trim() },
                  ...((cols || []).map( col => ({ text: `«${col}»`, value: injectionText.field(col) })))
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
