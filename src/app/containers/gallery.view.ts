import { Component, ApplicationRef } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Theme } from '../helpers';
import { UI, Snippet, GitHub } from '../actions';
import { Storage } from '@microsoft/office-js-helpers';
import { Disposable } from '../services';
import { Store } from '@ngrx/store';
import * as fromRoot from '../reducers';
import * as _ from 'lodash';

@Component({
    selector: 'gallery-view',
    template: `
        <section class="gallery">
            <section class="gallery__section">
                <ul class="gallery__tabs ms-Pivot ms-Pivot--tabs">
                    <li class="gallery__tab ms-Pivot-link" [ngClass]="{'is-selected gallery__tab--active': !templatesView}" (click)="templatesView = false">Snippets</li>
                    <li class="gallery__tab ms-Pivot-link" [ngClass]="{'is-selected gallery__tab--active': templatesView}" (click)="templatesView = true">Templates</li>
                </ul>
                <div class="gallery__tabs-container">
                    <collapse [hidden]="templatesView" title="Local" [actions]="['Info', 'Delete']" (events)="action($event)">
                        <gallery-list title="Local" [items]="snippets$|async" (select)="import($event)" fallback="You have no local snippets. To get started, import one from a shared link or create a gallery snippet. You can also choose one from the Templates."></gallery-list>
                    </collapse>
                    <collapse [hidden]="templatesView" title="Gists" (action)="action.emit($event)">
                        <gallery-list title="Local" [items]="gists$|async" (select)="import($event, 'gist')" fallback="You have no gists exported. To get started, create a new snippet and share it to your Gists."></gallery-list>
                    </collapse>
                    <collapse [hidden]="!templatesView" title="Starter Samples" (action)="action.emit($event)">
                        <gallery-list [hidden]="!templatesView" title="Microsoft" [items]="templates$|async" (select)="import($event, 'gist')"></gallery-list>
                    </collapse>
                </div>
            </section>
            <section class="gallery__section">
                <hr class="gallery__section--separator" />
                <button class="gallery__action ms-Button ms-Button--compound" (click)="new()">
                    <h1 class="ms-Button-label"><i class="ms-Icon ms-Icon--Generate"></i>New</h1>
                    <span class="ms-Button-description">Create a new snippet.</span>
                </button>
                <button class="gallery__action button-primary ms-Button ms-Button--compound" (click)="import()">
                    <h1 class="ms-Button-label"><i class="ms-Icon ms-Icon--Download"></i>Import</h1>
                    <span class="ms-Button-description">Create from GIST or JSON.</span>
                </button>
            </section>
        </section>
    `
})
export class GalleryView extends Disposable {
    templatesView: boolean;
    snippets$: Observable<ISnippet[]>;
    gists$: Observable<ISnippet[]>;
    templates$: Observable<ITemplate[]>;

    constructor(private _store: Store<fromRoot.State>) {
        super();

        this.snippets$ = this._store.select(fromRoot.getSnippets)
            .map(snippets => {
                if (_.isEmpty(snippets)) {
                    this._store.dispatch(new UI.OpenMenuAction());
                    this.templatesView = true;
                }
                return snippets;
            });

        this.templates$ = this._store.select(fromRoot.getTemplates);
        this.gists$ = this._store.select(fromRoot.getGists);

        this._store.dispatch(new Snippet.LoadSnippetsAction());
        this._store.dispatch(new Snippet.LoadTemplatesAction());
        this._store.dispatch(new GitHub.LoadGistsAction());
    }

    new() {
        this._store.dispatch(new Snippet.ImportAction('default'));
        this._store.dispatch(new UI.CloseMenuAction());
    }

    import(item?: ITemplate, mode = 'id') {
        console.log(item);
        if (item == null) {
            this._store.dispatch(new UI.ToggleImportAction(true));
        }
        else {
            this._store.dispatch(new Snippet.ImportAction(mode === 'id' ? item.id : item.gist));
            this._store.dispatch(new UI.CloseMenuAction());
        }
    }

    action(action: any) {
        if (action.title === 'Local') {
            switch (action.action) {
                case 'Delete': return this._store.dispatch(new Snippet.DeleteAllAction());
            }
        }
    }
}
