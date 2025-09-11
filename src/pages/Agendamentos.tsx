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
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Syringe,
  Edit,
  Trash2
} from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Agendamento, Client, Vaccine, User as UserType } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export const Agendamentos: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [agendamentos, setAgendamentos] = useLocalStorage<Agendamento[]>('vixclinic_agendamentos', []);
  const [clients] = useLocalStorage<Client[]>('vaxclinic_clients', []);
  const [vaccines] = useLocalStorage<Vaccine[]>('vaxclinic_vaccines', []);
  const [employees] = useLocalStorage<UserType[]>('vaxclinic_employees', []);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAgendamento, setEditingAgendamento] = useState<Agendamento | null>(null);
  
  const [formData, setFormData] = useState({
    pacienteId: '',
    funcionarioId: user?.id || '',
    vacinaId: '',
    dataHora: '',
    observacoes: '',
  });

  // Mock initial data if empty
  useEffect(() => {
    if (agendamentos.length === 0) {
      const mockAgendamentos: Agendamento[] = [
        {
          id: '1',
          pacienteId: '1',
          funcionarioId: '1',
          vacinaId: '1',
          dataHora: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          status: 'Agendado',
          observacoes: 'Primeira dose da vacina',
          criadoEm: new Date().toISOString(),
        },
        {
          id: '2',
          pacienteId: '2',
          funcionarioId: '2',
          vacinaId: '2',
          dataHora: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
          status: 'Agendado',
          observacoes: 'Segunda dose - reforço',
          criadoEm: new Date().toISOString(),
        },
      ];
      setAgendamentos(mockAgendamentos);
    }
  }, [agendamentos.length, setAgendamentos]);

  const filteredAgendamentos = agendamentos.filter(agendamento => {
    const client = clients.find(c => c.id === agendamento.pacienteId);
    const vaccine = vaccines.find(v => v.id === agendamento.vacinaId);
    
    const matchesSearch = !searchTerm || 
      client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vaccine?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || agendamento.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.pacienteId || !formData.vacinaId || !formData.dataHora) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const agendamentoData: Agendamento = {
      id: editingAgendamento?.id || Date.now().toString(),
      ...formData,
      status: 'Agendado',
      criadoEm: editingAgendamento?.criadoEm || new Date().toISOString(),
    };

    if (editingAgendamento) {
      setAgendamentos(prev => prev.map(a => a.id === editingAgendamento.id ? agendamentoData : a));
      toast({
        title: "Agendamento atualizado",
        description: "O agendamento foi atualizado com sucesso.",
      });
    } else {
      setAgendamentos(prev => [...prev, agendamentoData]);
      toast({
        title: "Agendamento criado",
        description: "O agendamento foi criado com sucesso.",
      });
    }

    setIsFormOpen(false);
    setEditingAgendamento(null);
    setFormData({
      pacienteId: '',
      funcionarioId: user?.id || '',
      vacinaId: '',
      dataHora: '',
      observacoes: '',
    });
  };

  const handleEdit = (agendamento: Agendamento) => {
    setEditingAgendamento(agendamento);
    setFormData({
      pacienteId: agendamento.pacienteId,
      funcionarioId: agendamento.funcionarioId,
      vacinaId: agendamento.vacinaId,
      dataHora: agendamento.dataHora.split('T')[0] + 'T' + agendamento.dataHora.split('T')[1].slice(0, 5),
      observacoes: agendamento.observacoes || '',
    });
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setAgendamentos(prev => prev.filter(a => a.id !== id));
    toast({
      title: "Agendamento excluído",
      description: "O agendamento foi excluído com sucesso.",
    });
  };

  const updateStatus = (id: string, status: Agendamento['status']) => {
    setAgendamentos(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    toast({
      title: "Status atualizado",
      description: `Agendamento marcado como ${status.toLowerCase()}.`,
    });
  };

  const getStatusBadge = (status: Agendamento['status']) => {
    switch (status) {
      case 'Agendado':
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" />Agendado</Badge>;
      case 'Concluido':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Concluído</Badge>;
      case 'Cancelado':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Cancelado</Badge>;
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
          onClick={() => setIsFormOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Agendamento
        </Button>
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
                  placeholder="Buscar por cliente ou vacina..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="w-full sm:w-48">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Agendado">Agendado</SelectItem>
                  <SelectItem value="Concluido">Concluído</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agendamentos List */}
      <div className="grid gap-4">
        {filteredAgendamentos.length === 0 ? (
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
            const client = clients.find(c => c.id === agendamento.pacienteId);
            const vaccine = vaccines.find(v => v.id === agendamento.vacinaId);
            const funcionario = employees.find(e => e.id === agendamento.funcionarioId);
            
            return (
              <Card key={agendamento.id} className="card-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Calendar className="w-5 h-5 text-medical-blue" />
                        <div>
                          <h3 className="font-semibold text-lg">{client?.name || 'Cliente não encontrado'}</h3>
                          <p className="text-sm text-muted-foreground">
                            {vaccine?.name || 'Vacina não encontrada'} • {vaccine?.manufacturer}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span>
                            {new Date(agendamento.dataHora).toLocaleDateString('pt-BR')} às{' '}
                            {new Date(agendamento.dataHora).toLocaleTimeString('pt-BR', { 
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
                        {agendamento.status === 'Agendado' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-600 hover:bg-green-50"
                              onClick={() => updateStatus(agendamento.id, 'Concluido')}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-600 hover:bg-red-50"
                              onClick={() => updateStatus(agendamento.id, 'Cancelado')}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
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
                          onClick={() => handleDelete(agendamento.id)}
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

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(open) => {
        setIsFormOpen(open);
        if (!open) {
          setEditingAgendamento(null);
          setFormData({
            pacienteId: '',
            funcionarioId: user?.id || '',
            vacinaId: '',
            dataHora: '',
            observacoes: '',
          });
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingAgendamento ? 'Editar Agendamento' : 'Novo Agendamento'}
            </DialogTitle>
            <DialogDescription>
              {editingAgendamento 
                ? 'Atualize as informações do agendamento.'
                : 'Crie um novo agendamento de vacinação.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cliente">Cliente *</Label>
                <Select 
                  value={formData.pacienteId} 
                  onValueChange={(value) => setFormData({ ...formData, pacienteId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name} - {client.cpf}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="vacina">Vacina *</Label>
                <Select 
                  value={formData.vacinaId} 
                  onValueChange={(value) => setFormData({ ...formData, vacinaId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a vacina" />
                  </SelectTrigger>
                  <SelectContent>
                    {vaccines.map((vaccine) => (
                      <SelectItem key={vaccine.id} value={vaccine.id}>
                        {vaccine.name} - {vaccine.manufacturer}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="funcionario">Funcionário *</Label>
                <Select 
                  value={formData.funcionarioId} 
                  onValueChange={(value) => setFormData({ ...formData, funcionarioId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o funcionário" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name} - {employee.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="dataHora">Data e Hora *</Label>
                <Input
                  id="dataHora"
                  type="datetime-local"
                  value={formData.dataHora}
                  onChange={(e) => setFormData({ ...formData, dataHora: e.target.value })}
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Observações sobre o agendamento"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="medical-gradient text-white">
                {editingAgendamento ? 'Atualizar' : 'Criar'} Agendamento
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};