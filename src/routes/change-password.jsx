import { createRoute, redirect } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import ChangePasswordPage from '../pages/ChangePasswordPage';
import { hasValidToken } from '../lib/auth';

export const changePasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/change-password',
  beforeLoad: () => {
    if (!hasValidToken()) {
      throw redirect({ to: '/login' });
    }
  },
  component: ChangePasswordPage,
});