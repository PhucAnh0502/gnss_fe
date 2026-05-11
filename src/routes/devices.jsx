import { createRoute, redirect } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import DevicesPage from '../pages/DevicesPage';
import { hasValidToken } from '../lib/auth';

export const devicesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/devices',
  beforeLoad: () => {
    if (!hasValidToken()) {
      throw redirect({ to: '/login' });
    }
  },
  component: DevicesPage,
});
