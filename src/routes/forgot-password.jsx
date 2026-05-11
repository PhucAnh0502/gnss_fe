import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';

export const forgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/forgot-password',
  component: ForgotPasswordPage,
});
