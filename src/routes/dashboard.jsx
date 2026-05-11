import { createRoute, redirect } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import DashboardPage from '../pages/DashboardPage';
import { hasValidToken } from '../lib/auth';

export const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  beforeLoad: () => {
    if (!hasValidToken()) {
      throw redirect({ to: '/login' });
    }
  },
  component: DashboardPage,
});
