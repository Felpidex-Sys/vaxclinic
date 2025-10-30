import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Calendar,
  Plus,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Edit,
  Trash2
} from 'lucide-react';
import { Agendamento, Client, VaccineBatch, User as UserType, Lote } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { AgendamentoForm } from '@/components/forms/AgendamentoForm';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from 'react-router-dom';

export const Agendamentos: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [batches, setBatches] = useState<Lote[]>([]);
  const [employees, setEmployees] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAgendamento, setEditingAgendamento] = useState<Agendamento | null>(null);

  useEffect(() => {
    fetchData();
    // Se vier de Clientes com CPF, abrir o form
    if (location.state?.clientCPF) {
      setIsFormOpen(true);
    }
  }, [location.state]);

  const fetchData = async () => {
    try {
      const [agendamentosData, clientsData, lotesData, employeesData] = await Promise.all([
        supabase.from('agendamento').select('*').order('dataagendada', { ascending: true }),
        supabase.from('cliente').select('*'),
        supabase.from('lote').select('*'),
        supabase.from('funcionario').select('*'),
      ]);

      if (agendamentosData.error) throw agendamentosData.error;
      if (clientsData.error) throw clientsData.error;
      if (lotesData.error) throw lotesData.error;
      if (employeesData.error) throw employeesData.error;

      const mappedAgendamentos: Agendamento[] = (agendamentosData.data || []).map(a => ({
        idAgendamento: a.idagendamento,
        dataAgendada: a.dataagendada,
        status: a.status as 'AGENDADO' | 'REALIZADO',
        observacoes: a.observacoes || '',
        Cliente_CPF: parseInt(a.cliente_cpf),
        Funcionario_idFuncionario: a.funcionario_idfuncionario,
        Lote_numLote: a.lote_numlote,
      }));

      const mappedClients: Client[] = (clientsData.data || []).map(c => ({
        id: c.cpf,
        name: c.nomecompleto,
        cpf: c.cpf,
        dateOfBirth: c.datanasc || '',
        phone: c.telefone || '',
        email: c.email || '',
        address: '',
        allergies: c.alergias || '',
        observations: c.observacoes || '',
        createdAt: new Date().toISOString(),
      }));

      const mappedLotes: Lote[] = (lotesData.data || []).map(l => ({
        numLote: l.numlote,
        codigoLote: l.codigolote,
        quantidadeInicial: l.quantidadeinicial,
        quantidadeDisponivel: l.quantidadedisponivel,
        dataValidade: l.datavalidade,
        Vacina_idVacina: l.vacina_idvacina,
      }));

      const mappedEmployees: UserType[] = (employeesData.data || []).map(e => ({
        id: e.idfuncionario.toString(),
        name: e.nomecompleto,
        email: e.email,
        cpf: e.cpf,
        role: 'funcionario' as const,
        permissions: ['all'],
        active: e.status === 'ATIVO',
        createdAt: e.dataadmissao || new Date().toISOString(),
      }));

      setAgendamentos(mappedAgendamentos);
      setClients(mappedClients);
      setBatches(mappedLotes);
      setEmployees(mappedEmployees);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os agendamentos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredAgendamentos = agendamentos.filter(agendamento => {
    const client = clients.find(c => c.cpf === agendamento.Cliente_CPF.toString());
    
    const matchesSearch = !searchTerm || 
      client?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || agendamento.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleSaveAgendamento = async (agendamentoData: Omit<Agendamento, 'idAgendamento'>) => {
    try {
      if (editingAgendamento) {
        const { error } = await supabase
          .from('agendamento')
          .update({
            dataagendada: agendamentoData.dataAgendada,
            status: agendamentoData.status,
            observacoes: agendamentoData.observacoes,
            cliente_cpf: agendamentoData.Cliente_CPF.toString(),
            funcionario_idfuncionario: agendamentoData.Funcionario_idFuncionario,
            lote_numlote: agendamentoData.Lote_numLote,
          })
          .eq('idagendamento', editingAgendamento.idAgendamento);

        if (error) throw error;

        toast({
          title: "Agendamento atualizado",
          description: "O agendamento foi atualizado com sucesso.",
        });
      } else {
        const { error } = await supabase
          .from('agendamento')
          .insert({
            dataagendada: agendamentoData.dataAgendada,
            status: agendamentoData.status,
            observacoes: agendamentoData.observacoes,
            cliente_cpf: agendamentoData.Cliente_CPF.toString(),
            funcionario_idfuncionario: agendamentoData.Funcionario_idFuncionario,
            lote_numlote: agendamentoData.Lote_numLote,
          });

        if (error) throw error;

        toast({
          title: "Agendamento criado",
          description: "O agendamento foi criado com sucesso.",
        });
      }
      
      setEditingAgendamento(null);
      fetchData();
    } catch (error: any) {
      console.error('Erro ao salvar agendamento:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar o agendamento.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (agendamento: Agendamento) => {
    setEditingAgendamento(agendamento);
    setIsFormOpen(true);
  };

  const handleDelete = async (idAgendamento: number) => {
    if (confirm('Tem certeza que deseja excluir este agendamento?')) {
      try {
        const { error } = await supabase
          .from('agendamento')
          .delete()
          .eq('idagendamento', idAgendamento);

        if (error) throw error;

        toast({
          title: "Agendamento excluído",
          description: "O agendamento foi excluído com sucesso.",
        });
        fetchData();
      } catch (error: any) {
        console.error('Erro ao excluir agendamento:', error);
        toast({
          title: "Erro",
          description: error.message || "Não foi possível excluir o agendamento.",
          variant: "destructive",
        });
      }
    }
  };

  const updateStatus = async (idAgendamento: number, status: Agendamento['status']) => {
    try {
      const { error } = await supabase
        .from('agendamento')
        .update({ status })
        .eq('idagendamento', idAgendamento);

      if (error) throw error;

      toast({
        title: "Status atualizado",
        description: `Agendamento marcado como ${status.toLowerCase()}.`,
      });
      fetchData();
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: Agendamento['status']) => {
    switch (status) {
      case 'AGENDADO':
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" />Agendado</Badge>;
      case 'REALIZADO':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Realizado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-medical-blue">Agendamentos</h1>
          <p className="text-muted-foreground">
            Gerencie os agendamentos de vacinação
          </p>
        </div>
        
        <Button 
          className="medical-gradient text-white"
          onClick={() => {
            setEditingAgendamento(null);
            setIsFormOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Agendamento
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="card-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-medical-blue" />
              <div>
                <p className="text-2xl font-bold text-medical-blue">{agendamentos.length}</p>
                <p className="text-sm text-muted-foreground">Total de Agendamentos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {agendamentos.filter(a => a.status === 'AGENDADO').length}
                </p>
                <p className="text-sm text-muted-foreground">Agendados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {agendamentos.filter(a => a.status === 'REALIZADO').length}
                </p>
                <p className="text-sm text-muted-foreground">Realizados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Buscar por cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="w-full sm:w-48">
              <Label>Status</Label>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">Todos</option>
                <option value="AGENDADO">Agendado</option>
                <option value="REALIZADO">Realizado</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agendamentos List */}
      <div className="grid gap-4">
        {loading ? (
          <Card className="card-shadow">
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Carregando agendamentos...</p>
            </CardContent>
          </Card>
        ) : filteredAgendamentos.length === 0 ? (
          <Card className="card-shadow">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground mb-2">
                Nenhum agendamento encontrado
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Crie seu primeiro agendamento'}
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Button 
                  className="medical-gradient text-white"
                  onClick={() => setIsFormOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Agendamento
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredAgendamentos.map((agendamento) => {
            const client = clients.find(c => c.cpf === agendamento.Cliente_CPF.toString());
            const batch = batches.find(b => b.numLote === agendamento.Lote_numLote);
            const funcionario = employees.find(e => parseInt(e.id) === agendamento.Funcionario_idFuncionario);
            
            return (
              <Card key={agendamento.idAgendamento} className="card-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Calendar className="w-5 h-5 text-medical-blue" />
                        <div>
                          <h3 className="font-semibold text-lg">{client?.name || 'Cliente não encontrado'}</h3>
                          <p className="text-sm text-muted-foreground">
                            Lote {batch?.codigoLote || 'não encontrado'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span>
                            {new Date(agendamento.dataAgendada).toLocaleDateString('pt-BR')} às{' '}
                            {new Date(agendamento.dataAgendada).toLocaleTimeString('pt-BR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span>{funcionario?.name || 'Funcionário não encontrado'}</span>
                        </div>
                      </div>
                      
                      {agendamento.observacoes && (
                        <div className="mt-3 p-3 bg-muted rounded-lg">
                          <p className="text-sm">{agendamento.observacoes}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end gap-3">
                      {getStatusBadge(agendamento.status)}
                      
                      <div className="flex gap-2">
                        {agendamento.status === 'AGENDADO' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-600 hover:bg-green-50"
                            onClick={() => updateStatus(agendamento.idAgendamento, 'REALIZADO')}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(agendamento)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(agendamento.idAgendamento)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Form Modal */}
      <AgendamentoForm
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingAgendamento(null);
        }}
        clients={clients}
        batches={batches}
        employees={employees}
        onSave={handleSaveAgendamento}
        currentUserId={user?.id || '1'}
        editingAgendamento={editingAgendamento}
      />
    </div>
  );
};