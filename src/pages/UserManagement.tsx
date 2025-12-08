import React, { useState, useEffect } from 'react';
import { usersApi, rolesApi } from '@/services/api';
import { User, Role } from '@/types';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import RoleBadge from '@/components/ui/RoleBadge';
import { Plus, Pencil, Loader2, Users, RefreshCw, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const UserManagement: React.FC = () => {
  const { isAuthenticated, hasAnyRole, isLoading: authLoading, user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<(Role | string)[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create form state
  const [createForm, setCreateForm] = useState({
    username: '',
    email: '',
    password: '',
    roles: [] as string[],
  });

  // Edit form state
  const [editForm, setEditForm] = useState({
    email: '',
    roles: [] as string[],
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [usersData, rolesData] = await Promise.all([
        usersApi.getAll(),
        rolesApi.getAll(),
      ]);
      setUsers(usersData);
      setRoles(rolesData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Check authentication and permissions
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    if (!hasAnyRole(['SUPERADMIN', 'ADMIN'])) {
      toast({
        title: 'Access Denied',
        description: 'You need SUPERADMIN or ADMIN role to access user management',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    fetchData();
  }, [isAuthenticated, hasAnyRole, authLoading]);

  const handleCreateUser = async () => {
    if (!createForm.username || !createForm.email || !createForm.password) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await usersApi.create(createForm);
      toast({
        title: 'Success',
        description: 'User created successfully',
      });
      setIsCreateOpen(false);
      setCreateForm({ username: '', email: '', password: '', roles: [] });
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create user',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      await usersApi.updateRoles(selectedUser.id, { roles: editForm.roles });
      toast({
        title: 'Success',
        description: 'User roles updated successfully',
      });
      setIsEditOpen(false);
      setSelectedUser(null);
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update user',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      email: user.email,
      roles: user.roles,
    });
    setIsEditOpen(true);
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    try {
      await usersApi.delete(userId);
      toast({
        title: 'Success',
        description: `User "${username}" has been deleted successfully`,
      });
      fetchData();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete user';

      let title = 'Error';
      let description = errorMessage;

      // Handle specific error cases from backend
      if (error.response?.status === 400) {
        if (errorMessage.includes('own account')) {
          title = 'Cannot Delete Yourself';
          description = 'You cannot delete your own account.';
        } else {
          title = 'Invalid Request';
        }
      } else if (error.response?.status === 403) {
        title = 'Permission Denied';
        description = 'You do not have permission to delete this user. You can only delete users with lower role hierarchy.';
      } else if (error.response?.status === 404) {
        title = 'User Not Found';
        description = 'The user you are trying to delete no longer exists.';
      }

      toast({
        title,
        description,
        variant: 'destructive',
      });
    }
  };

  const toggleRole = (
    roleName: string,
    form: typeof createForm | typeof editForm,
    setForm: React.Dispatch<React.SetStateAction<typeof form>>
  ) => {
    const newRoles = form.roles.includes(roleName)
      ? form.roles.filter((r) => r !== roleName)
      : [...form.roles, roleName];
    setForm({ ...form, roles: newRoles });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage users and their role assignments
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Add a new user with role assignments
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="create-username">Username</Label>
                  <Input
                    id="create-username"
                    value={createForm.username}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, username: e.target.value })
                    }
                    placeholder="Enter username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-email">Email</Label>
                  <Input
                    id="create-email"
                    type="email"
                    value={createForm.email}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, email: e.target.value })
                    }
                    placeholder="Enter email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-password">Password</Label>
                  <Input
                    id="create-password"
                    type="password"
                    value={createForm.password}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, password: e.target.value })
                    }
                    placeholder="Enter password"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Assign Roles</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {roles.map((role) => {
                      const roleName = typeof role === 'string' ? role : role.name;
                      const roleKey = typeof role === 'string' ? role : role.id;
                      return (
                        <div
                          key={roleKey}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`create-role-${roleKey}`}
                            checked={createForm.roles.includes(roleName)}
                            onCheckedChange={() =>
                              toggleRole(roleName, createForm, setCreateForm)
                            }
                          />
                          <Label
                            htmlFor={`create-role-${roleKey}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {roleName}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateUser} disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Create User
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Users Table */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Users
          </CardTitle>
          <CardDescription>
            {users.filter(u => u.id !== user?.id).length} user{users.filter(u => u.id !== user?.id).length !== 1 ? 's' : ''} registered
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="table-header">ID</TableHead>
                    <TableHead className="table-header">Username</TableHead>
                    <TableHead className="table-header">Email</TableHead>
                    <TableHead className="table-header">Roles</TableHead>
                    <TableHead className="table-header text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.filter(u => u.id !== user?.id).map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-mono text-sm">
                        {user.id}
                      </TableCell>
                      <TableCell className="font-medium">
                        {user.username}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((role) => (
                            <RoleBadge key={role} role={role} />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(user)}
                            title="Edit user"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                title="Delete user"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete User</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete the user "{user.username}"?
                                  <br />
                                  <br />
                                  <strong>Warning:</strong> This action cannot be undone. The user account will be permanently removed.
                                  <br />
                                  <br />
                                  <strong>Permission Requirements:</strong> You can only delete users with lower role hierarchy than yourself.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteUser(user.id, user.username)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete User
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User Roles</DialogTitle>
            <DialogDescription>
              Update role assignments for {selectedUser?.username}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={editForm.email} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Assign Roles</Label>
              <div className="grid grid-cols-2 gap-2">
                {roles.map((role) => {
                  const roleName = typeof role === 'string' ? role : role.name;
                  const roleKey = typeof role === 'string' ? role : role.id;
                  return (
                    <div key={roleKey} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-role-${roleKey}`}
                        checked={editForm.roles.includes(roleName)}
                        onCheckedChange={() =>
                          toggleRole(roleName, editForm, setEditForm)
                        }
                      />
                      <Label
                        htmlFor={`edit-role-${roleKey}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {roleName}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditUser} disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
