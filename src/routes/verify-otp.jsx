import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import VerifyOtpPage from '../pages/VerifyOtpPage.jsx';

export const verifyOtpRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/verify-otp',
  component: VerifyOtpPage,
});
