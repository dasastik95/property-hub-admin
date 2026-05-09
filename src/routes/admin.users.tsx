import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Edit2, Eye, MapPin, MessageCircle, Phone, Search, Trash2, User } from 'lucide-react';
import { toast } from 'sonner';

import {
  adminDialogContentClass,
  adminFieldLabelClass,
  adminIconButtonClass,
  adminInputClass,
  adminInsetPanelClass,
  adminNoteClass,
  adminPageDescriptionClass,
  adminPageTitleClass,
  adminSelectClass,
  adminStrongCellClass,
  adminSubtleSurfaceClass,
  adminSurfaceClass,
  adminTableCellClass,
  adminTableHeadClass,
  adminTableHeaderCellClass,
  adminTableRowClass,
  getRoleBadgeClass,
} from '@/components/admin/adminTheme';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { getAdminUsers, getUserWithDetails, updateUserRole } from '@/integrations/supabase/admin';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/admin/users')({
  head: () => ({
    title: 'User Management - Admin',
  }),
  component: UsersPage,
});

function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [editingUser, setEditingUser] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userDetailsModalOpen, setUserDetailsModalOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await getAdminUsers({
        search,
        role: roleFilter || undefined,
        limit: 50,
      });

      if (error) {
        console.error('RPC error details:', { error, data });
        throw error;
      }
      setUsers(data || []);
    } catch (error: any) {
      console.error('Failed to fetch users:', error?.message || error);
      toast.error(`Failed to load users: ${error?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'buyer' | 'seller' | 'broker' | 'admin') => {
    try {
      const { error } = await updateUserRole(userId, newRole);
      if (error) {
        throw error;
      }

      setUsers((currentUsers) =>
        currentUsers.map((user) => (user.id === userId ? { ...user, role: newRole } : user)),
      );
      setEditingUser(null);
      toast.success('User role updated');
    } catch (error) {
      console.error('Failed to update user role:', error);
      toast.error('Failed to update user role');
    }
  };

  const handleViewUserDetails = async (userId: string) => {
    try {
      const { data, error } = await getUserWithDetails(userId);
      if (error) throw error;

      setSelectedUser(data);
      setUserDetailsModalOpen(true);
    } catch (error) {
      console.error('Failed to fetch user details:', error);
      toast.error('Failed to load user details');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className={adminPageTitleClass}>User Management</h1>
        <p className={adminPageDescriptionClass}>
          Manage platform users and adjust their access without fighting the theme.
        </p>
      </div>

      <Card className={cn(adminSurfaceClass, 'p-6')}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_auto]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn('h-11 rounded-xl pl-11', adminInputClass)}
            />
          </div>

          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className={adminSelectClass}>
            <option value="">All roles</option>
            <option value="buyer">Buyer</option>
            <option value="seller">Seller</option>
            <option value="broker">Broker</option>
            <option value="admin">Admin</option>
          </select>

          <Button onClick={fetchUsers} className="h-11 rounded-xl px-5">
            Refresh
          </Button>
        </div>
      </Card>

      <Card className={cn(adminSurfaceClass, 'overflow-hidden')}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className={adminTableHeadClass}>
              <tr>
                <th className={adminTableHeaderCellClass}>Name</th>
                <th className={adminTableHeaderCellClass}>Email</th>
                <th className={adminTableHeaderCellClass}>Role</th>
                <th className={adminTableHeaderCellClass}>Phone</th>
                <th className={adminTableHeaderCellClass}>Joined</th>
                <th className={cn(adminTableHeaderCellClass, 'text-center')}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className={adminTableRowClass}>
                    <td className={adminStrongCellClass}>{user.display_name}</td>
                    <td className={adminTableCellClass}>{user.email}</td>
                    <td className={adminTableCellClass}>
                      {editingUser?.id === user.id ? (
                        <select
                          value={editingUser.newRole}
                          onChange={(e) => setEditingUser({ ...editingUser, newRole: e.target.value })}
                          className={cn(adminSelectClass, 'h-9 rounded-lg px-3 py-0 text-xs')}
                        >
                          <option value="buyer">Buyer</option>
                          <option value="seller">Seller</option>
                          <option value="broker">Broker</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span className={getRoleBadgeClass(user.role)}>{user.role}</span>
                      )}
                    </td>
                    <td className={adminTableCellClass}>{user.phone || 'Not added'}</td>
                    <td className={adminTableCellClass}>{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className={cn(adminTableCellClass, 'text-center')}>
                      {editingUser?.id === user.id ? (
                        <div className="flex justify-center gap-2">
                          <Button
                            size="sm"
                            className="rounded-lg"
                            onClick={() => handleUpdateRole(user.id, editingUser.newRole)}
                          >
                            Save
                          </Button>
                          <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setEditingUser(null)}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleViewUserDetails(user.id)}
                            className={adminIconButtonClass}
                            title="View details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingUser({ id: user.id, newRole: user.role })}
                            className={adminIconButtonClass}
                            title="Edit role"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button type="button" className={cn(adminIconButtonClass, 'opacity-45')} title="Delete user">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={userDetailsModalOpen} onOpenChange={setUserDetailsModalOpen}>
        <DialogContent className={cn(adminDialogContentClass, 'max-w-2xl')}>
          <DialogHeader>
            <DialogTitle className="text-xl text-slate-900 dark:text-slate-50">User Details</DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6">
              <div className={cn(adminSubtleSurfaceClass, 'flex flex-col gap-4 p-5 sm:flex-row sm:items-center')}>
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary">
                  {selectedUser.avatar_url ? (
                    <img
                      src={selectedUser.avatar_url}
                      alt={selectedUser.display_name}
                      className="h-16 w-16 rounded-2xl object-cover"
                    />
                  ) : (
                    <User size={30} />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                    {selectedUser.display_name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{selectedUser.email}</p>
                  <div className="mt-3">
                    <span className={getRoleBadgeClass(selectedUser.role)}>{selectedUser.role}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Contact Information</h4>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className={adminInsetPanelClass}>
                    <p className={adminFieldLabelClass}>Primary</p>
                    <div className="space-y-3 text-sm text-slate-700 dark:text-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Email:</span>
                        <span>{selectedUser.email}</span>
                      </div>
                      {selectedUser.phone && (
                        <div className="flex items-center gap-2">
                          <Phone size={16} className="text-slate-500 dark:text-slate-400" />
                          <span>{selectedUser.phone}</span>
                        </div>
                      )}
                      {selectedUser.whatsapp && (
                        <div className="flex items-center gap-2">
                          <MessageCircle size={16} className="text-slate-500 dark:text-slate-400" />
                          <span>{selectedUser.whatsapp}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={adminInsetPanelClass}>
                    <p className={adminFieldLabelClass}>Profile</p>
                    <div className="space-y-3 text-sm text-slate-700 dark:text-slate-200">
                      {selectedUser.city && (
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-slate-500 dark:text-slate-400" />
                          <span>{selectedUser.city}</span>
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Owner Type:</span>
                        <span className="ml-2">{selectedUser.owner_type || 'Not specified'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {selectedUser.bio && (
                <div>
                  <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Bio</h4>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-200">
                    {selectedUser.bio}
                  </p>
                </div>
              )}

              <div>
                <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Account Status</h4>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className={adminInsetPanelClass}>
                    <p className={adminFieldLabelClass}>Onboarding</p>
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset',
                        selectedUser.onboarded
                          ? 'bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/18 dark:text-emerald-200 dark:ring-emerald-400/20'
                          : 'bg-amber-100 text-amber-700 ring-amber-200 dark:bg-amber-500/18 dark:text-amber-200 dark:ring-amber-400/20',
                      )}
                    >
                      {selectedUser.onboarded ? 'Complete' : 'Pending'}
                    </span>
                  </div>
                  <div className={adminInsetPanelClass}>
                    <p className={adminFieldLabelClass}>Joined</p>
                    <p className="text-sm text-slate-700 dark:text-slate-200">
                      {new Date(selectedUser.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {selectedUser.preferences && Object.keys(selectedUser.preferences).length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Preferences</h4>
                  <div className={cn(adminInsetPanelClass, 'mt-4 overflow-x-auto')}>
                    <pre className="text-sm text-slate-700 dark:text-slate-200">
                      {JSON.stringify(selectedUser.preferences, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              <div className="border-t border-slate-200/80 pt-4 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                <div>Created: {new Date(selectedUser.created_at).toLocaleString()}</div>
                <div>Updated: {new Date(selectedUser.updated_at).toLocaleString()}</div>
              </div>

              <p className={adminNoteClass}>Delete controls are intentionally disabled here until that workflow is wired up.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
