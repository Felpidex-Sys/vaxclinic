import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  Calendar,
  Phone,
  Mail
} from 'lucide-react';
import { Client } from '@/types';
import { useNavigate } from 'react-router-dom';
import { ClientForm } from '@/components/forms/ClientForm';
import { useToast } from '@/hooks/use-toast';
import { displayCPF, displayTelefone } from '@/lib/validations';
import { toBrasiliaISOString } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { InfoDialog } from '@/components/ui/info-dialog';

export const Clientes: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | undefined>();
  const [infoDialog, setInfoDialog] = useState<{ open: boolean; title: string; content: string }>({
    open: false,
    title: '',
    content: '',
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('cliente')
        .select('*')
        .order('nomecompleto', { ascending: true });

      if (error) throw error;

      const mappedClients: Client[] = (data || []).map(cliente => ({
        id: cliente.cpf,
        name: cliente.nomecompleto,
        cpf: cliente.cpf,
        dateOfBirth: cliente.datanasc || '',
        phone: cliente.telefone || '',
        email: cliente.email || '',
        address: '',
        allergies: cliente.alergias || '',
        observations: cliente.observacoes || '',
        createdAt: toBrasiliaISOString(),
      }));

      setClients(mappedClients);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os clientes.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.cpf.includes(searchTerm) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const handleSaveClient = async (clientData: Omit<Client, 'id' | 'createdAt'>) => {
    try {
      if (editingClient) {
        const { error } = await supabase
          .from('cliente')
          .update({
            nomecompleto: clientData.name,
            datanasc: clientData.dateOfBirth,
            telefone: clientData.phone,
            email: clientData.email,
            alergias: clientData.allergies,
            observacoes: clientData.observations,
          })
          .eq('cpf', editingClient.cpf);

        if (error) throw error;

        toast({
          title: 'Cliente atualizado',
          description: 'Os dados foram atualizados com sucesso.',
        });
      } else {
        const { error } = await supabase
          .from('cliente')
          .insert({
            cpf: clientData.cpf,
            nomecompleto: clientData.name,
            datanasc: clientData.dateOfBirth,
            telefone: clientData.phone,
            email: clientData.email,
            alergias: clientData.allergies,
            observacoes: clientData.observations,
            status: 'ATIVO',
          });

        if (error) throw error;

        toast({
          title: 'Cliente cadastrado',
          description: 'O cliente foi adicionado com sucesso.',
        });
      }

      setEditingClient(undefined);
      setShowForm(false);
      fetchClients();
    } catch (error: any) {
      console.error('Erro ao salvar cliente:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível salvar o cliente.',
        variant: 'destructive',
      });
    }
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setShowForm(true);
  };

  const handleDeleteClient = async (client: Client) => {
    if (confirm(`Tem certeza que deseja excluir o cliente ${client.name}?`)) {
      try {
        const { error } = await supabase
          .from('cliente')
          .delete()
          .eq('cpf', client.cpf);

        if (error) throw error;

        toast({
          title: 'Cliente excluído',
          description: `${client.name} foi removido do sistema.`,
        });

        fetchClients();
      } catch (error: any) {
        console.error('Erro ao excluir cliente:', error);
        toast({
          title: 'Erro',
          description: error.message || 'Não foi possível excluir o cliente.',
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
            <Users className="w-8 h-8" />
            Gestão de Clientes
          </h1>
          <p className="text-muted-foreground">
            Gerencie os clientes e seus históricos de vacinação
          </p>
        </div>
        
        <Button 
          className="medical-gradient text-white"
          onClick={() => {
            setEditingClient(undefined);
            setShowForm(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      {/* Search */}
      <Card className="card-shadow">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar por nome, CPF, email ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-medical-blue" />
              <div>
                <p className="text-2xl font-bold text-medical-blue">{clients.length}</p>
                <p className="text-sm text-muted-foreground">Total de Clientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {clients.filter(c => calculateAge(c.dateOfBirth) >= 60).length}
                </p>
                <p className="text-sm text-muted-foreground">Terceira Idade</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {clients.filter(c => calculateAge(c.dateOfBirth) < 18).length}
                </p>
                <p className="text-sm text-muted-foreground">Menores de Idade</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-purple-600">
                  {clients.filter(c => c.email).length}
                </p>
                <p className="text-sm text-muted-foreground">Com Email</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clients List */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
          <CardDescription>
            {filteredClients.length} cliente(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Carregando clientes...</p>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum cliente encontrado</p>
              </div>
            ) : (
              filteredClients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md smooth-transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-medical-blue/10 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-medical-blue" />
                    </div>
                    
                    <div>
                      <h3 className="font-semibold">{client.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>CPF: {displayCPF(client.cpf)}</span>
                        <span>{calculateAge(client.dateOfBirth)} anos</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {client.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {client.email}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {displayTelefone(client.phone)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      {client.allergies && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="mb-1"
                          onClick={() => setInfoDialog({ open: true, title: 'Alergias', content: client.allergies || '' })}
                        >
                          Alergias
                        </Button>
                      )}
                      {client.observations && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInfoDialog({ open: true, title: 'Observações', content: client.observations || '' })}
                        >
                          Observações
                        </Button>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigate('/agendamentos', { state: { clientCPF: client.cpf } });
                        }}
                        title="Agendar vacinação"
                      >
                        <Calendar className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClient(client)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClient(client)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Client Form Modal */}
      <ClientForm
        open={showForm}
        onOpenChange={setShowForm}
        client={editingClient}
        onSave={handleSaveClient}
      />

      {/* Info Dialog */}
      <InfoDialog
        open={infoDialog.open}
        onOpenChange={(open) => setInfoDialog({ ...infoDialog, open })}
        title={infoDialog.title}
        content={infoDialog.content}
      />
    </div>
  );
};