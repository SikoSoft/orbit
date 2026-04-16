// ...existing code...
import { LitElement, nothing, TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';
import { storage } from '@/lib/Storage';
import { StorageSource } from '@/models/Storage';

@customElement('logged-out')
export class LoggedOut extends LitElement {
  private stamped = false;
  private contentContainer: HTMLElement | null = null;

  protected createRenderRoot(): HTMLElement {
    return this;
  }

  private authListener = (): void => {
    this.updateVisibility();
  };

  connectedCallback(): void {
    super.connectedCallback();

    window.addEventListener('user-logged-in', this.authListener);
    window.addEventListener('user-logged-out', this.authListener);

    this.updateVisibility();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener('user-logged-in', this.authListener);
    window.removeEventListener('user-logged-out', this.authListener);
  }

  private ensureStamped(): void {
    if (this.stamped) {
      return;
    }

    const tpl = this.querySelector('template');
    if (!tpl) {
      this.stamped = true;

      return;
    }

    const fragment = tpl.content.cloneNode(true) as DocumentFragment;

    const container = document.createElement('div');
    container.className = 'stamped-content';
    container.appendChild(fragment);

    this.appendChild(container);

    this.contentContainer = container;
    this.stamped = true;
  }

  private updateVisibility(): void {
    const storageSource = storage.getStorageSource();
    const visible =
      storageSource === StorageSource.DEVICE || this.isLoggedOut();

    if (visible && !this.stamped) {
      this.ensureStamped();
    }

    if (!this.contentContainer) {
      return;
    }
    this.contentContainer.style.display = visible ? '' : 'none';
  }

  isLoggedOut(): boolean {
    return storage.getAuthToken() === '';
  }

  render(): TemplateResult | typeof nothing {
    return nothing;
  }
}
