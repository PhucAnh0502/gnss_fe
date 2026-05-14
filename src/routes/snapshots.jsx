import { createRoute, redirect } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import SnapshotsPage from '../pages/SnapshotsPage';
import { hasValidToken } from '../lib/auth';

export const snapshotsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/snapshots',
  beforeLoad: () => {
    if (!hasValidToken()) {
      throw redirect({ to: '/login' });
    }
  },
  component: SnapshotsPage,
});