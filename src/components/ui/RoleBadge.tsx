import React from 'react';
import { cn } from '@/lib/utils';

interface RoleBadgeProps {
  role: string;
  className?: string;
}

const RoleBadge: React.FC<RoleBadgeProps> = ({ role, className }) => {
  const getBadgeClass = (roleName: string): string => {
    const normalized = roleName.toUpperCase();
    switch (normalized) {
      case 'SUPERADMIN':
        return 'badge-superadmin';
      case 'ADMIN':
        return 'badge-admin';
      case 'EDITOR':
        return 'badge-editor';
      default:
        return 'badge-user';
    }
  };

  return (
    <span className={cn('badge-role', getBadgeClass(role), className)}>
      {role}
    </span>
  );
};

export default RoleBadge;
