import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { Toaster } from 'sonner';
import './index.css';

import { Route as rootRoute } from './routes/__root';
import { loginRoute, loginAliasRoute } from './routes/login';
import { registerRoute } from './routes/register';
import { forgotPasswordRoute } from './routes/forgot-password';
import { verifyOtpRoute } from './routes/verify-otp';
import { resetPasswordRoute } from './routes/reset-password';
import { changePasswordRoute } from './routes/change-password';
import { dashboardRoute } from './routes/dashboard';
import { devicesRoute } from './routes/devices';
import { mapRoute } from './routes/map';
import { historyRoute } from './routes/history';
import { catchAllRoute } from './routes/$';

const routeTree = rootRoute.addChildren([
  loginRoute, 
  loginAliasRoute,
  registerRoute,
  forgotPasswordRoute,
  verifyOtpRoute,
  resetPasswordRoute,
  changePasswordRoute,
  dashboardRoute,
  devicesRoute,
  mapRoute,
  historyRoute,
  catchAllRoute,
]);
const router = createRouter({ routeTree });

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Toaster
        theme="dark"
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          classNames: {
            toast: 'toast-slide-right',
          },
        }}
      />
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
);