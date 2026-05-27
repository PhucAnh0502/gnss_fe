import { createRoute, redirect } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import SettingsPage from '../pages/SettingsPage';
import { hasValidToken } from '../lib/auth';

export const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  beforeLoad: () => {
    if (!hasValidToken()) {
      throw redirect({ to: '/login' });
    }
  },
  component: SettingsPage,
});
