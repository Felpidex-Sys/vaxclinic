import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Syringe,
  FileText,
  Calendar,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const navigationItems = [
  {
    title: 'Dashboard',
    url: '/',
    icon: LayoutDashboard,
    permissions: ['all'],
  },
  {
    title: 'Funcionários',
    url: '/funcionarios',
    icon: UserCheck,
    permissions: ['all', 'manage_employees'],
  },
  {
    title: 'Clientes',
    url: '/clientes',
    icon: Users,
    permissions: ['all', 'read_clients', 'write_clients'],
  },
  {
    title: 'Vacinas',
    url: '/vacinas',
    icon: Syringe,
    permissions: ['all', 'read_vaccines', 'write_vaccines', 'apply_vaccines'],
  },
  {
    title: 'Agendamentos',
    url: '/agendamentos',
    icon: Calendar,
    permissions: ['all', 'read_appointments', 'write_appointments'],
  },
  {
    title: 'Relatórios',
    url: '/relatorios',
    icon: FileText,
    permissions: ['all', 'read_reports'],
  },
];

export const AppSidebar: React.FC = () => {
  const { state } = useSidebar();
  const location = useLocation();
  const { user } = useAuth();
  
  const currentPath = location.pathname;
  const collapsed = state === 'collapsed';
  
  const hasPermission = (itemPermissions: string[]) => {
    if (!user) return false;
    if (user.permissions.includes('all')) return true;
    return itemPermissions.some(permission => user.permissions.includes(permission));
  };

  const isActive = (path: string) => {
    if (path === '/') return currentPath === '/';
    return currentPath.startsWith(path);
  };

  const getNavClass = (path: string) => {
    const active = isActive(path);
    return active 
      ? 'bg-medical-blue text-white font-medium hover:bg-medical-blue/90' 
      : 'hover:bg-medical-gray/20 text-sidebar-foreground/70 hover:text-sidebar-foreground';
  };

  const visibleItems = navigationItems.filter(item => hasPermission(item.permissions));

  return (
    <Sidebar className={collapsed ? 'w-14' : 'w-64'}>
      <SidebarContent className="bg-sidebar">
        <div className="p-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-medical-blue rounded-lg flex items-center justify-center">
              <Syringe className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div>
                <h2 className="font-bold text-sidebar-foreground">VixClinic</h2>
                <p className="text-xs text-sidebar-foreground/70">Sistema de Vacinação</p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/80">
            {!collapsed && 'Navegação'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${getNavClass(item.url)}`}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};