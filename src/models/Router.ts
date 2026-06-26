export type Route = {
  path: string;
  component?: string;
  action?: () => Promise<unknown>;
  redirect?: string;
};

export type Router = {
  navigate: (to: string) => void;
  renderPath: (path: string) => Promise<void>;
  destroy: () => void;
};

export type RouterNavigationType = 'initial' | 'push' | 'pop';

export type RouterState = {
  currentPath: string;
  params: Record<string, string>;
  navigationType: RouterNavigationType;
};
