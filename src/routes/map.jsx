import { createRoute, redirect } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import MapPage from '../pages/MapPage';
import { hasValidToken } from '../lib/auth';

export const mapRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/map',
  beforeLoad: () => {
    if (!hasValidToken()) {
      throw redirect({ to: '/login' });
    }
  },
  component: MapPage,
});
