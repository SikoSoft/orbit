import { html, css, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { classMap } from 'lit/directives/class-map.js';
import { MobxLitElement } from '@adobe/lit-mobx';

import { Entity } from 'api-spec/models/Entity';
import { appState } from '@/state';
import { storage } from '@/lib/Storage';
import { themed } from '@/lib/Theme';

import { EntitySuggestionAddedEvent } from '@/components/entity-suggestion/entity-suggestion.events';
import '@/components/entity-suggestion/entity-suggestion';

const ONE_HOUR_MS = 60 * 60 * 1000;
const FADE_DURATION_MS = 400;
const CHECK_INTERVAL_MS = 60 * 1000;

function timeOfDayDiffMs(createdAt: string): number {
  const created = new Date(createdAt);
  const now = new Date();
  const createdTimeMs =
    (created.getHours() * 60 + created.getMinutes()) * 60000;
  const nowTimeMs = (now.getHours() * 60 + now.getMinutes()) * 60000;
  const diff = Math.abs(createdTimeMs - nowTimeMs);
  return Math.min(diff, 24 * 60 * 60 * 1000 - diff);
}

function isSameDay(createdAt: string): boolean {
  const created = new Date(createdAt);
  const now = new Date();
  return (
    created.getFullYear() === now.getFullYear() &&
    created.getMonth() === now.getMonth() &&
    created.getDate() === now.getDate()
  );
}

function isWithinHourWindow(createdAt: string): boolean {
  return isSameDay(createdAt) && timeOfDayDiffMs(createdAt) <= ONE_HOUR_MS;
}

@themed()
@customElement('entity-suggestions')
export class EntitySuggestions extends MobxLitElement {
  static styles = css`
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes fadeOut {
      from {
        opacity: 1;
      }
      to {
        opacity: 0;
      }
    }

    .suggestion-wrapper {
      animation: fadeIn 400ms ease-in-out;
    }

    .suggestion-wrapper.fading-out {
      animation: fadeOut 400ms ease-in-out forwards;
    }
  `;

  private appState = appState;
  private allEntities: Entity[] = [];
  private intervalId: ReturnType<typeof setInterval> | null = null;

  @state() private displayedEntities: Entity[] = [];
  @state() private fadingOutIds: Set<number> = new Set();

  async connectedCallback(): Promise<void> {
    super.connectedCallback();
    this.allEntities = await storage.getEntitySuggestions(
      this.appState.listConfig.filter,
    );
    this.updateVisibility();
    this.intervalId = setInterval(
      () => this.updateVisibility(),
      CHECK_INTERVAL_MS,
    );
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private updateVisibility(): void {
    const inWindowIds = new Set(
      this.allEntities
        .filter(e => isWithinHourWindow(e.createdAt))
        .map(e => e.id),
    );

    const toAdd = this.allEntities.filter(
      e =>
        inWindowIds.has(e.id) &&
        !this.displayedEntities.some(d => d.id === e.id),
    );

    const toRemove = this.displayedEntities.filter(
      e => !inWindowIds.has(e.id) && !this.fadingOutIds.has(e.id),
    );

    const base =
      toAdd.length > 0 ? [...this.displayedEntities, ...toAdd] : this.displayedEntities;

    this.displayedEntities = [...base].sort(
      (a, b) => timeOfDayDiffMs(a.createdAt) - timeOfDayDiffMs(b.createdAt),
    );

    toRemove.forEach(entity => {
      const id = entity.id;
      this.fadingOutIds = new Set([...this.fadingOutIds, id]);
      setTimeout(() => {
        this.displayedEntities = this.displayedEntities.filter(
          e => e.id !== id,
        );
        this.fadingOutIds = new Set(
          [...this.fadingOutIds].filter(fid => fid !== id),
        );
      }, FADE_DURATION_MS);
    });
  }

  private handleSuggestionAdded(e: EntitySuggestionAddedEvent): void {
    const { id } = e.detail;
    this.allEntities = this.allEntities.filter(entity => entity.id !== id);
    this.displayedEntities = this.displayedEntities.filter(
      entity => entity.id !== id,
    );
    this.fadingOutIds = new Set([...this.fadingOutIds].filter(fid => fid !== id));
  }

  render(): TemplateResult {
    return html`
      ${repeat(
        this.displayedEntities,
        entity => entity.id,
        entity => html`
          <div
            class=${classMap({
              'suggestion-wrapper': true,
              'fading-out': this.fadingOutIds.has(entity.id),
            })}
          >
            <entity-suggestion
              .entity=${entity}
              @entity-suggestion-added=${this.handleSuggestionAdded}
            ></entity-suggestion>
          </div>
        `,
      )}
    `;
  }
}
