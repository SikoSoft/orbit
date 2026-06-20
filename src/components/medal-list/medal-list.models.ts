import { Medal, MedalConfig, Criterion, Criteria } from 'api-spec/models/Medal';

export interface CriteriaProgress {
  alias: string;
  value: string | number | boolean;
}

export interface MedalConfigWithProgress extends MedalConfig {
  criteriaProgress?: CriteriaProgress[];
}

export interface MedalDisplayItem {
  config: MedalConfigWithProgress;
  medal: Medal | undefined;
}

export type RingStyles = Record<string, string>;
export type SortField = 'name' | 'prestige' | 'dateAwarded';
export type SortDir = 'asc' | 'desc';
export type StatusFilter = 'all' | 'earned' | 'inProgress';

export const PRESTIGE_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
export const SORT_FIELDS: SortField[] = ['name', 'prestige', 'dateAwarded'];
export const STATUS_FILTERS: StatusFilter[] = ['all', 'earned', 'inProgress'];

export function getRingStyles(prestige: number): RingStyles {
  if (prestige <= 2) {
    return {
      '--ring-a': '#f5c870',
      '--ring-b': '#7b3f10',
      '--ring-c': '#c07820',
      '--ring-glow': 'rgba(176,104,32,0.65)',
    };
  }
  if (prestige <= 4) {
    return {
      '--ring-a': '#eeeeee',
      '--ring-b': '#606060',
      '--ring-c': '#b0b0b0',
      '--ring-glow': 'rgba(120,120,120,0.45)',
    };
  }
  if (prestige <= 6) {
    return {
      '--ring-a': '#fff580',
      '--ring-b': '#886000',
      '--ring-c': '#c8a800',
      '--ring-glow': 'rgba(200,168,0,0.65)',
    };
  }
  if (prestige <= 9) {
    return {
      '--ring-a': '#c8f0ff',
      '--ring-b': '#1070a0',
      '--ring-c': '#60c8e8',
      '--ring-glow': 'rgba(24,128,176,0.65)',
    };
  }
  return {
    '--ring-a': '#f0e8ff',
    '--ring-b': '#503880',
    '--ring-c': '#b8a0d8',
    '--ring-glow': 'rgba(110,90,180,0.55)',
  };
}

export function flattenCriteria(criteria: Criterion | Criteria): Criterion[] {
  if ('fact' in criteria) {
    return [criteria as Criterion];
  }
  const c = criteria as Criteria;
  const children = [...(c.all ?? []), ...(c.any ?? [])];
  return children.flatMap(flattenCriteria);
}

export function calculateProgress(config: MedalConfigWithProgress): number {
  if (!config.criteriaProgress || config.criteriaProgress.length === 0) {
    return 0;
  }

  let totalProgress = 0;
  let count = 0;

  const streakAliases = new Set((config.streakRequests ?? []).map(sr => sr.alias));

  const factCriteria = flattenCriteria(config.criteria).filter(
    c => !streakAliases.has(c.fact),
  );

  for (const criterion of factCriteria) {
    const progressEntry = config.criteriaProgress.find(
      p => p.alias === criterion.fact,
    );
    if (!progressEntry) {
      continue;
    }
    const current =
      typeof progressEntry.value === 'number' ? progressEntry.value : 0;
    const target =
      typeof criterion.value === 'number' && criterion.value > 0
        ? criterion.value
        : 1;
    totalProgress += Math.min(1, current / target);
    count++;
  }

  for (const streakRequest of config.streakRequests ?? []) {
    const progressEntry = config.criteriaProgress.find(
      p => p.alias === streakRequest.alias,
    );
    if (!progressEntry) {
      continue;
    }
    const current =
      typeof progressEntry.value === 'number' ? progressEntry.value : 0;
    const target = streakRequest.context.length;
    totalProgress += Math.min(1, current / target);
    count++;
  }

  return count > 0 ? totalProgress / count : 0;
}
