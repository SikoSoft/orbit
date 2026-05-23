import { html, css, nothing, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { MobxLitElement } from '@adobe/lit-mobx';

import { Criterion, Criteria, EvalOperator } from 'api-spec/models/Medal';
import { translate } from '@/lib/Localization';
import { SelectChangedEvent } from '@ss/ui/components/ss-select.events';
import { InputChangedEvent } from '@ss/ui/components/ss-input.events';
import { themed } from '@/lib/Theme';

import {
  CriteriaEditorProp,
  criteriaEditorProps,
  CriteriaEditorProps,
} from './criteria-editor.models';
import { CriteriaChangedEvent } from './criteria-editor.events';

import '@ss/ui/components/ss-input';
import '@ss/ui/components/ss-select';
import '@ss/ui/components/ss-button';

const evalOperatorOptions: { value: EvalOperator; label: string }[] = [
  { value: '==', label: '== (equals)' },
  { value: '!=', label: '!= (not equals)' },
  { value: '>', label: '> (greater than)' },
  { value: '>=', label: '>= (greater than or equal)' },
  { value: '<', label: '< (less than)' },
  { value: '<=', label: '<= (less than or equal)' },
  { value: 'contains', label: 'contains' },
];

const groupModeOptions = [
  { value: 'all', label: 'ALL (and)' },
  { value: 'any', label: 'ANY (or)' },
];

const defaultCriterion: Criterion = { fact: '', operator: '==', value: '' };

function isCriteria(node: Criterion | Criteria): node is Criteria {
  return 'all' in node || 'any' in node;
}

function groupMode(node: Criteria): 'all' | 'any' {
  return 'all' in node ? 'all' : 'any';
}

function groupChildren(node: Criteria): (Criterion | Criteria)[] {
  const mode = groupMode(node);
  return (node[mode] ?? []) as (Criterion | Criteria)[];
}

function updateAtPath(
  root: Criterion | Criteria,
  path: number[],
  updater: (node: Criterion | Criteria) => Criterion | Criteria,
): Criterion | Criteria {
  if (path.length === 0) {
    return updater(root);
  }
  const g = root as Criteria;
  const mode = groupMode(g);
  const children = groupChildren(g);
  const [head, ...rest] = path;
  return {
    [mode]: [
      ...children.slice(0, head),
      updateAtPath(children[head], rest, updater),
      ...children.slice(head + 1),
    ],
  };
}

function removeAtPath(root: Criterion | Criteria, path: number[]): Criterion | Criteria {
  if (path.length === 1) {
    const g = root as Criteria;
    const mode = groupMode(g);
    const children = groupChildren(g);
    return { [mode]: children.filter((_, i) => i !== path[0]) };
  }
  const g = root as Criteria;
  const mode = groupMode(g);
  const children = groupChildren(g);
  const [head, ...rest] = path;
  return {
    [mode]: [
      ...children.slice(0, head),
      removeAtPath(children[head], rest),
      ...children.slice(head + 1),
    ],
  };
}

function addChildAtPath(
  root: Criterion | Criteria,
  groupPath: number[],
  child: Criterion | Criteria,
): Criterion | Criteria {
  if (groupPath.length === 0) {
    const g = root as Criteria;
    const mode = groupMode(g);
    const children = groupChildren(g);
    return { [mode]: [...children, child] };
  }
  const g = root as Criteria;
  const mode = groupMode(g);
  const children = groupChildren(g);
  const [head, ...rest] = groupPath;
  return {
    [mode]: [
      ...children.slice(0, head),
      addChildAtPath(children[head], rest, child),
      ...children.slice(head + 1),
    ],
  };
}

@themed()
@customElement('criteria-editor')
export class CriteriaEditor extends MobxLitElement {
  static styles = css`
    :host {
      display: block;
    }

    .group {
      border: 1px solid var(--color-border, #ccc);
      border-radius: 4px;
      padding: 0.75rem;
      margin-bottom: 0.5rem;
    }

    .group-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
      flex-wrap: wrap;
    }

    .group-header-label {
      font-size: 0.8125rem;
      font-weight: bold;
    }

    .group-header ss-select {
      flex: 0 0 auto;
      min-width: 10rem;
    }

    .criterion-row {
      display: flex;
      gap: 0.5rem;
      align-items: flex-end;
      margin-bottom: 0.5rem;
      flex-wrap: wrap;
    }

    .criterion-field {
      display: flex;
      flex-direction: column;
      flex: 1;
      gap: 0.25rem;
      min-width: 7rem;
    }

    .criterion-field label {
      font-size: 0.75rem;
      font-weight: bold;
      opacity: 0.75;
    }

    .group-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.75rem;
      flex-wrap: wrap;
    }

    .nested-group {
      margin-top: 0.5rem;
    }

    .empty-hint {
      font-size: 0.8125rem;
      font-style: italic;
      opacity: 0.6;
      margin-bottom: 0.5rem;
    }
  `;

  @property({ type: Object })
  [CriteriaEditorProp.CRITERIA]: CriteriaEditorProps[CriteriaEditorProp.CRITERIA] =
    criteriaEditorProps[CriteriaEditorProp.CRITERIA].default;

  @property({ type: Array })
  [CriteriaEditorProp.FACT_ALIASES]: CriteriaEditorProps[CriteriaEditorProp.FACT_ALIASES] =
    criteriaEditorProps[CriteriaEditorProp.FACT_ALIASES].default;

  @state()
  private localCriteria: Criterion | Criteria = { all: [] };

  connectedCallback(): void {
    super.connectedCallback();
    this.localCriteria = this.normalizeRoot(this[CriteriaEditorProp.CRITERIA]);
  }

  private normalizeRoot(c: Criterion | Criteria): Criteria {
    if (!isCriteria(c)) {
      return { all: [c] };
    }
    if (!('all' in c) && !('any' in c)) {
      return { all: [] };
    }
    return c as Criteria;
  }

  private applyUpdate(newCriteria: Criterion | Criteria): void {
    this.localCriteria = newCriteria;
    this.dispatchEvent(new CriteriaChangedEvent({ criteria: newCriteria }));
  }

  private renderCriterion(node: Criterion, nodePath: number[]): TemplateResult {
    const aliases = this[CriteriaEditorProp.FACT_ALIASES];
    const factOptions = aliases.map(a => ({ value: a, label: a }));

    return html`
      <div class="criterion-row">
        <div class="criterion-field">
          <label>${translate('fact')}</label>
          <ss-select
            .options=${factOptions}
            .selected=${node.fact}
            @select-changed=${(e: SelectChangedEvent<string>): void => {
              this.applyUpdate(updateAtPath(this.localCriteria, nodePath, n => ({ ...(n as Criterion), fact: e.detail.value })));
            }}
          ></ss-select>
        </div>
        <div class="criterion-field">
          <label>${translate('operator')}</label>
          <ss-select
            .options=${evalOperatorOptions}
            .selected=${node.operator}
            @select-changed=${(e: SelectChangedEvent<EvalOperator>): void => {
              this.applyUpdate(updateAtPath(this.localCriteria, nodePath, n => ({ ...(n as Criterion), operator: e.detail.value })));
            }}
          ></ss-select>
        </div>
        <div class="criterion-field">
          <label>${translate('value')}</label>
          <ss-input
            .value=${String(node.value)}
            @input-changed=${(e: InputChangedEvent): void => {
              const raw = e.detail.value;
              const value: string | number =
                raw !== '' && !isNaN(Number(raw)) ? Number(raw) : raw;
              this.applyUpdate(updateAtPath(this.localCriteria, nodePath, n => ({ ...(n as Criterion), value })));
            }}
          ></ss-input>
        </div>
        <ss-button
          negative
          @click=${(): void => {
            this.applyUpdate(removeAtPath(this.localCriteria, nodePath));
          }}
        >${translate('remove')}</ss-button>
      </div>
    `;
  }

  private renderGroup(node: Criteria, groupPath: number[]): TemplateResult {
    const mode = groupMode(node);
    const children = groupChildren(node);
    const isRoot = groupPath.length === 0;

    return html`
      <div class="group">
        <div class="group-header">
          <span class="group-header-label">${translate('matchMode')}</span>
          <ss-select
            .options=${groupModeOptions}
            .selected=${mode}
            @select-changed=${(e: SelectChangedEvent<'all' | 'any'>): void => {
              const newMode = e.detail.value;
              this.applyUpdate(
                updateAtPath(this.localCriteria, groupPath, n => {
                  const g = n as Criteria;
                  const kids = groupChildren(g);
                  return { [newMode]: kids };
                }),
              );
            }}
          ></ss-select>
          ${!isRoot
            ? html`<ss-button
                negative
                @click=${(): void => {
                  this.applyUpdate(removeAtPath(this.localCriteria, groupPath));
                }}
              >${translate('removeGroup')}</ss-button>`
            : nothing}
        </div>

        ${children.length === 0
          ? html`<div class="empty-hint">${translate('noCriteria')}</div>`
          : nothing}

        ${repeat(
          children,
          (_, i) => i,
          (child, i) => {
            const childPath = [...groupPath, i];
            if (isCriteria(child)) {
              return html`<div class="nested-group">${this.renderGroup(child as Criteria, childPath)}</div>`;
            }
            return this.renderCriterion(child as Criterion, childPath);
          },
        )}

        <div class="group-actions">
          <ss-button
            @click=${(): void => {
              const aliases = this[CriteriaEditorProp.FACT_ALIASES];
              const fact = aliases.length > 0 ? aliases[0] : defaultCriterion.fact;
              this.applyUpdate(addChildAtPath(this.localCriteria, groupPath, { ...defaultCriterion, fact }));
            }}
          >${translate('addCriterion')}</ss-button>
          <ss-button
            @click=${(): void => {
              this.applyUpdate(addChildAtPath(this.localCriteria, groupPath, { all: [] }));
            }}
          >${translate('addGroup')}</ss-button>
        </div>
      </div>
    `;
  }

  render(): TemplateResult {
    return html`${this.renderGroup(this.localCriteria as Criteria, [])}`;
  }
}
