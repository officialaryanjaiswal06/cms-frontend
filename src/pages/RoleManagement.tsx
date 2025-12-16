import React, { useState, useEffect } from 'react';
import { rolesApi, modulesApi } from '@/services/api';
import { Role, Module, PermissionDto } from '@/types';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
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

const PROTECTED_ROLES = ['SUPERADMIN', 'ADMIN', 'USER'];

const RoleManagement: React.FC = () => {
  const { isAuthenticated, hasAnyRole, isLoading: authLoading } = useAuth();
  const [roles, setRoles] = useState<(Role | string)[]>([]);
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
      // Fetch Roles first
      let rolesData;
      try {
        rolesData = await rolesApi.getAll();
      } catch (error) {
        console.error('Error fetching roles:', error);
        throw error; // Roles are critical, rethrow
      }

      // Fetch Modules separately to handle 403 independently
      let modulesData: Module[] = [];
      try {
        modulesData = await modulesApi.getAll();
      } catch (error: any) {
        console.warn('⚠️ Failed to fetch modules (API blocked?). Using fallback or empty list.', error);
        if (error.response?.status === 403 || error.response?.status === 401) {
          toast({
            title: 'Backend Restriction',
            description: 'Cannot fetch specific modules due to backend restrictions (403 Forbidden). Permission matrix may be incomplete.',
            variant: 'default', // 'warning' is not a valid variant
            className: 'bg-yellow-100 text-yellow-900 border-yellow-200' // Custom styling for warning look
          });

          // If API fails, try to derive from Admin's permissions AS A FALLBACK (Same logic as Sidebar)
          // But remember, this only shows what the ADMIN can see, not necessarily all modules.
          // Better than nothing.
          /*  
            Assuming we can't get all modules, we can't accurately manage permissions for *other* modules.
            So we leave modulesData as empty or derived.
          */
        } else {
          throw error; // Real error
        }
      }

      console.log('Fetched roles:', rolesData);
      console.log('Fetched modules:', modulesData);
      console.log('Role data types:', rolesData.map((r: any) => ({ value: r, type: typeof r })));

      // Handle both string[] and Role[] formats from backend
      const processedRoles = rolesData.map((role: any) => {
        if (typeof role === 'string') {
          // Backend returned strings - this is the issue!
          console.warn('⚠️ Backend returned role as string:', role, '- This will cause 404 errors when fetching permissions');
          return { id: 0, name: role }; // Temporary fix, but backend should return proper objects
        } else if (typeof role === 'object' && role.id && role.name) {
          // Backend returned proper Role objects
          return role;
        } else {
          console.warn('Unknown role format:', role);
          return role;
        }
      });

      // Check if currently selected role still exists after refresh
      if (selectedRole) {
        const roleStillExists = processedRoles.some((role: any) =>
          (role.id && selectedRole.id && role.id === selectedRole.id) ||
          (role.name === selectedRole.name)
        );

        if (!roleStillExists) {
          console.log('⚠️ Selected role no longer exists, clearing selection');
          setSelectedRole(null);
          setPermissions([]);
        }
      }

      setRoles(processedRoles);
      setModules(modulesData);
    } catch (error: any) {
      console.error('Error fetching roles and modules:', error);
      toast({
        title: 'Error',
        description: `Failed to fetch roles and modules: ${error.response?.data?.message || error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPermissions = async (roleId: number) => {
    console.log('🔍 fetchPermissions called with roleId:', roleId);

    if (roleId <= 0) {
      console.warn('🚫 Skipping fetchPermissions for invalid roleId:', roleId);
      return;
    }

    setIsLoadingPermissions(true);
    try {
      console.log('📡 Fetching permissions for role ID:', roleId);
      const data = await rolesApi.getPermissions(roleId);
      console.log('✅ Received permissions data:', data);

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

      console.log('📋 Setting permissions:', allPermissions);
      setPermissions(allPermissions);
    } catch (error: any) {
      console.error('❌ Error fetching permissions:', error);
      console.error('❌ Error response:', error.response?.data, error.response?.status);
      toast({
        title: 'Error',
        description: `Failed to fetch permissions: ${error.response?.data?.message || error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoadingPermissions(false);
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
        description: 'You need SUPERADMIN or ADMIN role to access role management',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    fetchRolesAndModules();
  }, [isAuthenticated, hasAnyRole, authLoading]);

  useEffect(() => {
    console.log('🔄 useEffect triggered - selectedRole:', selectedRole, 'modules.length:', modules.length);

    if (modules.length > 0) {
      if (selectedRole && selectedRole.id > 0) {
        console.log('✅ Fetching permissions for valid role ID:', selectedRole.id);
        // Only fetch permissions for roles with valid IDs
        fetchPermissions(selectedRole.id);
      } else {
        console.log('⚠️ Using default permissions - selectedRole:', selectedRole, 'ID:', selectedRole?.id);
        // Initialize with default permissions (all modules with false permissions)
        const defaultPermissions = modules.map((module) => ({
          moduleName: module.moduleName,
          canSelect: false,
          canCreate: false,
          canUpdate: false,
          canDelete: false,
        }));
        setPermissions(defaultPermissions);
      }
    } else {
      console.log('📭 No modules loaded yet, skipping permission setup');
    }
  }, [selectedRole, modules]);

  const handleRoleSelect = (role: Role | string) => {
    console.log('🎯 handleRoleSelect called with:', role, 'Type:', typeof role);

    if (typeof role === 'string') {
      console.log('🔄 Converting string role to object with ID 0:', role);
      // Convert string to Role object for consistency
      const roleObject = { id: 0, name: role };
      console.log('📝 Setting selectedRole to:', roleObject);
      setSelectedRole(roleObject);
    } else {
      console.log('✅ Setting selectedRole to existing object with ID:', role.id);
      setSelectedRole(role);
    }
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
      // Clear selected role immediately to prevent permission fetching
      if (selectedRole?.id === roleId) {
        setSelectedRole(null);
        setPermissions([]);
      }
      // Refresh data after clearing selection
      await fetchRolesAndModules();
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
    if (!selectedRole) return; // Don't allow toggling when no role is selected

    // Allow toggling even for roles with ID 0, but saving will be prevented
    setPermissions((prev) =>
      prev.map((p) =>
        p.moduleName === moduleName ? { ...p, [field]: !p[field] } : p
      )
    );
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;

    if (selectedRole.id <= 0) {
      toast({
        title: 'Cannot Save Permissions',
        description: `Cannot save permissions for "${selectedRole.name}" because this role has no valid ID. Please refresh the page to load proper role data.`,
        variant: 'destructive',
      });
      return;
    }

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


  const isProtectedRole = (role: Role | string) => {
    const roleName = typeof role === 'string' ? role : role.name;
    return PROTECTED_ROLES.includes(roleName.toUpperCase());
  };

  const getRoleName = (role: Role | string) => typeof role === 'string' ? role : role.name;
  const getRoleId = (role: Role | string) => typeof role === 'string' ? role : role.id;

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
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchRolesAndModules} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
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
                {roles.map((role) => {
                  const roleName = getRoleName(role);
                  const roleId = getRoleId(role);
                  const isSelected = selectedRole?.name === roleName;
                  return (
                    <div
                      key={roleId}
                      className={`flex items-center justify-between p-3 rounded-md border transition-colors cursor-pointer ${isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                        }`}
                      onClick={() => handleRoleSelect(role)}
                    >
                      <RoleBadge role={roleName} />
                      {!isProtectedRole(role) && typeof role !== 'string' && (
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
                                Are you sure you want to delete the role "{roleName}"?
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
                  );
                })}
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
                <Button
                  onClick={handleSavePermissions}
                  disabled={isSaving || selectedRole.id <= 0}
                  title={selectedRole.id <= 0 ? "Cannot save permissions for roles with invalid IDs. Fix backend to return proper role objects." : "Save permission changes"}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {selectedRole.id <= 0 ? "Save Disabled" : "Save"}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingPermissions ? (
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
                    {modules.map((module) => {
                      // Find existing permission or use default empty permission
                      const permission = permissions.find(p => p.moduleName === module.moduleName) || {
                        moduleName: module.moduleName,
                        canSelect: false,
                        canCreate: false,
                        canUpdate: false,
                        canDelete: false,
                      };

                      return (
                        <TableRow key={module.moduleName}>
                          <TableCell className="font-medium">{module.moduleName}</TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={permission.canSelect}
                              onCheckedChange={() =>
                                selectedRole ? togglePermission(module.moduleName, 'canSelect') : undefined
                              }
                              disabled={!selectedRole}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={permission.canCreate}
                              onCheckedChange={() =>
                                selectedRole ? togglePermission(module.moduleName, 'canCreate') : undefined
                              }
                              disabled={!selectedRole}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={permission.canUpdate}
                              onCheckedChange={() =>
                                selectedRole ? togglePermission(module.moduleName, 'canUpdate') : undefined
                              }
                              disabled={!selectedRole}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={permission.canDelete}
                              onCheckedChange={() =>
                                selectedRole ? togglePermission(module.moduleName, 'canDelete') : undefined
                              }
                              disabled={!selectedRole}
                            />
                          </TableCell>
                          <TableCell>
                            {!['Notification', 'Notifications'].includes(module.moduleName) && (
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
                                      Are you sure you want to delete the module "{module.moduleName}"?
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
                {(!selectedRole || (selectedRole && selectedRole.id <= 0)) && (
                  <div className="p-4 bg-muted/30 border-t">
                    <p className="text-sm text-muted-foreground text-center">
                      {selectedRole && selectedRole.id <= 0
                        ? `Permissions shown for "${selectedRole.name}", but saving is disabled. Backend must return role objects with valid IDs.`
                        : 'Select a role from the left panel to configure permissions'
                      }
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RoleManagement;
