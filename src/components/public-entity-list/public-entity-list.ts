import { customElement, state } from 'lit/decorators.js';
import { EntityList } from '@/components/entity-list/entity-list';
import { EntityListResult } from '../entity-list/entity-list.models';
import { storage } from '@/lib/Storage';
import { MobxReactionsController } from '@/lib/MobxReactionController';
import { routerState } from '@/lib/Router';
import { ListReadyEvent } from './public-entity-list.events';

@customElement('public-entity-list')
export class PublicEntityList extends EntityList {
  private rx = new MobxReactionsController(this);

  @state()
  params: Record<string, string> = {};

  constructor() {
    super();

    this.rx.add({
      expr: () => routerState.params,
      effect: newParams => {
        this.params = newParams;
      },
      opts: { fireImmediately: true },
    });
  }

  @state()
  get listConfigId(): string {
    return this.params.id;
  }

  async getEntities(): Promise<EntityListResult> {
    try {
      const listResult = await storage.getList(
        this.listConfigId,
        this.start,
        this.perPage,
      );
      if (listResult.isOk) {
        this.state.setEntityConfigs(listResult.value.entityConfigs);
        if (
          listResult.value.listConfig?.id &&
          (!this.state.listConfig ||
            this.state.listConfig.id !== listResult.value.listConfig.id)
        ) {
          this.state.addListConfig(listResult.value.listConfig);
          this.state.setListConfigId(this.listConfigId);
        }
        return listResult.value;
      }

      return {
        entities: [],
        total: 0,
      };
    } catch (error) {
      console.error('Error fetching public list:', error);

      return {
        entities: [],
        total: 0,
      };
    } finally {
      this.dispatchEvent(new ListReadyEvent());
    }
  }
}
