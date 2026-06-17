import { translate } from '@/lib/Localization';
import { appState } from '@/state';
import { MobxLitElement } from '@adobe/lit-mobx';
import { css, html, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import '@ss/ui/components/ss-button';
import '@ss/ui/components/ss-select';
import '@ss/ui/components/confirmation-modal';
import { NotificationType } from '@ss/ui/components/notification-provider.models';

import { addToast } from '@/lib/Util';
import { storage } from '@/lib/Storage';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';
import { NukedDataType } from 'api-spec/models/Data';

const countdownDuration = 3000;

@customElement('tactical-nuke')
export class TacticalNuke extends MobxLitElement {
  private state = appState;

  static styles = css`
    ss-button::part(button) {
      font-size: 1.5rem;
      padding: 1rem 2rem;
      font-weight: bold;
      text-transform: uppercase;
    }

    .export-tool {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .include-type-header,
    .include-type {
      display: flex;
      align-items: left;
      gap: 0.5rem;
    }

    .include-type {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .nuke-countdown {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);

      align-items: center;
      justify-content: center;

      font-size: 5rem;
      color: white;
      z-index: 1000;
      pointer-events: none;
      transition: opacity 0.3s ease-in-out;
    }

    .nuke-in-progress {
      .nuke-countdown {
        display: flex;
        animation: pulse 1000ms linear forwards infinite;
      }
    }

    .nuke-launched {
      display: none;
    }

    .nuke-complete .nuke-launched {
      background-image: url('img/nuclear-explosion.gif');
      height: 100%;
      width: 100%;
      background-size: cover;
      background-position: center;
      position: fixed;
      top: 0;
      left: 0;
      display: block;
    }

    @keyframes pulse {
      0% {
        transform: scale(1);
      }
      100% {
        transform: scale(3);
      }
    }
  `;

  @state()
  nukeInProgress: boolean = false;

  @state()
  nukeComplete: boolean = false;

  @state()
  confirmModalShown: boolean = false;

  @state()
  initiation: Date | undefined;

  @state()
  timeRemaining: number = 0;

  @state()
  selectedTypes: NukedDataType[] = [];

  getTimeRemaining(): number {
    if (!this.initiation) {
      return 0;
    }
    const elapsed = new Date().getTime() - this.initiation.getTime();
    const remaining = countdownDuration - elapsed;
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
  }

  get isPermitted(): boolean {
    return true;
  }

  @state()
  get classes(): Record<string, boolean> {
    return {
      'tactical-nuke': true,
      'nuke-in-progress': this.nukeInProgress,
      'nuke-complete': this.nukeComplete,
    };
  }

  showConfirmationModal(): void {
    this.confirmModalShown = true;
  }

  async nukeIt(): Promise<void> {
    if (this.nukeInProgress) {
      return;
    }

    addToast(translate('nukeInitiated'), NotificationType.ERROR);

    new Audio('tactical-nuke.mp3').play();
    await new Promise(resolve => setTimeout(resolve, 2500));

    this.initiation = new Date();
    this.nukeInProgress = true;
    this.confirmModalShown = false;

    const intervalId = setInterval(() => {
      this.timeRemaining = this.getTimeRemaining();
    }, 100);
    await new Promise(resolve => setTimeout(resolve, countdownDuration));
    clearInterval(intervalId);
    this.timeRemaining = 0;

    this.nukeComplete = true;

    try {
      await storage.clearData(this.selectedTypes);
      addToast(translate('nukeSuccess'), NotificationType.SUCCESS);
    } catch (error) {
      console.error('Error during tactical nuke:', error);
      addToast(translate('nukeFailure'), NotificationType.ERROR);
    } finally {
      this.nukeInProgress = false;
    }

    setTimeout(() => {
      window.location.reload();
    }, 3000);
  }

  private handleNukeDeclined(): void {
    addToast(translate('wiseMove'), NotificationType.INFO);
    this.confirmModalShown = false;
  }

  handleCheckboxChange(type: NukedDataType): void {
    this.selectedTypes = this.selectedTypes.includes(type)
      ? this.selectedTypes.filter(t => t !== type)
      : [...this.selectedTypes, type];
  }

  render(): TemplateResult {
    return html`
      <div class=${classMap(this.classes)}>
        <div class="nuke-countdown">
          <div class="countdown-timer">${this.timeRemaining}</div>
        </div>
        <div class="nuke-launched"></div>

        ${repeat(
          Object.values(NukedDataType),
          type => type,
          type => html`
            <div class="include-type">
              <input
                type="checkbox"
                id="include-${type}"
                @change=${(): void => this.handleCheckboxChange(type)}
              />
              <label for="include-${type}"
                >${translate(`nukedDataType.${type}`)}</label
              >
            </div>
          `,
        )}

        <ss-button
          negative
          ?disabled=${!this.isPermitted || this.nukeInProgress}
          @click=${this.showConfirmationModal}
          >${translate('nukeIt')}</ss-button
        >

        <confirmation-modal
          @confirmation-accepted=${this.nukeIt}
          @confirmation-declined=${(): void => this.handleNukeDeclined()}
          message=${translate('nukeConfirmation')}
          ?open=${this.confirmModalShown}
        ></confirmation-modal>
      </div>
    `;
  }
}
