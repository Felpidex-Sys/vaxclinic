import React, { useState } from 'react';
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
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Client } from '@/types';
import { useNavigate } from 'react-router-dom';
import { ClientForm } from '@/components/forms/ClientForm';
import { useToast } from '@/hooks/use-toast';

const mockClients: Client[] = [
  {
    id: '1',
    name: 'Carlos Eduardo Silva',
    cpf: '111.222.333-44',
    dateOfBirth: '1985-05-15',
    phone: '(11) 99999-1111',
    email: 'carlos@email.com',
    address: 'Rua das Flores, 123',
    allergies: 'Nenhuma alergia conhecida',
    observations: '',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Mariana Santos Costa',
    cpf: '555.666.777-88',
    dateOfBirth: '1992-08-22',
    phone: '(11) 88888-2222',
    email: 'mariana@email.com',
    address: 'Av. Principal, 456',
    allergies: 'Alergia a penicilina',
    observations: 'Histórico de desmaio durante vacinação',
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'José Antonio Oliveira',
    cpf: '999.000.111-22',
    dateOfBirth: '1978-12-10',
    phone: '(11) 77777-3333',
    email: 'jose@email.com',
    address: 'Rua da Saúde, 789',
    allergies: '',
    observations: 'Diabético tipo 2',
    createdAt: new Date().toISOString(),
  },
];

export const Clientes: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clients, setClients] = useLocalStorage<Client[]>('vixclinic_clients', mockClients);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | undefined>();

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

  const handleSaveClient = (clientData: Omit<Client, 'id' | 'createdAt'>) => {
    if (editingClient) {
      // Update existing client
      const updatedClients = clients.map(client =>
        client.id === editingClient.id
          ? { ...client, ...clientData }
          : client
      );
      setClients(updatedClients);
      setEditingClient(undefined);
    } else {
      // Add new client
      const newClient: Client = {
        ...clientData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      setClients([...clients, newClient]);
    }
    setShowForm(false);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setShowForm(true);
  };

  const handleDeleteClient = (client: Client) => {
    if (confirm(`Tem certeza que deseja excluir o cliente ${client.name}?`)) {
      const updatedClients = clients.filter(c => c.id !== client.id);
      setClients(updatedClients);
      toast({
        title: "Cliente excluído",
        description: `${client.name} foi removido do sistema.`,
      });
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
            {filteredClients.length === 0 ? (
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
                        <span>CPF: {client.cpf}</span>
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
                          {client.phone}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      {client.allergies && (
                        <Badge variant="secondary" className="mb-1">
                          Alergias
                        </Badge>
                      )}
                      {client.observations && (
                        <Badge variant="outline">
                          Observações
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/clientes`)}
                        title="Ver histórico"
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
    </div>
  );
};