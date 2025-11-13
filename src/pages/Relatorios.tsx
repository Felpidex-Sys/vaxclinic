import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Client, User, Vaccine, VaccinationRecord, VaccineBatch } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { toBrasiliaISOString } from '@/lib/utils';

export const Relatorios: React.FC = () => {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [vaccinations, setVaccinations] = useState<VaccinationRecord[]>([]);
  const [batches, setBatches] = useState<VaccineBatch[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [reportType, setReportType] = useState('monthly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [clientsData, vaccinesData, aplicacoesData, batchesData] = await Promise.all([
        supabase.from('cliente').select('*'),
        supabase.from('vacina').select('*'),
        supabase.from('aplicacao').select('*'),
        supabase.from('lote').select('*'),
      ]);

      if (clientsData.error) throw clientsData.error;
      if (vaccinesData.error) throw vaccinesData.error;
      if (aplicacoesData.error) throw aplicacoesData.error;
      if (batchesData.error) throw batchesData.error;

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

      const mappedVaccines: Vaccine[] = (vaccinesData.data || []).map(v => ({
        id: v.idvacina.toString(),
        name: v.nome,
        manufacturer: v.fabricante || '',
        description: v.descricao || '',
        targetDisease: v.categoria || '',
        dosesRequired: v.quantidadedoses || 1,
        createdAt: toBrasiliaISOString(),
      }));

      const mappedVaccinations: VaccinationRecord[] = (aplicacoesData.data || []).map(a => ({
        id: a.idaplicacao.toString(),
        clientId: a.cliente_cpf,
        vaccineId: '',
        batchId: a.lote_numlote?.toString() || '',
        applicationDate: a.dataaplicacao,
        appliedBy: a.funcionario_idfuncionario.toString(),
        doseNumber: a.dose || 1,
        nextDueDate: '',
        observations: a.observacoes || '',
        createdAt: a.dataaplicacao,
      }));

      const mappedBatches: VaccineBatch[] = (batchesData.data || []).map(b => ({
        id: b.numlote.toString(),
        vaccineId: b.vacina_idvacina.toString(),
        batchNumber: b.codigolote,
        quantity: b.quantidadeinicial,
        remainingQuantity: b.quantidadedisponivel,
        manufacturingDate: new Date().toISOString(),
        expirationDate: b.datavalidade,
        purchasePrice: Number(b.precocompra) || 0,
        salePrice: Number(b.precovenda) || 0,
        createdAt: toBrasiliaISOString(),
      }));

      setClients(mappedClients);
      setVaccines(mappedVaccines);
      setVaccinations(mappedVaccinations);
      setBatches(mappedBatches);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados dos relatórios",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  // Calcular dados para o relatório
  const filterByYear = (dateString: string) => {
    return new Date(dateString).getFullYear().toString() === selectedYear;
  };

  const vaccinationsThisYear = vaccinations.filter(v => filterByYear(v.applicationDate));
  
  const totalVaccines = batches.reduce((sum, batch) => sum + batch.quantity, 0);
  const vaccinesDistributed = batches.reduce((sum, batch) => sum + (batch.quantity - batch.remainingQuantity), 0);
  const vaccinesAdministered = vaccinationsThisYear.length;
  
  // Calcular vacinas perdidas (diferença entre distribuídas e administradas)
  const vaccinesLost = vaccinesDistributed - vaccinesAdministered;

  // Dados para gráfico de vacinações por mês
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const vaccinationsByMonth = monthNames.map((month, index) => {
    const count = vaccinationsThisYear.filter(v => {
      const date = new Date(v.applicationDate);
      return date.getMonth() === index;
    }).length;
    return { month, vaccines: count };
  });

  // Dados para gráfico de lucro e perda
  const profitLossByMonth = monthNames.map((month, index) => {
    const monthVaccinations = vaccinationsThisYear.filter(v => {
      const date = new Date(v.applicationDate);
      return date.getMonth() === index;
    });

    let profit = 0;
    let loss = 0;

    monthVaccinations.forEach(vaccination => {
      const batch = batches.find(b => b.id === vaccination.batchId);
      if (batch) {
        const revenue = batch.salePrice;
        const cost = batch.purchasePrice;
        const margin = revenue - cost;
        
        if (margin > 0) {
          profit += margin;
        } else {
          loss += Math.abs(margin);
        }
      }
    });

    return { month, profit, loss: -loss };
  });

  // Anos disponíveis para seleção
  const availableYears = Array.from(
    new Set(vaccinations.map(v => new Date(v.applicationDate).getFullYear()))
  ).sort((a, b) => b - a);

  if (!availableYears.includes(parseInt(selectedYear))) {
    availableYears.push(new Date().getFullYear());
  }

  const chartConfig = {
    vaccines: {
      label: "Vacinas",
      color: "hsl(var(--primary))",
    },
    profit: {
      label: "Lucro",
      color: "hsl(var(--primary))",
    },
    loss: {
      label: "Perda",
      color: "hsl(var(--muted))",
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Carregando relatórios...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Relatório de Vacinas</h1>
        <p className="text-muted-foreground">Visualize estatísticas e análises de vacinação</p>
      </div>

      {/* Filtros */}
      <div className="flex gap-4">
        <div className="w-[200px]">
          <label className="text-sm font-medium text-foreground mb-2 block">Tipo de Relatório</label>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Mensal</SelectItem>
              <SelectItem value="yearly">Anual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-[200px]">
          <label className="text-sm font-medium text-foreground mb-2 block">Ano</label>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o ano" />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cards de Resumo */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total de Vacinas</p>
              <p className="text-3xl font-bold text-foreground">{totalVaccines.toLocaleString('pt-BR')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Vacinas Distribuídas</p>
              <p className="text-3xl font-bold text-foreground">{vaccinesDistributed.toLocaleString('pt-BR')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Vacinas Administradas</p>
              <p className="text-3xl font-bold text-foreground">{vaccinesAdministered.toLocaleString('pt-BR')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Vacinas Perdidas</p>
              <p className="text-3xl font-bold text-foreground">{vaccinesLost.toLocaleString('pt-BR')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Vacinas por Mês */}
      <Card>
        <CardHeader>
          <CardTitle>Vacinas por Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={vaccinationsByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="month" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="vaccines" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Lucro e Perda */}
      <Card>
        <CardHeader>
          <CardTitle>Lucro e Perda</CardTitle>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-primary"></div>
              <span className="text-sm text-muted-foreground">Lucro</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-muted"></div>
              <span className="text-sm text-muted-foreground">Perda</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={profitLossByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="month" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="profit" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="loss" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};
