import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '../components/DashboardLayout';
import { UserDashboard } from '../components/dashboard/UserDashboard';
import { AdminDashboard } from '../components/dashboard/AdminDashboard';
import { getProfile } from '../services/authService.jsx';

export default function DashboardPage() {
  const { data: profile } = useQuery({ queryKey: ['user-profile'], queryFn: getProfile, staleTime: 5 * 60 * 1000 });
  const isAdmin = profile?.role === 'admin';

  if (profile && !isAdmin) {
    return (
      <DashboardLayout>
        <UserDashboard />
      </DashboardLayout>
    );
  }

  return <AdminDashboard />;
}
