import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { Agendamento, Client, VaccineBatch, User as UserType, Lote, Vacina } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { AgendamentoForm } from '@/components/forms/AgendamentoForm';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from 'react-router-dom';
import { formatBrasiliaDate, toBrasiliaISOString } from '@/lib/utils';

export const Agendamentos: React.FC = () => {
  const { toast } = useToast();
  const location = useLocation();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [batches, setBatches] = useState<Lote[]>([]);
  const [employees, setEmployees] = useState<UserType[]>([]);
  const [vaccines, setVaccines] = useState<Vacina[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('AGENDADO');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAgendamento, setEditingAgendamento] = useState<Agendamento | null>(null);
  const [confirmingAgendamento, setConfirmingAgendamento] = useState<Agendamento | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');

  useEffect(() => {
    fetchData();
    // Se vier de Clientes com CPF, abrir o form
    if (location.state?.clientCPF) {
      setIsFormOpen(true);
    }
    // Se vier do Dashboard com agendamento específico, fazer scroll/highlight
    if (location.state?.selectedAgendamento) {
      setTimeout(() => {
        const element = document.getElementById(`agendamento-${location.state.selectedAgendamento}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('ring-2', 'ring-primary');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-primary');
          }, 2000);
        }
      }, 500);
    }
  }, [location.state]);

  const fetchData = async () => {
    try {
      const [agendamentosData, clientsData, lotesData, employeesData, vacinasData] = await Promise.all([
        supabase.from('agendamento').select('*').order('dataagendada', { ascending: true }),
        supabase.from('cliente').select('*'),
        supabase.from('lote').select('*'),
        supabase.from('funcionario').select('*'),
        supabase.from('vacina').select('*'),
      ]);

      if (agendamentosData.error) throw agendamentosData.error;
      if (clientsData.error) throw clientsData.error;
      if (lotesData.error) throw lotesData.error;
      if (employeesData.error) throw employeesData.error;
      if (vacinasData.error) throw vacinasData.error;

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
        createdAt: toBrasiliaISOString(),
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
        createdAt: e.dataadmissao || toBrasiliaISOString(),
      }));

      const mappedVacinas: Vacina[] = (vacinasData.data || []).map(v => ({
        idVacina: v.idvacina,
        nome: v.nome,
        fabricante: v.fabricante || '',
        categoria: v.categoria,
        quantidadeDoses: v.quantidadedoses,
        intervaloDoses: v.intervalodoses,
        descricao: v.descricao || '',
        status: v.status,
      }));

      setAgendamentos(mappedAgendamentos);
      setClients(mappedClients);
      setBatches(mappedLotes);
      setEmployees(mappedEmployees);
      setVaccines(mappedVacinas);
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

  const handleConfirmarAgendamento = (agendamento: Agendamento) => {
    setConfirmingAgendamento(agendamento);
    setSelectedEmployee('');
  };

  const handleFinalizarAgendamento = async () => {
    if (!confirmingAgendamento || !selectedEmployee) {
      toast({
        title: "Erro",
        description: "Selecione o funcionário que aplicou a vacina.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Data e hora atuais no formato ISO (horário de Brasília)
      const dataHoraAtual = toBrasiliaISOString();
      
      // Buscar os preços do lote antes de criar a aplicação
      const { data: loteData, error: loteError } = await supabase
        .from('lote')
        .select('precocompra, precovenda')
        .eq('numlote', confirmingAgendamento.Lote_numLote)
        .single();

      if (loteError) throw loteError;
      
      // Criar registro de aplicação (trigger do banco atualiza status para REALIZADO automaticamente)
      const { error: aplicacaoError } = await supabase
        .from('aplicacao')
        .insert({
          dataaplicacao: dataHoraAtual,
          funcionario_idfuncionario: parseInt(selectedEmployee),
          cliente_cpf: confirmingAgendamento.Cliente_CPF.toString(),
          agendamento_idagendamento: confirmingAgendamento.idAgendamento,
          lote_numlote: confirmingAgendamento.Lote_numLote,
          observacoes: confirmingAgendamento.observacoes,
          precocompra: loteData.precocompra,
          precovenda: loteData.precovenda,
        });

      if (aplicacaoError) throw aplicacaoError;

      toast({
        title: "Agendamento confirmado",
        description: "A vacina foi aplicada com sucesso.",
      });
      
      setConfirmingAgendamento(null);
      setSelectedEmployee('');
      fetchData();
    } catch (error: any) {
      console.error('Erro ao confirmar agendamento:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível confirmar o agendamento.",
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
              <Card key={agendamento.idAgendamento} id={`agendamento-${agendamento.idAgendamento}`} className="card-shadow transition-all">
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
                            {formatBrasiliaDate(agendamento.dataAgendada)} às{' '}
                            {new Date(agendamento.dataAgendada).toLocaleTimeString('pt-BR', { 
                              timeZone: 'America/Sao_Paulo',
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
                            onClick={() => handleConfirmarAgendamento(agendamento)}
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
        vaccines={vaccines}
        onSave={handleSaveAgendamento}
        currentUserId="1"
        editingAgendamento={editingAgendamento}
      />

      {/* Confirm Dialog */}
      <Dialog open={!!confirmingAgendamento} onOpenChange={(open) => {
        if (!open) {
          setConfirmingAgendamento(null);
          setSelectedEmployee('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Aplicação da Vacina</DialogTitle>
            <DialogDescription>
              Selecione o funcionário responsável pela aplicação
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="funcionario">Funcionário Responsável *</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o funcionário" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setConfirmingAgendamento(null);
                  setSelectedEmployee('');
                }}
              >
                Cancelar
              </Button>
              <Button
                className="medical-gradient text-white"
                onClick={handleFinalizarAgendamento}
              >
                Confirmar Aplicação
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
