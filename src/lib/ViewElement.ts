import {
  ViewInitEvent,
  ViewReadyEvent,
} from '@/components/app-container/app-container.events';
import { MobxLitElement } from '@adobe/lit-mobx';
import { PropertyValues } from 'lit';

export class ViewElement extends MobxLitElement {
  private _ready = false;

  protected firstUpdated(_changedProperties: PropertyValues): void {
    super.firstUpdated(_changedProperties);

    this.dispatchEvent(new ViewInitEvent({}));
  }

  set ready(value: boolean) {
    if (this._ready !== value) {
      this.dispatchEvent(new ViewReadyEvent({}));
      this._ready = value;
    }
  }

  get ready(): boolean {
    return this._ready;
  }

  sync(_reset = false): void {}
}
