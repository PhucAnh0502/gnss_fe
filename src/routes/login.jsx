import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import LoginPage from '../pages/LoginPage';

export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: LoginPage,
});

export const loginAliasRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'login',
  component: LoginPage,
});
