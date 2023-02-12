import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { map, Subscription, take, tap } from 'rxjs';
import { AppService } from 'src/app/app.service';
import { Editor } from 'tinymce';

const injectionText = {
  cond: (matcher: string, content = 'Content') => `«If(Field ${matcher} 'Value')»${content}«Else»Alternate Content«End(If)»`,
  trim: (content = 'Content') => `«Trim(Chars)»${content}«End(Trim)»`,
  space: () => `«<br>»`,
  field: (field = 'Field') => `«${field}»` 
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
              editor.insertContent( injectionText.cond('=', content) );
            }
          },
          {
            type: 'menuitem',
            text: 'Not Equal',
            onAction: function (_) {
              const content = editor.selection.getContent() || undefined;
              editor.insertContent( injectionText.cond('!=', content) );
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
                  { text: '«If()»', value: injectionText.cond('=') },
                  { text: '«Trim()»', value: injectionText.trim() },
                  ...((cols || []).map( col => ({ text: `«${col}»`, value: injectionText.field(col) })))
                ].filter( col => col.text.toLocaleLowerCase().includes(pattern))
            ),
            tap(config => resolve(config || []) ),
          ).subscribe();
        })
      }
    });

    // editor.on('keydown', (event) => {
    //   // if (event.key !== 'Enter') return;
    //   // if (event.metaKey || event.shiftKey || event.altKey || event.ctrlKey)
    //   //   return;
    //   const currentNode = editor.selection.getNode();
    //   // const pNode = editor.dom.getParent(currentNode, 'p');
    //   let nextNode = currentNode.nextSibling;  

    //   if( currentNode.nodeName.toLowerCase() !== 'mark' ) return;
    //   console.log('>>>> ', {nextNode, currentNode, prevNode: currentNode.previousSibling })

    //   // if (!pNode) return; 
    //   // if (!textNode) return;
    //   // if (!currentNode.previousSibling) return;

    //   // editor.undoManager.transact(() =>
    //   //   editor.dom.split(currentNode, currentNode, textNode)
    //   // );

    //   var range = editor.dom.createRng();
    //   if(nextNode?.nodeName.toLocaleLowerCase() !== 'span'){
    //     nextNode = editor.dom.create('span', {}, '');
    //     currentNode.parentElement?.appendChild(nextNode);
    //     range.setStart(nextNode, 0);
    //     range.setStart(nextNode, 0);
    //   } else {
    //     range.setStart(nextNode, 0);
    //     range.collapse();
    //   }
    //   editor.selection.setRng(range, true);


    //   // // 仅对父元素为blockquote处理
    //   // const blockquoteNode = editor.dom.getParent(currentNode, 'blockquote');

    //   // if (!blockquoteNode) return;
      
    //   // if (!currentNode.previousSibling) return;

    //   // // 如果上一个元素是空行元素，再按下回车自动退出blockquote并删除该空行元素
    //   // const firstChild = currentNode.previousSibling.firstChild;
    //   // if (
    //   //   firstChild &&
    //   //   firstChild.nodeName === 'BR' &&
    //   //   firstChild.getAttribute('data-mce-bogus')
    //   // ) {
    //   //   const newParagraph = editor.dom.create('p', {}, '<br/>');
    //   //   editor.dom.remove(currentNode.previousSibling, false);
    //   //   editor.undoManager.transact(() =>
    //   //     editor.dom.split(blockquoteNode, currentNode, newParagraph), // 插入新元素
    //   //   );
    //   //   event.preventDefault();
    //   // }
    // });
  }

  ngOnInit(){
    this.subscription = this.formCtrl.valueChanges.subscribe( val => this.appSvc.setTemplate(val || ''))
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }
}
