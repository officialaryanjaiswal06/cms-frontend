import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import RoleBadge from '@/components/ui/RoleBadge';
import { Users, Shield, Key, Activity } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user, roles, permissions } = useAuth();

  const stats = [
    {
      title: 'Your Roles',
      value: roles.length,
      description: 'Active role assignments',
      icon: Shield,
      color: 'text-primary',
    },
    {
      title: 'Permissions',
      value: permissions.length,
      description: 'Granted access rights',
      icon: Key,
      color: 'text-success',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {user?.username || 'User'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="card-elevated">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* User Info Card */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Your Profile
            </CardTitle>
            <CardDescription>Current account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Username</p>
                <p className="font-medium text-foreground">{user?.username}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium text-foreground">{user?.email}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Assigned Roles</p>
              <div className="flex flex-wrap gap-2">
                {roles.map((role) => (
                  <RoleBadge key={role} role={role} />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              System Status
            </CardTitle>
            <CardDescription>Backend connection status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-success animate-pulse" />
              <span className="text-foreground">API Connected</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-success animate-pulse" />
              <span className="text-foreground">Authentication Active</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Connected to http://localhost:8080
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Permissions Overview */}
      {permissions.length > 0 && (
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              Your Permissions
            </CardTitle>
            <CardDescription>
              Granular access rights based on your roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {permissions.map((permission) => (
                <span
                  key={permission}
                  className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono bg-muted text-muted-foreground"
                >
                  {permission}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
