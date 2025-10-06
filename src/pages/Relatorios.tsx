import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Calendar,
  TrendingUp,
  Users,
  Syringe,
  BarChart3,
  PieChart
} from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Client, User, Vaccine, VaccinationRecord, VaccineBatch } from '@/types';

export const Relatorios: React.FC = () => {
  const [clients] = useLocalStorage<Client[]>('vixclinic_clients', []);
  const [employees] = useLocalStorage<User[]>('vixclinic_employees', []);
  const [vaccines] = useLocalStorage<Vaccine[]>('vixclinic_vaccines', []);
  const [vaccinations] = useLocalStorage<VaccinationRecord[]>('vixclinic_vaccinations', []);
  const [batches] = useLocalStorage<VaccineBatch[]>('vixclinic_batches', []);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Calculate statistics
  const totalVaccinations = vaccinations.length;
  const totalClients = clients.length;
  const totalEmployees = employees.length;
  const totalVaccineTypes = vaccines.length;

  // Vaccinations by period
  const getVaccinationsByPeriod = () => {
    if (!startDate || !endDate) return vaccinations;
    
    return vaccinations.filter(vaccination => {
      const vaccineDate = new Date(vaccination.applicationDate);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return vaccineDate >= start && vaccineDate <= end;
    });
  };

  const periodVaccinations = getVaccinationsByPeriod();

  // Vaccinations by vaccine type
  const vaccinationsByType = vaccines.map(vaccine => ({
    vaccine: vaccine.name,
    count: vaccinations.filter(v => v.vaccineId === vaccine.id).length
  })).sort((a, b) => b.count - a.count);

  // Vaccinations by employee
  const vaccinationsByEmployee = employees.map(employee => ({
    employee: employee.name,
    count: vaccinations.filter(v => v.appliedBy === employee.id).length
  })).sort((a, b) => b.count - a.count);

  // Age groups
  const getAgeGroup = (dateOfBirth: string) => {
    const age = new Date().getFullYear() - new Date(dateOfBirth).getFullYear();
    if (age < 18) return 'Menor de 18';
    if (age < 60) return '18-59 anos';
    return '60+ anos';
  };

  const clientsByAge = clients.reduce((acc, client) => {
    const ageGroup = getAgeGroup(client.dateOfBirth);
    acc[ageGroup] = (acc[ageGroup] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Stock status
  const stockByVaccine = vaccines.map(vaccine => {
    const vaccineBatches = batches.filter(b => b.vaccineId === vaccine.id);
    const totalStock = vaccineBatches.reduce((total, batch) => total + batch.remainingQuantity, 0);
    return {
      vaccine: vaccine.name,
      stock: totalStock,
      batches: vaccineBatches.length
    };
  });

  const generateReport = (reportType: string) => {
    // This would generate and download the report
    // For prototype, we'll just show an alert
    alert(`Relatório "${reportType}" seria gerado aqui`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-medical-blue flex items-center gap-2">
            <FileText className="w-8 h-8" />
            Relatórios
          </h1>
          <p className="text-muted-foreground">
            Análises e relatórios do sistema de vacinação
          </p>
        </div>
      </div>

      {/* Period Filter */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle>Filtro por Período</CardTitle>
          <CardDescription>
            Selecione o período para análise dos dados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="start-date">Data Inicial</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="end-date">Data Final</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            
            <div className="flex items-end">
              <Button 
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                variant="outline"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* General Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Syringe className="w-5 h-5 text-medical-blue" />
              <div>
                <p className="text-2xl font-bold text-medical-blue">{periodVaccinations.length}</p>
                <p className="text-sm text-muted-foreground">
                  Vacinações {startDate && endDate ? 'no Período' : 'Total'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">{totalClients}</p>
                <p className="text-sm text-muted-foreground">Total de Clientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{totalEmployees}</p>
                <p className="text-sm text-muted-foreground">Funcionários</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Syringe className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-purple-600">{totalVaccineTypes}</p>
                <p className="text-sm text-muted-foreground">Tipos de Vacina</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vaccinations by Type */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Vacinações por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {vaccinationsByType.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{item.vaccine}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-medical-blue h-2 rounded-full" 
                        style={{ 
                          width: `${(item.count / Math.max(...vaccinationsByType.map(v => v.count))) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <Badge variant="secondary">{item.count}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Vaccinations by Employee */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Vacinações por Funcionário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {vaccinationsByEmployee.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{item.employee}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ 
                          width: `${(item.count / Math.max(...vaccinationsByEmployee.map(v => v.count))) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <Badge variant="secondary">{item.count}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Clients by Age Group */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Clientes por Faixa Etária
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(clientsByAge).map(([ageGroup, count]) => (
                <div key={ageGroup} className="flex items-center justify-between">
                  <span className="text-sm">{ageGroup}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ 
                          width: `${(count / totalClients) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stock Status */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Status do Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stockByVaccine.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">{item.vaccine}</span>
                    <p className="text-xs text-muted-foreground">{item.batches} lote(s)</p>
                  </div>
                  <Badge 
                    variant={item.stock > 50 ? "default" : item.stock > 0 ? "secondary" : "destructive"}
                  >
                    {item.stock} doses
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Generation */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle>Gerar Relatórios</CardTitle>
          <CardDescription>
            Exporte relatórios detalhados para análise
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-20 flex flex-col gap-2"
              onClick={() => generateReport('Vacinações por Período')}
            >
              <Calendar className="w-6 h-6 text-medical-blue" />
              <span className="text-sm">Vacinações por Período</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-20 flex flex-col gap-2"
              onClick={() => generateReport('Estoque Atual')}
            >
              <BarChart3 className="w-6 h-6 text-medical-blue" />
              <span className="text-sm">Estoque Atual</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-20 flex flex-col gap-2"
              onClick={() => generateReport('Funcionários Ativos')}
            >
              <Users className="w-6 h-6 text-medical-blue" />
              <span className="text-sm">Funcionários Ativos</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-20 flex flex-col gap-2"
              onClick={() => generateReport('Relatório Completo')}
            >
              <Download className="w-6 h-6 text-medical-blue" />
              <span className="text-sm">Relatório Completo</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};