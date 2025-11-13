import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer, 
  Legend, 
  Tooltip 
} from 'recharts';
import { Client, User, Vaccine, VaccinationRecord, VaccineBatch } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { toBrasiliaISOString } from '@/lib/utils';

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(217, 91%, 60%)',
  'hsl(340, 82%, 52%)',
  'hsl(84, 81%, 44%)',
];

const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const Relatorios: React.FC = () => {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [vaccinations, setVaccinations] = useState<VaccinationRecord[]>([]);
  const [batches, setBatches] = useState<VaccineBatch[]>([]);
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [reportType, setReportType] = useState('yearly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [clientsData, vaccinesData, aplicacoesData, batchesData, agendamentosData] = await Promise.all([
        supabase.from('cliente').select('*'),
        supabase.from('vacina').select('*'),
        supabase.from('aplicacao').select('*'),
        supabase.from('lote').select('*'),
        supabase.from('agendamento').select('*'),
      ]);

      if (clientsData.error) throw clientsData.error;
      if (vaccinesData.error) throw vaccinesData.error;
      if (aplicacoesData.error) throw aplicacoesData.error;
      if (batchesData.error) throw batchesData.error;
      if (agendamentosData.error) throw agendamentosData.error;

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
      setAgendamentos(agendamentosData.data || []);
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

  const filterByPeriod = (dateString: string) => {
    const date = new Date(dateString);
    const yearMatch = date.getFullYear().toString() === selectedYear;
    
    if (reportType === 'yearly') {
      return yearMatch;
    } else {
      if (selectedMonth === 'all') return yearMatch;
      return yearMatch && date.getMonth().toString() === selectedMonth;
    }
  };

  // Filtrar dados pelo período
  const vacinacoesNoPeriodo = vaccinations.filter(v => filterByPeriod(v.applicationDate));
  const agendamentosNoPeriodo = agendamentos.filter(a => 
    a.status === 'AGENDADO' && filterByPeriod(a.dataagendada)
  );

  // Calcular métricas do resumo
  const vacinasDisponiveis = batches.reduce((sum, b) => sum + b.remainingQuantity, 0);
  const vacinasAgendadas = agendamentosNoPeriodo.length;
  const vacinasAplicadas = vacinacoesNoPeriodo.length;
  
  const today = new Date();
  const vacinasVencidas = batches.filter(b => {
    const expDate = new Date(b.expirationDate);
    return filterByPeriod(b.expirationDate) && expDate < today;
  }).length;

  // Dados para gráfico de linha - Vacinações por mês
  const vaccinationsByMonth = monthNames.map((month, index) => {
    const count = vacinacoesNoPeriodo.filter(v => {
      const date = new Date(v.applicationDate);
      return date.getMonth() === index;
    }).length;
    return { month, count };
  });

  // Dados para gráfico de barras - Lucro e Perda (CORRIGIDO)
  const profitLossByMonth = monthNames.map((month, index) => {
    const monthVaccinations = vacinacoesNoPeriodo.filter(v => {
      const date = new Date(v.applicationDate);
      return date.getMonth() === index;
    });

    let profit = 0;
    let loss = 0;

    monthVaccinations.forEach(vaccination => {
      const batch = batches.find(b => b.id === vaccination.batchId);
      if (batch && batch.purchasePrice && batch.salePrice) {
        const margem = batch.salePrice - batch.purchasePrice;
        
        if (margem > 0) {
          profit += margem;
        } else {
          loss += Math.abs(margem);
        }
      }
    });

    return { 
      month, 
      lucro: parseFloat(profit.toFixed(2)), 
      perda: parseFloat(loss.toFixed(2)) 
    };
  });

  // Dados para gráfico de pizza - Distribuição de vacinas aplicadas
  const vacinasPorTipo = vaccines.map(vaccine => {
    const count = vacinacoesNoPeriodo.filter(v => {
      const batch = batches.find(b => b.id === v.batchId);
      return batch?.vaccineId === vaccine.id;
    }).length;
    
    return {
      nome: vaccine.name,
      quantidade: count,
    };
  }).filter(v => v.quantidade > 0)
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, 6);

  const totalVacinas = vacinasPorTipo.reduce((sum, v) => sum + v.quantidade, 0);
  const vacinasPorTipoComPorcentagem = vacinasPorTipo.map(v => ({
    ...v,
    porcentagem: totalVacinas > 0 ? parseFloat(((v.quantidade / totalVacinas) * 100).toFixed(1)) : 0,
  }));

  // Dados para gráfico de pizza - Status do Estoque
  const statusEstoque = [
    { 
      status: 'Disponíveis', 
      quantidade: vacinasDisponiveis,
    },
    { 
      status: 'Agendadas', 
      quantidade: vacinasAgendadas,
    },
    { 
      status: 'Aplicadas', 
      quantidade: vacinasAplicadas,
    },
    { 
      status: 'Vencidas', 
      quantidade: vacinasVencidas,
    },
  ].filter(s => s.quantidade > 0);

  // Dados para gráfico de pizza - Distribuição por faixa etária
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

  const faixasEtarias: Record<string, number> = {
    'Crianças (0-12)': 0,
    'Adolescentes (13-17)': 0,
    'Adultos (18-59)': 0,
    'Idosos (60+)': 0,
  };

  vacinacoesNoPeriodo.forEach(v => {
    const client = clients.find(c => c.id === v.clientId);
    if (client && client.dateOfBirth) {
      const age = calculateAge(client.dateOfBirth);
      if (age <= 12) faixasEtarias['Crianças (0-12)']++;
      else if (age <= 17) faixasEtarias['Adolescentes (13-17)']++;
      else if (age <= 59) faixasEtarias['Adultos (18-59)']++;
      else faixasEtarias['Idosos (60+)']++;
    }
  });

  const faixasEtariasData = Object.entries(faixasEtarias)
    .map(([faixa, quantidade]) => ({ faixa, quantidade }))
    .filter(f => f.quantidade > 0);

  // Dados para gráfico de área - Acumulado de aplicações
  const aplicacoesAcumuladas = monthNames.map((month, index) => {
    const aplicacoesAteOMes = vacinacoesNoPeriodo.filter(v => {
      const date = new Date(v.applicationDate);
      return date.getMonth() <= index;
    }).length;
    
    return {
      month,
      acumulado: aplicacoesAteOMes,
    };
  });

  // Top 5 vacinas por lucro
  const top5Lucro = vaccines.map(vaccine => {
    const aplicacoesVacina = vacinacoesNoPeriodo.filter(v => {
      const batch = batches.find(b => b.id === v.batchId);
      return batch?.vaccineId === vaccine.id;
    });

    let lucroTotal = 0;
    aplicacoesVacina.forEach(apl => {
      const batch = batches.find(b => b.id === apl.batchId);
      if (batch && batch.salePrice && batch.purchasePrice) {
        lucroTotal += (batch.salePrice - batch.purchasePrice);
      }
    });

    return {
      nome: vaccine.name,
      lucro: lucroTotal,
      aplicacoes: aplicacoesVacina.length,
    };
  }).filter(v => v.lucro > 0)
    .sort((a, b) => b.lucro - a.lucro)
    .slice(0, 5);

  // Top 5 vacinas por perda
  const top5Perda = vaccines.map(vaccine => {
    const aplicacoesVacina = vacinacoesNoPeriodo.filter(v => {
      const batch = batches.find(b => b.id === v.batchId);
      return batch?.vaccineId === vaccine.id;
    });

    let perdaTotal = 0;
    aplicacoesVacina.forEach(apl => {
      const batch = batches.find(b => b.id === apl.batchId);
      if (batch && batch.salePrice && batch.purchasePrice) {
        const margem = batch.salePrice - batch.purchasePrice;
        if (margem < 0) {
          perdaTotal += Math.abs(margem);
        }
      }
    });

    return {
      nome: vaccine.name,
      perda: perdaTotal,
      aplicacoes: aplicacoesVacina.length,
    };
  }).filter(v => v.perda > 0)
    .sort((a, b) => b.perda - a.perda)
    .slice(0, 5);

  // Vacinas mais e menos vendidas
  const vacinasVendidas = vaccines.map(vaccine => {
    const aplicacoes = vacinacoesNoPeriodo.filter(v => {
      const batch = batches.find(b => b.id === v.batchId);
      return batch?.vaccineId === vaccine.id;
    }).length;

    return {
      nome: vaccine.name,
      quantidadeVendida: aplicacoes,
    };
  }).filter(v => v.quantidadeVendida > 0)
    .sort((a, b) => b.quantidadeVendida - a.quantidadeVendida);

  const maisVendida = vacinasVendidas[0];
  const menosVendida = vacinasVendidas[vacinasVendidas.length - 1];

  // Anos disponíveis
  const availableYears = Array.from(new Set(
    vaccinations.map(v => new Date(v.applicationDate).getFullYear())
  )).sort((a, b) => b - a);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando relatórios...</p>
      </div>
    );
  }

  const chartConfig = {
    count: {
      label: "Vacinações",
      color: "hsl(var(--chart-1))",
    },
    lucro: {
      label: "Lucro",
      color: "hsl(var(--chart-2))",
    },
    perda: {
      label: "Perda",
      color: "hsl(var(--chart-3))",
    },
    acumulado: {
      label: "Acumulado",
      color: "hsl(var(--chart-4))",
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">📊 Relatório de Vacinas</h1>
        <p className="text-muted-foreground">
          Visualize estatísticas e análises detalhadas
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Tipo de Relatório</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yearly">Anual</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Ano</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue />
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

            {reportType === 'monthly' && (
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Mês</label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os meses</SelectItem>
                    {monthNames.map((month, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Card de Resumo */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Resumo do Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">💊 Disponíveis</p>
              <p className="text-2xl font-bold text-primary">{vacinasDisponiveis}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">📅 Agendadas</p>
              <p className="text-2xl font-bold text-chart-1">{vacinasAgendadas}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">💉 Aplicadas</p>
              <p className="text-2xl font-bold text-chart-2">{vacinasAplicadas}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">⚠️ Vencidas</p>
              <p className="text-2xl font-bold text-destructive">{vacinasVencidas}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráficos principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gráfico de Linha - Vacinações */}
        <Card>
          <CardHeader>
            <CardTitle>📈 Vacinações por Mês</CardTitle>
            <CardDescription>Total de aplicações realizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <LineChart data={vaccinationsByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="var(--color-count)" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Barras - Lucro e Perda */}
        <Card>
          <CardHeader>
            <CardTitle>💰 Lucro e Perda</CardTitle>
            <CardDescription>Análise financeira mensal</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <BarChart data={profitLossByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="lucro" fill="var(--color-lucro)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="perda" fill="var(--color-perda)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos de Pizza */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pizza - Distribuição de Vacinas */}
        <Card>
          <CardHeader>
            <CardTitle>🧮 Distribuição de Vacinas</CardTitle>
            <CardDescription>Proporção de vacinas aplicadas</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <PieChart>
                <Pie
                  data={vacinasPorTipoComPorcentagem}
                  dataKey="quantidade"
                  nameKey="nome"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => `${entry.nome}: ${entry.porcentagem}%`}
                >
                  {vacinasPorTipoComPorcentagem.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Pizza - Status do Estoque */}
        <Card>
          <CardHeader>
            <CardTitle>📊 Status do Estoque</CardTitle>
            <CardDescription>Situação geral das vacinas</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <PieChart>
                <Pie
                  data={statusEstoque}
                  dataKey="quantidade"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {statusEstoque.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Pizza - Faixa Etária */}
        {faixasEtariasData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>👥 Distribuição por Faixa Etária</CardTitle>
              <CardDescription>Clientes vacinados por idade</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <PieChart>
                  <Pie
                    data={faixasEtariasData}
                    dataKey="quantidade"
                    nameKey="faixa"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {faixasEtariasData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Área - Acumulado de Aplicações */}
        <Card>
          <CardHeader>
            <CardTitle>📈 Acumulado de Aplicações</CardTitle>
            <CardDescription>Crescimento ao longo do tempo</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <AreaChart data={aplicacoesAcumuladas}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area 
                  type="monotone" 
                  dataKey="acumulado" 
                  stroke="var(--color-acumulado)" 
                  fill="var(--color-acumulado)" 
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Análise por Vacina */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top 5 Lucro */}
        {top5Lucro.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>💎 Top 5 Vacinas por Lucro</CardTitle>
              <CardDescription>Vacinas mais rentáveis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {top5Lucro.map((vaccine, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{index + 1}. {vaccine.nome}</p>
                      <p className="text-sm text-muted-foreground">{vaccine.aplicacoes} aplicações</p>
                    </div>
                    <p className="text-lg font-bold text-chart-2">
                      R$ {vaccine.lucro.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top 5 Perda */}
        {top5Perda.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>📉 Top 5 Vacinas por Perda</CardTitle>
              <CardDescription>Vacinas com maior prejuízo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {top5Perda.map((vaccine, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{index + 1}. {vaccine.nome}</p>
                      <p className="text-sm text-muted-foreground">{vaccine.aplicacoes} aplicações</p>
                    </div>
                    <p className="text-lg font-bold text-destructive">
                      R$ {vaccine.perda.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mais Vendida */}
        {maisVendida && (
          <Card>
            <CardHeader>
              <CardTitle>🏅 Vacina Mais Vendida</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center p-6">
                <p className="text-3xl font-bold text-primary mb-2">{maisVendida.nome}</p>
                <p className="text-xl text-muted-foreground">{maisVendida.quantidadeVendida} aplicações</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Menos Vendida */}
        {menosVendida && (
          <Card>
            <CardHeader>
              <CardTitle>📊 Vacina Menos Vendida</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center p-6">
                <p className="text-3xl font-bold text-muted-foreground mb-2">{menosVendida.nome}</p>
                <p className="text-xl text-muted-foreground">{menosVendida.quantidadeVendida} aplicações</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
