import { createRoute, redirect } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import AlertHistoryPage from '../pages/AlertHistoryPage';
import { hasValidToken } from '../lib/auth';

export const alertHistoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/alert-history',
  beforeLoad: () => {
    if (!hasValidToken()) {
      throw redirect({ to: '/login' });
    }
  },
  component: AlertHistoryPage,
});
