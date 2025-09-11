import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Shield, 
  Users, 
  UserCheck,
  Settings,
  Lock,
  Unlock
} from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { User } from '@/types';

const availablePermissions = [
  { id: 'all', name: 'Acesso Total', description: 'Acesso completo ao sistema' },
  { id: 'read_clients', name: 'Visualizar Clientes', description: 'Pode visualizar informações dos clientes' },
  { id: 'write_clients', name: 'Editar Clientes', description: 'Pode criar e editar clientes' },
  { id: 'delete_clients', name: 'Excluir Clientes', description: 'Pode excluir clientes' },
  { id: 'read_vaccines', name: 'Visualizar Vacinas', description: 'Pode visualizar vacinas e lotes' },
  { id: 'write_vaccines', name: 'Editar Vacinas', description: 'Pode criar e editar vacinas' },
  { id: 'apply_vaccines', name: 'Aplicar Vacinas', description: 'Pode registrar aplicação de vacinas' },
  { id: 'manage_stock', name: 'Gerenciar Estoque', description: 'Pode gerenciar lotes e estoque' },
  { id: 'read_reports', name: 'Visualizar Relatórios', description: 'Pode acessar relatórios' },
  { id: 'manage_employees', name: 'Gerenciar Funcionários', description: 'Pode gerenciar funcionários' },
  { id: 'manage_permissions', name: 'Gerenciar Permissões', description: 'Pode alterar permissões de usuários' },
];

const roleTemplates = {
  admin: ['all'],
  funcionario: ['read_clients', 'write_clients', 'read_vaccines', 'read_reports'],
  vacinador: ['read_clients', 'apply_vaccines', 'read_vaccines'],
};

export const Permissoes: React.FC = () => {
  const [employees, setEmployees] = useLocalStorage<User[]>('vaxclinic_employees', []);
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    if (!selectedEmployee) return;

    let newPermissions = [...selectedEmployee.permissions];
    
    if (permissionId === 'all') {
      newPermissions = checked ? ['all'] : [];
    } else {
      if (checked) {
        // Remove 'all' if adding specific permission
        newPermissions = newPermissions.filter(p => p !== 'all');
        if (!newPermissions.includes(permissionId)) {
          newPermissions.push(permissionId);
        }
      } else {
        newPermissions = newPermissions.filter(p => p !== permissionId);
      }
    }

    const updatedEmployee = { ...selectedEmployee, permissions: newPermissions };
    setSelectedEmployee(updatedEmployee);
  };

  const savePermissions = () => {
    if (!selectedEmployee) return;

    const updatedEmployees = employees.map(emp => 
      emp.id === selectedEmployee.id ? selectedEmployee : emp
    );
    
    setEmployees(updatedEmployees);
    setIsEditing(false);
  };

  const applyRoleTemplate = (role: keyof typeof roleTemplates) => {
    if (!selectedEmployee) return;

    const permissions = roleTemplates[role];
    const updatedEmployee = { ...selectedEmployee, permissions, role };
    setSelectedEmployee(updatedEmployee);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'funcionario': return 'bg-blue-100 text-blue-800';
      case 'vacinador': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'funcionario': return 'Funcionário';
      case 'vacinador': return 'Vacinador';
      default: return role;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-medical-blue flex items-center gap-2">
            <Shield className="w-8 h-8" />
            Controle de Permissões
          </h1>
          <p className="text-muted-foreground">
            Gerencie as permissões de acesso dos funcionários
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employee List */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Funcionários
            </CardTitle>
            <CardDescription>
              Selecione um funcionário para gerenciar suas permissões
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {employees.map((employee) => (
                <div
                  key={employee.id}
                  className={`p-3 border rounded-lg cursor-pointer smooth-transition ${
                    selectedEmployee?.id === employee.id 
                      ? 'border-medical-blue bg-medical-blue/5' 
                      : 'hover:border-medical-gray'
                  }`}
                  onClick={() => {
                    setSelectedEmployee(employee);
                    setIsEditing(false);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{employee.name}</h3>
                      <p className="text-sm text-muted-foreground">{employee.email}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge className={getRoleBadgeColor(employee.role)}>
                        {getRoleLabel(employee.role)}
                      </Badge>
                      {employee.permissions.includes('all') ? (
                        <Unlock className="w-4 h-4 text-green-600" />
                      ) : (
                        <Lock className="w-4 h-4 text-orange-600" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Permissions Management */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Gerenciar Permissões
              {selectedEmployee && (
                <Badge variant="outline">{selectedEmployee.name}</Badge>
              )}
            </CardTitle>
            <CardDescription>
              {selectedEmployee 
                ? 'Configure as permissões específicas do funcionário'
                : 'Selecione um funcionário para configurar suas permissões'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedEmployee ? (
              <div className="text-center py-8">
                <UserCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Selecione um funcionário na lista ao lado
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Role Templates */}
                <div>
                  <h4 className="font-medium mb-3">Modelos de Permissão</h4>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => applyRoleTemplate('admin')}
                      disabled={!isEditing}
                    >
                      Administrador
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => applyRoleTemplate('funcionario')}
                      disabled={!isEditing}
                    >
                      Funcionário
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => applyRoleTemplate('vacinador')}
                      disabled={!isEditing}
                    >
                      Vacinador
                    </Button>
                  </div>
                </div>

                {/* Individual Permissions */}
                <div>
                  <h4 className="font-medium mb-3">Permissões Específicas</h4>
                  <div className="space-y-3">
                    {availablePermissions.map((permission) => (
                      <div key={permission.id} className="flex items-start space-x-3">
                        <Checkbox
                          id={permission.id}
                          checked={selectedEmployee.permissions.includes(permission.id)}
                          onCheckedChange={(checked) => 
                            handlePermissionChange(permission.id, checked as boolean)
                          }
                          disabled={!isEditing}
                        />
                        <div className="flex-1">
                          <label 
                            htmlFor={permission.id}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {permission.name}
                          </label>
                          <p className="text-xs text-muted-foreground">
                            {permission.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t">
                  {!isEditing ? (
                    <Button 
                      onClick={() => setIsEditing(true)}
                      className="medical-gradient text-white"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Editar Permissões
                    </Button>
                  ) : (
                    <>
                      <Button 
                        onClick={savePermissions}
                        className="medical-gradient text-white"
                      >
                        Salvar Alterações
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          // Reset to original employee data
                          const originalEmployee = employees.find(e => e.id === selectedEmployee.id);
                          if (originalEmployee) {
                            setSelectedEmployee(originalEmployee);
                          }
                        }}
                      >
                        Cancelar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Current Permissions Summary */}
      {selectedEmployee && (
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle>Resumo das Permissões Atuais</CardTitle>
            <CardDescription>
              Permissões ativas para {selectedEmployee.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {selectedEmployee.permissions.length === 0 ? (
                <Badge variant="destructive">Nenhuma permissão</Badge>
              ) : selectedEmployee.permissions.includes('all') ? (
                <Badge className="bg-green-100 text-green-800">
                  Acesso Total ao Sistema
                </Badge>
              ) : (
                selectedEmployee.permissions.map((permissionId) => {
                  const permission = availablePermissions.find(p => p.id === permissionId);
                  return permission ? (
                    <Badge key={permissionId} variant="secondary">
                      {permission.name}
                    </Badge>
                  ) : null;
                })
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};