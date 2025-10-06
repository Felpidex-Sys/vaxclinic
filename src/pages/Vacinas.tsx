import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Syringe, 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  Package,
  AlertTriangle,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { Vaccine, VaccineBatch, Client, User, VaccinationRecord } from '@/types';
import { useNavigate } from 'react-router-dom';
import { VaccineApplicationForm } from '@/components/forms/VaccineApplicationForm';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const Vacinas: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [batches, setBatches] = useState<VaccineBatch[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [vaccinations, setVaccinations] = useState<VaccinationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch vaccines
      const { data: vacinasData, error: vacinasError } = await supabase
        .from('vacina')
        .select('*')
        .order('nome', { ascending: true });

      if (vacinasError) throw vacinasError;

      const mappedVaccines: Vaccine[] = (vacinasData || []).map(vac => ({
        id: vac.idvacina.toString(),
        name: vac.nome,
        manufacturer: vac.fabricante || '',
        description: vac.descricao || '',
        targetDisease: vac.categoria || '',
        dosesRequired: vac.quantidadedoses || 1,
        createdAt: new Date().toISOString(),
      }));

      setVaccines(mappedVaccines);

      // Fetch batches
      const { data: lotesData, error: lotesError } = await supabase
        .from('lote')
        .select('*')
        .order('datavalidade', { ascending: true });

      if (lotesError) throw lotesError;

      const mappedBatches: VaccineBatch[] = (lotesData || []).map(lote => ({
        id: lote.numlote.toString(),
        vaccineId: lote.vacina_idvacina.toString(),
        batchNumber: lote.codigolote,
        quantity: lote.quantidadeinicial,
        remainingQuantity: lote.quantidadedisponivel,
        manufacturingDate: '',
        expirationDate: lote.datavalidade,
        createdAt: new Date().toISOString(),
      }));

      setBatches(mappedBatches);

      // Fetch clients
      const { data: clientesData, error: clientesError } = await supabase
        .from('cliente')
        .select('*');

      if (clientesError) throw clientesError;

      const mappedClients: Client[] = (clientesData || []).map(cliente => ({
        id: cliente.cpf,
        name: cliente.nomecompleto,
        cpf: cliente.cpf,
        dateOfBirth: cliente.datanasc || '',
        phone: cliente.telefone || '',
        email: cliente.email || '',
        address: '',
        allergies: cliente.alergias || '',
        observations: cliente.observacoes || '',
        createdAt: new Date().toISOString(),
      }));

      setClients(mappedClients);

      // Fetch employees
      const { data: funcionariosData, error: funcionariosError } = await supabase
        .from('funcionario')
        .select('*');

      if (funcionariosError) throw funcionariosError;

      const mappedEmployees: User[] = (funcionariosData || []).map(func => ({
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
      console.error('Erro ao buscar dados:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredVaccines = vaccines.filter(vaccine =>
    vaccine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vaccine.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vaccine.targetDisease.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getVaccineBatches = (vaccineId: string) => {
    return batches.filter(batch => batch.vaccineId === vaccineId);
  };

  const getTotalStock = (vaccineId: string) => {
    return batches
      .filter(batch => batch.vaccineId === vaccineId)
      .reduce((total, batch) => total + batch.remainingQuantity, 0);
  };

  const getExpiringBatches = () => {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    return batches.filter(batch => {
      const expirationDate = new Date(batch.expirationDate);
      return expirationDate <= thirtyDaysFromNow && batch.remainingQuantity > 0;
    });
  };

  const expiringBatches = getExpiringBatches();

  const handleSaveVaccination = (vaccinationData: Omit<VaccinationRecord, 'id' | 'createdAt'>) => {
    // Add new vaccination record
    const newVaccination: VaccinationRecord = {
      ...vaccinationData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setVaccinations([...vaccinations, newVaccination]);

    // Update batch stock
    const updatedBatches = batches.map(batch =>
      batch.id === vaccinationData.batchId
        ? { ...batch, remainingQuantity: batch.remainingQuantity - 1 }
        : batch
    );
    setBatches(updatedBatches);
  };

  const handleDeleteVaccine = async (vaccine: Vaccine) => {
    if (confirm(`Tem certeza que deseja excluir a vacina ${vaccine.name}?`)) {
      try {
        const { error } = await supabase
          .from('vacina')
          .delete()
          .eq('idvacina', parseInt(vaccine.id));

        if (error) throw error;

        toast({ 
          title: "Vacina excluída", 
          description: "A vacina foi removida do sistema." 
        });

        fetchData();
      } catch (error: any) {
        console.error('Erro ao excluir vacina:', error);
        toast({
          title: 'Erro',
          description: error.message || 'Não foi possível excluir a vacina.',
          variant: 'destructive',
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-medical-blue flex items-center gap-2">
            <Syringe className="w-8 h-8" />
            Gestão de Vacinas
          </h1>
          <p className="text-muted-foreground">
            Gerencie vacinas, lotes e estoque
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setShowApplicationForm(true)}
          >
            <Syringe className="w-4 h-4 mr-2" />
            Aplicar Vacina
          </Button>
          <Button 
            className="medical-gradient text-white"
            onClick={() => toast({ title: "Em desenvolvimento", description: "Funcionalidade será implementada em breve." })}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Vacina
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Syringe className="w-5 h-5 text-medical-blue" />
              <div>
                <p className="text-2xl font-bold text-medical-blue">{vaccines.length}</p>
                <p className="text-sm text-muted-foreground">Tipos de Vacina</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">{batches.length}</p>
                <p className="text-sm text-muted-foreground">Lotes Cadastrados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {batches.reduce((total, batch) => total + batch.remainingQuantity, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Doses Disponíveis</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-orange-600">{expiringBatches.length}</p>
                <p className="text-sm text-muted-foreground">Lotes Vencendo</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="vaccines" className="space-y-4">
        <TabsList>
          <TabsTrigger value="vaccines">Vacinas</TabsTrigger>
          <TabsTrigger value="batches">Lotes</TabsTrigger>
          <TabsTrigger value="expiring">Vencimentos</TabsTrigger>
        </TabsList>

        <TabsContent value="vaccines" className="space-y-4">
          {/* Search */}
          <Card className="card-shadow">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar por nome, fabricante ou doença alvo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Vaccines List */}
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle>Lista de Vacinas</CardTitle>
              <CardDescription>
                {filteredVaccines.length} vacina(s) encontrada(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredVaccines.length === 0 ? (
                  <div className="text-center py-8">
                    <Syringe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhuma vacina encontrada</p>
                  </div>
                ) : (
                  filteredVaccines.map((vaccine) => {
                    const totalStock = getTotalStock(vaccine.id);
                    const vaccineBatches = getVaccineBatches(vaccine.id);
                    
                    return (
                      <div
                        key={vaccine.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md smooth-transition"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-medical-blue/10 rounded-full flex items-center justify-center">
                            <Syringe className="w-6 h-6 text-medical-blue" />
                          </div>
                          
                          <div>
                            <h3 className="font-semibold">{vaccine.name}</h3>
                            <p className="text-sm text-muted-foreground">{vaccine.manufacturer}</p>
                            <p className="text-sm text-muted-foreground">
                              Alvo: {vaccine.targetDisease}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {vaccine.dosesRequired} dose(s) necessária(s)
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <Badge 
                              variant={totalStock > 0 ? "default" : "destructive"}
                              className="mb-1"
                            >
                              {totalStock} doses
                            </Badge>
                            <p className="text-sm text-muted-foreground">
                              {vaccineBatches.length} lote(s)
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toast({ title: "Em desenvolvimento", description: "Funcionalidade será implementada." })}
                              title="Gerenciar lotes"
                            >
                              <Package className="w-4 h-4" />
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toast({ title: "Em desenvolvimento", description: "Funcionalidade será implementada." })}
                              title="Editar vacina"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteVaccine(vaccine)}
                              title="Excluir vacina"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batches" className="space-y-4">
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle>Gestão de Lotes</CardTitle>
              <CardDescription>
                Todos os lotes de vacinas cadastrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {batches.map((batch) => {
                  const vaccine = vaccines.find(v => v.id === batch.vaccineId);
                  const usagePercentage = ((batch.quantity - batch.remainingQuantity) / batch.quantity) * 100;
                  
                  return (
                    <div
                      key={batch.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <h3 className="font-semibold">{vaccine?.name}</h3>
                        <p className="text-sm text-muted-foreground">Lote: {batch.batchNumber}</p>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-medium">
                          {batch.remainingQuantity}/{batch.quantity} doses
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Vence: {new Date(batch.expirationDate).toLocaleDateString('pt-BR')}
                        </p>
                        <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-medical-blue h-2 rounded-full" 
                            style={{ width: `${usagePercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expiring" className="space-y-4">
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Lotes com Validade Próxima
              </CardTitle>
              <CardDescription>
                Lotes que vencem nos próximos 30 dias
              </CardDescription>
            </CardHeader>
            <CardContent>
              {expiringBatches.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum lote próximo do vencimento</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {expiringBatches.map((batch) => {
                    const vaccine = vaccines.find(v => v.id === batch.vaccineId);
                    const daysUntilExpiry = Math.ceil(
                      (new Date(batch.expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                    );
                    
                    return (
                      <div
                        key={batch.id}
                        className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg"
                      >
                        <div>
                          <h3 className="font-semibold">{vaccine?.name}</h3>
                          <p className="text-sm text-muted-foreground">Lote: {batch.batchNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            {batch.remainingQuantity} doses restantes
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <Badge variant={daysUntilExpiry <= 7 ? 'destructive' : 'secondary'}>
                            {daysUntilExpiry} dias
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-1">
                            Vence: {new Date(batch.expirationDate).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Vaccine Application Form Modal */}
      <VaccineApplicationForm
        open={showApplicationForm}
        onOpenChange={setShowApplicationForm}
        clients={clients}
        vaccines={vaccines}
        batches={batches}
        onSave={handleSaveVaccination}
        appliedBy={user?.id || ''}
      />
    </div>
  );
};
