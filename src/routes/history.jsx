import { createRoute, redirect } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import HistoryPage from '../pages/HistoryPage';
import { hasValidToken } from '../lib/auth';

export const historyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/history',
  beforeLoad: () => {
    if (!hasValidToken()) {
      throw redirect({ to: '/login' });
    }
  },
  component: HistoryPage,
});
