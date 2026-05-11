import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import ResetPasswordPage from '../pages/ResetPasswordPage';

export const resetPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reset-password',
  component: ResetPasswordPage,
});
