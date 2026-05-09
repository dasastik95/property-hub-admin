import { createFileRoute, Outlet } from '@tanstack/react-router';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminProvider } from '@/lib/admin-context';

export const Route = createFileRoute('/admin')({
  component: AdminLayoutComponent,
});

function AdminLayoutComponent() {
  return (
    <AdminProvider>
      <AdminLayout>
        <Outlet />
      </AdminLayout>
    </AdminProvider>
  );
}
