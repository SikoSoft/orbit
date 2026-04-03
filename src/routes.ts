import { Route } from './models/Router';

export const routes: Route[] = [
  {
    path: '/',
    redirect: undefined,
    component: 'entity-form-view',
    action: async () =>
      await import('@/views/entity-form-view/entity-form-view'),
  },
  {
    path: '/admin',
    component: 'admin-dashboard-view',
    action: async () =>
      await import('@/views/admin-dashboard-view/admin-dashboard-view'),
  },
  {
    path: '/entities',
    component: 'entity-list-view',
    action: async () =>
      await import('@/views/entity-list-view/entity-list-view'),
  },
  {
    path: '/entity/:id',
    component: 'entity-form',
    action: async () => await import('@/components/entity-form/entity-form'),
  },
  {
    path: '/login',
    component: 'login-form',
    action: async () => await import('@/components/login-form/login-form'),
  },
  {
    path: '/list/:id',
    component: 'public-list-view',
    action: async () =>
      await import('@/views/public-list-view/public-list-view'),
  },
  {
    path: '/account',
    component: 'account-form',
    action: async () => await import('@/components/account-form/account-form'),
  },
  {
    path: '/wizard',
    component: 'collection-wizard',
    action: async () =>
      await import('@/components/collection-wizard/collection-wizard'),
  },
];
