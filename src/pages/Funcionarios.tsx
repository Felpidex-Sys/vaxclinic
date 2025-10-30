import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  UserCheck, 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  Shield,
  Users
} from 'lucide-react';
import { User } from '@/types';
import { useNavigate } from 'react-router-dom';
import { EmployeeForm } from '@/components/forms/EmployeeForm';
import { useToast } from '@/hooks/use-toast';
import { displayCPF } from '@/lib/validations';
import { supabase } from '@/integrations/supabase/client';

export const Funcionarios: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<User | undefined>();

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('funcionario')
        .select('*')
        .order('nomecompleto', { ascending: true });

      if (error) throw error;

      const mappedEmployees: User[] = (data || []).map(func => ({
        id: func.idfuncionario.toString(),
        name: func.nomecompleto,
        email: func.email,
        cpf: func.cpf,
        role: (func.cargo || 'funcionario') as 'admin' | 'funcionario' | 'vacinador',
        permissions: [],
        active: func.status === 'ATIVO',
        createdAt: new Date().toISOString(),
      }));

      setEmployees(mappedEmployees);
    } catch (error) {
      console.error('Erro ao buscar funcionários:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os funcionários.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.cpf.includes(searchTerm)
  );

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

  const handleSaveEmployee = async (employeeData: Omit<User, 'id' | 'createdAt'>) => {
    try {
      if (editingEmployee) {
        const { error } = await supabase
          .from('funcionario')
          .update({
            nomecompleto: employeeData.name,
            email: employeeData.email,
            cargo: employeeData.role,
            status: employeeData.active ? 'ATIVO' : 'INATIVO',
          })
          .eq('idfuncionario', parseInt(editingEmployee.id));

        if (error) throw error;

        toast({
          title: 'Funcionário atualizado',
          description: 'Os dados foram atualizados com sucesso.',
        });
      } else {
        const { error } = await supabase
          .from('funcionario')
          .insert({
            cpf: employeeData.cpf,
            nomecompleto: employeeData.name,
            email: employeeData.email,
            cargo: employeeData.role,
            senha: 'senha123',
            status: 'ATIVO',
          });

        if (error) throw error;

        toast({
          title: 'Funcionário cadastrado',
          description: 'O funcionário foi adicionado com sucesso.',
        });
      }

      setEditingEmployee(undefined);
      setShowForm(false);
      fetchEmployees();
    } catch (error: any) {
      console.error('Erro ao salvar funcionário:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível salvar o funcionário.',
        variant: 'destructive',
      });
    }
  };

  const handleEditEmployee = (employee: User) => {
    setEditingEmployee(employee);
    setShowForm(true);
  };

  const handleDeleteEmployee = async (employee: User) => {
    if (confirm(`Tem certeza que deseja excluir o funcionário ${employee.name}?`)) {
      try {
        const { error } = await supabase
          .from('funcionario')
          .delete()
          .eq('idfuncionario', parseInt(employee.id));

        if (error) throw error;

        toast({
          title: 'Funcionário excluído',
          description: `${employee.name} foi removido do sistema.`,
        });

        fetchEmployees();
      } catch (error: any) {
        console.error('Erro ao excluir funcionário:', error);
        toast({
          title: 'Erro',
          description: error.message || 'Não foi possível excluir o funcionário.',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-medical-blue flex items-center gap-2">
            <UserCheck className="w-8 h-8" />
            Gestão de Funcionários
          </h1>
          <p className="text-muted-foreground">
            Gerencie a equipe e suas permissões
          </p>
        </div>
        
        <Button 
          className="medical-gradient text-white"
          onClick={() => {
            setEditingEmployee(undefined);
            setShowForm(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Funcionário
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="card-shadow">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por nome, email ou CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="card-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-medical-blue" />
              <div>
                <p className="text-2xl font-bold text-medical-blue">{employees.length}</p>
                <p className="text-sm text-muted-foreground">Total de Funcionários</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">{employees.filter(e => e.active).length}</p>
                <p className="text-sm text-muted-foreground">Funcionários Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{employees.filter(e => e.role === 'admin').length}</p>
                <p className="text-sm text-muted-foreground">Administradores</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employees List */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle>Lista de Funcionários</CardTitle>
          <CardDescription>
            {filteredEmployees.length} funcionário(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Carregando funcionários...</p>
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="text-center py-8">
                <UserCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum funcionário encontrado</p>
              </div>
            ) : (
              filteredEmployees.map((employee) => (
                <div
                  key={employee.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md smooth-transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-medical-blue/10 rounded-full flex items-center justify-center">
                      <UserCheck className="w-6 h-6 text-medical-blue" />
                    </div>
                    
                    <div>
                      <h3 className="font-semibold">{employee.name}</h3>
                      <p className="text-sm text-muted-foreground">{employee.email}</p>
                      <p className="text-sm text-muted-foreground">
                        CPF: {displayCPF(employee.cpf)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <Badge className={getRoleBadgeColor(employee.role)}>
                        {getRoleLabel(employee.role)}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-1">
                        {employee.active ? 'Ativo' : 'Inativo'}
                      </p>
                    </div>

                    {employee.role !== 'admin' && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditEmployee(employee)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteEmployee(employee)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Employee Form Modal */}
      <EmployeeForm
        open={showForm}
        onOpenChange={setShowForm}
        employee={editingEmployee}
        onSave={handleSaveEmployee}
      />
    </div>
  );
};