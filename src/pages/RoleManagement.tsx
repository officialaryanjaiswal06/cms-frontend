import React, { useState, useEffect } from 'react';
import { rolesApi, modulesApi } from '@/services/api';
import { Role, Module, PermissionDto } from '@/types';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import RoleBadge from '@/components/ui/RoleBadge';
import {
  Plus,
  Trash2,
  Loader2,
  Shield,
  Save,
  RefreshCw,
  Package,
} from 'lucide-react';

const PROTECTED_ROLES = ['SUPERADMIN', 'USER'];

const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<PermissionDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [newModuleName, setNewModuleName] = useState('');
  const [isCreateModuleOpen, setIsCreateModuleOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const fetchRolesAndModules = async () => {
    setIsLoading(true);
    try {
      const [rolesData, modulesData] = await Promise.all([
        rolesApi.getAll(),
        modulesApi.getAll(),
      ]);
      setRoles(rolesData);
      setModules(modulesData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch roles and modules',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPermissions = async (roleId: number) => {
    setIsLoadingPermissions(true);
    try {
      const data = await rolesApi.getPermissions(roleId);
      
      // Create permission entries for all modules
      const permissionMap = new Map(data.map((p) => [p.moduleName, p]));
      const allPermissions = modules.map((module) => {
        const existing = permissionMap.get(module.moduleName);
        return existing || {
          moduleName: module.moduleName,
          canSelect: false,
          canCreate: false,
          canUpdate: false,
          canDelete: false,
        };
      });
      
      setPermissions(allPermissions);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch permissions',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingPermissions(false);
    }
  };

  useEffect(() => {
    fetchRolesAndModules();
  }, []);

  useEffect(() => {
    if (selectedRole && modules.length > 0) {
      fetchPermissions(selectedRole.id);
    }
  }, [selectedRole, modules]);

  const handleRoleSelect = (roleId: string) => {
    const role = roles.find((r) => r.id.toString() === roleId);
    setSelectedRole(role || null);
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a role name',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    try {
      await rolesApi.create({ name: newRoleName.trim() });
      toast({
        title: 'Success',
        description: 'Role created successfully',
      });
      setNewRoleName('');
      setIsCreateRoleOpen(false);
      fetchRolesAndModules();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create role',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteRole = async (roleId: number) => {
    try {
      await rolesApi.delete(roleId);
      toast({
        title: 'Success',
        description: 'Role deleted successfully',
      });
      if (selectedRole?.id === roleId) {
        setSelectedRole(null);
        setPermissions([]);
      }
      fetchRolesAndModules();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete role',
        variant: 'destructive',
      });
    }
  };

  const handleCreateModule = async () => {
    if (!newModuleName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a module name',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    try {
      await modulesApi.create({ moduleName: newModuleName.trim() });
      toast({
        title: 'Success',
        description: 'Module created successfully',
      });
      setNewModuleName('');
      setIsCreateModuleOpen(false);
      fetchRolesAndModules();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create module',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteModule = async (moduleId: number) => {
    try {
      await modulesApi.delete(moduleId);
      toast({
        title: 'Success',
        description: 'Module deleted successfully',
      });
      fetchRolesAndModules();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete module',
        variant: 'destructive',
      });
    }
  };

  const togglePermission = (
    moduleName: string,
    field: keyof Omit<PermissionDto, 'moduleName'>
  ) => {
    setPermissions((prev) =>
      prev.map((p) =>
        p.moduleName === moduleName ? { ...p, [field]: !p[field] } : p
      )
    );
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;

    setIsSaving(true);
    try {
      await rolesApi.updatePermissions(selectedRole.id, permissions);
      toast({
        title: 'Success',
        description: 'Permissions updated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save permissions',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isProtectedRole = (roleName: string) =>
    PROTECTED_ROLES.includes(roleName.toUpperCase());

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Roles & Permissions</h1>
          <p className="text-muted-foreground mt-1">
            Manage roles and configure granular permissions per module
          </p>
        </div>
        <Button variant="outline" onClick={fetchRolesAndModules} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Roles Panel */}
        <Card className="card-elevated lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Roles
              </CardTitle>
              <CardDescription>Manage system roles</CardDescription>
            </div>
            <Dialog open={isCreateRoleOpen} onOpenChange={setIsCreateRoleOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Role</DialogTitle>
                  <DialogDescription>
                    Enter a name for the new role. It will be converted to uppercase.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="role-name">Role Name</Label>
                    <Input
                      id="role-name"
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      placeholder="e.g., Editor, Manager"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateRoleOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateRole} disabled={isCreating}>
                    {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create Role
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-2">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className={`flex items-center justify-between p-3 rounded-md border transition-colors cursor-pointer ${
                      selectedRole?.id === role.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                    }`}
                    onClick={() => handleRoleSelect(role.id.toString())}
                  >
                    <RoleBadge role={role.name} />
                    {!isProtectedRole(role.name) && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Role</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete the role "{role.name}"?
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteRole(role.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Permissions Matrix */}
        <Card className="card-elevated lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle>Permission Matrix</CardTitle>
              <CardDescription>
                {selectedRole
                  ? `Configure permissions for ${selectedRole.name}`
                  : 'Select a role to configure permissions'}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Dialog open={isCreateModuleOpen} onOpenChange={setIsCreateModuleOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Package className="h-4 w-4 mr-2" />
                    Add Module
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Module</DialogTitle>
                    <DialogDescription>
                      Enter a name for the new module
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="module-name">Module Name</Label>
                      <Input
                        id="module-name"
                        value={newModuleName}
                        onChange={(e) => setNewModuleName(e.target.value)}
                        placeholder="e.g., Academic, Gallery"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateModuleOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleCreateModule} disabled={isCreating}>
                      {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Add Module
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {selectedRole && (
                <Button onClick={handleSavePermissions} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedRole ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Shield className="h-12 w-12 mb-4 opacity-50" />
                <p>Select a role from the left panel to configure permissions</p>
              </div>
            ) : isLoadingPermissions ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : modules.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mb-4 opacity-50" />
                <p>No modules available. Create a module to get started.</p>
              </div>
            ) : (
              <div className="rounded-md border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="table-header w-[200px]">Module</TableHead>
                      <TableHead className="table-header text-center">Select (Read)</TableHead>
                      <TableHead className="table-header text-center">Create</TableHead>
                      <TableHead className="table-header text-center">Update</TableHead>
                      <TableHead className="table-header text-center">Delete</TableHead>
                      <TableHead className="table-header w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permissions.map((perm) => {
                      const module = modules.find((m) => m.moduleName === perm.moduleName);
                      return (
                        <TableRow key={perm.moduleName}>
                          <TableCell className="font-medium">{perm.moduleName}</TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={perm.canSelect}
                              onCheckedChange={() =>
                                togglePermission(perm.moduleName, 'canSelect')
                              }
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={perm.canCreate}
                              onCheckedChange={() =>
                                togglePermission(perm.moduleName, 'canCreate')
                              }
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={perm.canUpdate}
                              onCheckedChange={() =>
                                togglePermission(perm.moduleName, 'canUpdate')
                              }
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={perm.canDelete}
                              onCheckedChange={() =>
                                togglePermission(perm.moduleName, 'canDelete')
                              }
                            />
                          </TableCell>
                          <TableCell>
                            {module && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Module</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete the module "{perm.moduleName}"?
                                      This will remove all associated permissions.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteModule(module.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RoleManagement;
