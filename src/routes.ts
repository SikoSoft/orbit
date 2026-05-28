import { Route } from './models/Router';

export const routes: Route[] = [
  {
    path: '/',
    redirect: undefined,
    component: 'user-dashboard-view',
    action: async () =>
      await import('@/views/user-dashboard-view/user-dashboard-view'),
  },
  {
    path: '/admin',
    component: 'admin-dashboard-view',
    action: async () =>
      await import('@/views/admin-dashboard-view/admin-dashboard-view'),
  },
  {
    path: '/admin/data',
    component: 'admin-data-view',
    action: async () => await import('@/views/admin-data-view/admin-data-view'),
  },
  {
    path: '/admin/entityConfig',
    component: 'admin-entity-config-view',
    action: async () =>
      await import('@/views/admin-entity-config-view/admin-entity-config-view'),
  },
  {
    path: '/admin/medalConfig',
    component: 'admin-medal-config-view',
    action: async () =>
      await import('@/views/admin-medal-config-view/admin-medal-config-view'),
  },
  {
    path: '/workspace',
    component: 'workspace-view',
    action: async () => await import('@/views/workspace-view/workspace-view'),
  },
  {
    path: '/entity/:id',
    component: 'entity-view',
    action: async () => await import('@/views/entity-view/entity-view'),
  },
  {
    path: '/medals',
    component: 'user-medals-view',
    action: async () =>
      await import('@/views/user-medals-view/user-medals-view'),
  },
  {
    path: '/login',
    component: 'login-form',
    action: async () => await import('@/components/login-form/login-form'),
  },
  {
    path: '/list',
    component: 'list-view',
    action: async () => await import('@/views/list-view/list-view'),
  },
  {
    path: '/list/:id',
    component: 'list-view',
    action: async () => await import('@/views/list-view/list-view'),
  },
  {
    path: '/account',
    component: 'account-view',
    action: async () => await import('@/views/account-view/account-view'),
  },
  {
    path: '/wizard',
    component: 'collection-wizard',
    action: async () =>
      await import('@/components/collection-wizard/collection-wizard'),
  },
  {
    path: '/access',
    component: 'access-policies-view',
    action: async () =>
      await import('@/views/access-policies-view/access-policies-view'),
  },
  {
    path: '/password',
    component: 'reset-password-view',
    action: async () =>
      await import('@/views/reset-password-view/reset-password-view'),
  },
  {
    path: '/settings',
    component: 'user-settings-view',
    action: async () =>
      await import('@/views/user-settings-view/user-settings-view'),
  },
  {
    path: '/add',
    component: 'entity-form-view',
    action: async () =>
      await import('@/views/entity-form-view/entity-form-view'),
  },
  {
    path: '/logout',
    component: 'logout-view',
    action: async () => await import('@/views/logout-view/logout-view'),
  },
  {
    path: '/debug',
    component: 'debug-view',
    action: async () => await import('@/views/debug-view/debug-view'),
  },
];
