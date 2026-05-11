import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import NotFoundPage from '../pages/NotFoundPage';

export const catchAllRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/$',
  component: NotFoundPage,
});
