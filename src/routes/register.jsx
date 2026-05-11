import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import RegisterPage from '../pages/RegisterPage';

export const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  component: RegisterPage,
});
