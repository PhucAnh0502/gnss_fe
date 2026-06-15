import { createRoute, redirect } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { hasValidToken } from '../lib/auth';
import DeviceConfigPage from '../pages/DeviceConfigPage';

export const deviceConfigRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/device-config',
  beforeLoad: () => {
    if (!hasValidToken()) {
      throw redirect({ to: '/login' });
    }
  },
  component: DeviceConfigPage,
});
