import { createRoute, redirect } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import AlertZonesPage from '../pages/AlertZonesPage';
import { hasValidToken } from '../lib/auth';

export const alertZonesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/alert-zones',
  beforeLoad: () => {
    if (!hasValidToken()) {
      throw redirect({ to: '/login' });
    }
  },
  component: AlertZonesPage,
});
