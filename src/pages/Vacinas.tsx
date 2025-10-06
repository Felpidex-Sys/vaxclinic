import React, { useState } from 'react';
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
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Vaccine, VaccineBatch, Client, User, VaccinationRecord } from '@/types';
import { useNavigate } from 'react-router-dom';
import { VaccineApplicationForm } from '@/components/forms/VaccineApplicationForm';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const mockVaccines: Vaccine[] = [
  {
    id: '1',
    name: 'Coronavac',
    manufacturer: 'Sinovac',
    description: 'Vacina inativada contra COVID-19',
    targetDisease: 'COVID-19',
    dosesRequired: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Pfizer-BioNTech',
    manufacturer: 'Pfizer',
    description: 'Vacina de mRNA contra COVID-19',
    targetDisease: 'COVID-19',
    dosesRequired: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Tríplice Viral',
    manufacturer: 'Instituto Butantan',
    description: 'Vacina contra sarampo, caxumba e rubéola',
    targetDisease: 'Sarampo, Caxumba, Rubéola',
    dosesRequired: 2,
    createdAt: new Date().toISOString(),
  },
];

const mockBatches: VaccineBatch[] = [
  {
    id: '1',
    vaccineId: '1',
    batchNumber: 'COV2024001',
    quantity: 100,
    remainingQuantity: 75,
    manufacturingDate: '2024-01-15',
    expirationDate: '2024-12-15',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    vaccineId: '2',
    batchNumber: 'PFZ2024002',
    quantity: 150,
    remainingQuantity: 120,
    manufacturingDate: '2024-02-10',
    expirationDate: '2024-11-10',
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    vaccineId: '3',
    batchNumber: 'TRI2024003',
    quantity: 80,
    remainingQuantity: 15,
    manufacturingDate: '2024-01-20',
    expirationDate: '2025-01-20',
    createdAt: new Date().toISOString(),
  },
];

export const Vacinas: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [vaccines, setVaccines] = useLocalStorage<Vaccine[]>('vixclinic_vaccines', mockVaccines);
  const [batches, setBatches] = useLocalStorage<VaccineBatch[]>('vixclinic_batches', mockBatches);
  const [clients] = useLocalStorage<Client[]>('vixclinic_clients', []);
  const [employees] = useLocalStorage<User[]>('vixclinic_employees', []);
  const [vaccinations, setVaccinations] = useLocalStorage<VaccinationRecord[]>('vixclinic_vaccinations', []);
  const [searchTerm, setSearchTerm] = useState('');
  const [showApplicationForm, setShowApplicationForm] = useState(false);

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
                              onClick={() => {
                                if (confirm(`Tem certeza que deseja excluir a vacina ${vaccine.name}?`)) {
                                  const updatedVaccines = vaccines.filter(v => v.id !== vaccine.id);
                                  setVaccines(updatedVaccines);
                                  toast({ title: "Vacina excluída", description: "A vacina foi removida do sistema." });
                                }
                              }}
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
                        <p className="text-sm text-muted-foreground">
                          Fabricação: {new Date(batch.manufacturingDate).toLocaleDateString('pt-BR')}
                        </p>
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