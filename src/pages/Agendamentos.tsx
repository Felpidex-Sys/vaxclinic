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
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Agendamento, Client, VaccineBatch, User as UserType } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { AgendamentoForm } from '@/components/forms/AgendamentoForm';

export const Agendamentos: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [agendamentos, setAgendamentos] = useLocalStorage<Agendamento[]>('vixclinic_agendamentos', []);
  const [clients] = useLocalStorage<Client[]>('vixclinic_clients', []);
  const [batches] = useLocalStorage<VaccineBatch[]>('vixclinic_batches', []);
  const [employees] = useLocalStorage<UserType[]>('vixclinic_employees', []);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAgendamento, setEditingAgendamento] = useState<Agendamento | null>(null);

  const filteredAgendamentos = agendamentos.filter(agendamento => {
    const client = clients.find(c => parseInt(c.cpf.replace(/\D/g, '')) === agendamento.Cliente_CPF);
    const batch = batches.find(b => parseInt(b.id) === agendamento.Lote_numLote);
    
    const matchesSearch = !searchTerm || 
      client?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || agendamento.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleSaveAgendamento = (agendamentoData: Omit<Agendamento, 'idAgendamento'>) => {
    if (editingAgendamento) {
      const updatedAgendamentos = agendamentos.map(a =>
        a.idAgendamento === editingAgendamento.idAgendamento
          ? { ...agendamentoData, idAgendamento: editingAgendamento.idAgendamento }
          : a
      );
      setAgendamentos(updatedAgendamentos);
      toast({
        title: "Agendamento atualizado",
        description: "O agendamento foi atualizado com sucesso.",
      });
    } else {
      const newAgendamento: Agendamento = {
        ...agendamentoData,
        idAgendamento: Date.now(),
      };
      setAgendamentos([...agendamentos, newAgendamento]);
      toast({
        title: "Agendamento criado",
        description: "O agendamento foi criado com sucesso.",
      });
    }
    setEditingAgendamento(null);
  };

  const handleEdit = (agendamento: Agendamento) => {
    setEditingAgendamento(agendamento);
    setIsFormOpen(true);
  };

  const handleDelete = (idAgendamento: number) => {
    if (confirm('Tem certeza que deseja excluir este agendamento?')) {
      setAgendamentos(prev => prev.filter(a => a.idAgendamento !== idAgendamento));
      toast({
        title: "Agendamento excluído",
        description: "O agendamento foi excluído com sucesso.",
      });
    }
  };

  const updateStatus = (idAgendamento: number, status: Agendamento['status']) => {
    setAgendamentos(prev => prev.map(a => 
      a.idAgendamento === idAgendamento ? { ...a, status } : a
    ));
    toast({
      title: "Status atualizado",
      description: `Agendamento marcado como ${status.toLowerCase()}.`,
    });
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
            const client = clients.find(c => parseInt(c.cpf.replace(/\D/g, '')) === agendamento.Cliente_CPF);
            const batch = batches.find(b => parseInt(b.id) === agendamento.Lote_numLote);
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
                            Lote {batch?.batchNumber || 'não encontrado'}
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