import React from 'react';
import { Users, Mail, Shield, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface UserInfoProps {
  usuario?: {
    firstname: string;
    lastname: string;
    email: string;
    role?: string;
  };
  ip?: string;
  fechaCreacion: string;
}

const UserInfo: React.FC<UserInfoProps> = ({ usuario, ip, fechaCreacion }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getRoleColor = (role?: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'manager':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'employee':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'user':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-muted-foreground bg-gray-50 rounded-md p-3 border">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {usuario ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span className="font-medium text-gray-700">
                {usuario.firstname} {usuario.lastname}
              </span>
            </div>
            <div className="flex items-center gap-1 text-gray-500">
              <Mail className="h-3 w-3" />
              <span>{usuario.email}</span>
            </div>
            {usuario.role && (
              <Badge
                variant="outline"
                className={`text-xs ${getRoleColor(usuario.role)}`}
              >
                <Shield className="h-2 w-2 mr-1" />
                {usuario.role.toUpperCase()}
              </Badge>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span className="font-medium text-gray-700">Sistema</span>
            <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700 border-purple-200">
              <Shield className="h-2 w-2 mr-1" />
              SYSTEM
            </Badge>
          </div>
        )}

        {ip && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span>IP: {ip}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 text-gray-500">
        <Clock className="h-3 w-3" />
        <span>{formatDate(fechaCreacion)}</span>
      </div>
    </div>
  );
};

export default UserInfo;
