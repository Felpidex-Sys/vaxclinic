import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer, 
  Legend, 
  Tooltip 
} from 'recharts';
import { Client, Vaccine, VaccinationRecord, VaccineBatch } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth'; // Importação correta
import { 
  TrendingUp, TrendingDown, Award, BarChart3, PackageX, 
  AlertTriangle, DollarSign, Target, Syringe, Package, 
  User as UserIcon, Filter, Calendar, Users, Activity,
  PieChart as PieChartIcon, Percent, FileText, Download,
  UsersRound, AlertCircle, Warehouse, History, PackageSearch,
  UserSquare, Box
} from 'lucide-react';
import { 
  addYears, subDays, format, startOfMonth, endOfMonth, 
  startOfYear, endOfYear, differenceInDays 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

// --- Constantes e Tipos ---

const COLORS = [
  'hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))',
  'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--chart-6))',
  'hsl(var(--chart-7))', 'hsl(var(--chart-8))',
];

const monthNames = [...Array(12)].map((_, i) => format(new Date(2000, i), 'MMM', { locale: ptBR }));

type ComparisonPeriodType = 'none' | 'previous' | 'lastYear';
type ReportType = 'yearly' | 'monthly' | 'custom';
type DashboardContext = 'general' | 'employee' | 'vaccine' | 'client' | 'comparison'; // Novo contexto

type DateRange = {
  start: Date;
  end: Date;
};

type Metrics = {
  receitaBruta: number;
  custoTotal: number;
  lucroTotal: number;
  perdaMargem: number;
  totalAplicacoes: number;
  margemLucroPercent: number;
  ticketMedio: number;
  perdasVencimento: number;
};

// --- Componente Reutilizável: KpiCard ---

interface KpiCardProps {
  title: string;
  value: number;
  comparisonValue?: number;
  formatType?: 'R$' | '%' | 'dias' | 'numero';
  icon: React.ReactNode;
  description?: string;
  isLoading?: boolean;
  className?: string;
}

const formatValue = (value: number, formatType: KpiCardProps['formatType']) => {
  if (isNaN(value) || !isFinite(value)) value = 0;
  switch (formatType) {
    case 'R$':
      return `R$ ${value.toFixed(2)}`;
    case '%':
      return `${value.toFixed(1)}%`;
    case 'dias':
      return `${Math.round(value)} dias`;
    case 'numero':
      return value.toLocaleString('pt-BR');
    default:
      return value.toString();
  }
};

const KpiCard: React.FC<KpiCardProps> = ({ title, value, comparisonValue, formatType = 'numero', icon, description, isLoading, className }) => {
  const hasComparison = comparisonValue !== undefined && isFinite(comparisonValue);
  let delta: number | undefined;
  let isPositive: boolean | undefined;

  if (hasComparison) {
    if (comparisonValue === 0) {
      if (value > 0) delta = 100.0;
      else delta = 0;
    } else {
      delta = ((value - comparisonValue!) / Math.abs(comparisonValue!)) * 100;
    }
    
    if (isNaN(delta) || !isFinite(delta)) delta = 0;
    isPositive = delta >= 0;
    
    if (title.toLowerCase().includes('perda') || title.toLowerCase().includes('custo') || title.toLowerCase().includes('desperdício')) {
      isPositive = delta <= 0;
    }
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            {title}
            <div className="text-muted-foreground">{icon}</div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-8 w-1/2 bg-muted rounded animate-pulse" />
          <div className="h-4 w-1/3 bg-muted rounded animate-pulse mt-2" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          {title}
          <div className="text-muted-foreground">{icon}</div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{formatValue(value, formatType)}</p>
        {hasComparison && delta !== undefined && (
          <div className="flex items-center gap-1 text-xs">
            <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
              {isPositive ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}%
            </span>
            <span className="text-muted-foreground">vs. período anterior</span>
          </div>
        )}
        {description && !hasComparison && (
           <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};

// --- Componente Principal: Relatorios ---

export const Relatorios: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // --- Estados de Dados ---
  const [clients, setClients] = useState<Client[]>([]);
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [vaccinations, setVaccinations] = useState<VaccinationRecord[]>([]);
  const [batches, setBatches] = useState<VaccineBatch[]>([]);
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Estados de Filtro ---
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [reportType, setReportType] = useState<ReportType>('monthly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString());
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  const [selectedVaccine, setSelectedVaccine] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<string>('all');
  
  const [comparisonType, setComparisonType] = useState<ComparisonPeriodType>('none');

  // Novos estados para Comparação de Vacinas
  const [compareVaccine1, setCompareVaccine1] = useState<string>('all');
  const [compareVaccine2, setCompareVaccine2] = useState<string>('all');

  // --- Carregamento de Dados ---
  useEffect(() => {
    if (!user) return; // Espera o usuário estar autenticado

    fetchData();
  }, [user]); // Dispara quando o usuário for carregado

  const fetchData = async () => {
    try {
      setLoading(true);

      // Função auxiliar para buscar dados de forma segura e reportar erros
      const fetchAndReport = async (tableName: string, query: any) => {
        try {
          const result = await query;
          if (result.error) throw result.error;
          return result;
        } catch (error: any) {
          console.error(`Falha ao buscar dados da tabela: ${tableName}`, error.message);
          toast({
            title: `Erro ao carregar ${tableName}`,
            description: error.message,
            variant: "destructive",
          });
          return { data: [], error: error }; // Retorna dados vazios para não quebrar o map
        }
      };

      // 1. Executar todas as buscas de forma isolada
      const [
        clientsData, 
        vaccinesData, 
        aplicacoesData, 
        batchesData, 
        agendamentosData, 
        funcionariosData
      ] = await Promise.all([
        fetchAndReport('cliente', supabase.from('cliente').select('*')),
        fetchAndReport('vacina', supabase.from('vacina').select('*')),
        fetchAndReport('aplicacao', supabase.from('aplicacao').select('*')),
        fetchAndReport('lote', supabase.from('lote').select('*')),
        fetchAndReport('agendamento', supabase.from('agendamento').select('*')),
        fetchAndReport('funcionario', supabase.from('funcionario').select('*'))
      ]);

      // 2. Mapear os dados (agora é seguro, pois mesmo com erro, 'data' será um array vazio)
      const mappedClients: Client[] = (clientsData.data || []).map((c: any) => ({
        id: c.cpf, name: c.nomecompleto, cpf: c.cpf,
        dateOfBirth: c.datanasc || '', phone: c.telefone || '', email: c.email || '',
        address: '', allergies: c.alergias || '', observations: c.observacoes || '',
        createdAt: c.created_at || new Date().toISOString(),
      }));

      const mappedVaccines: Vaccine[] = (vaccinesData.data || []).map(v => ({
        id: v.idvacina.toString(), name: v.nome, manufacturer: v.fabricante || '',
        description: v.descricao || '', targetDisease: v.descricao || v.nome,
        dosesRequired: v.quantidadedoses || 1, createdAt: v.created_at || new Date().toISOString(),
      }));
      
      const batchesDataSafe = batchesData.data || [];
      const mappedBatches: VaccineBatch[] = batchesDataSafe.map(b => ({
        id: b.numlote.toString(), vaccineId: b.vacina_idvacina.toString(), batchNumber: b.codigolote,
        quantity: b.quantidadeinicial, remainingQuantity: b.quantidadedisponivel,
        manufacturingDate: new Date(new Date(b.datavalidade).setFullYear(new Date(b.datavalidade).getFullYear() - 2)).toISOString().split('T')[0],
        expirationDate: b.datavalidade, purchasePrice: b.precocompra,
        salePrice: b.precovenda, createdAt: b.created_at || new Date().toISOString(),
      }));

      const mappedVaccinations: VaccinationRecord[] = (aplicacoesData.data || []).map(a => {
        const batch = batchesDataSafe.find(b => b.numlote === a.lote_numlote);
        return {
          id: a.idaplicacao.toString(), clientId: a.cliente_cpf,
          vaccineId: batch?.vacina_idvacina.toString() || '',
          appliedBy: a.funcionario_idfuncionario.toString(),
          batchId: a.lote_numlote?.toString() || '', applicationDate: a.dataaplicacao,
          doseNumber: a.dose || 1, nextDueDate: '', observations: a.observacoes || '',
          createdAt: a.dataaplicacao,
          precovenda: a.precovenda || batch?.precovenda || 0,
          precocompra: a.precocompra || batch?.precocompra || 0,
        };
      });

      const mappedEmployees = (funcionariosData.data || []).map(f => ({
        id: f.idfuncionario.toString(), name: f.nomecompleto,
        cpf: f.cpf, email: f.email, cargo: f.cargo,
      }));

      // 3. Setar os estados
      setClients(mappedClients);
      setVaccines(mappedVaccines);
      setVaccinations(mappedVaccinations);
      setBatches(mappedBatches);
      setAgendamentos(agendamentosData.data || []); 
      setEmployees(mappedEmployees);

    } catch (error: any) {
      // Este catch agora só pegará erros de lógica no *mapeamento*, não na busca
      console.error('Erro ao mapear dados:', error);
      toast({
        title: "Erro ao processar dados",
        description: `Os dados foram buscados, mas houve um erro ao processá-los: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // --- Lógica de Período e Comparação ---

  const getPeriodDates = (
    type: ReportType, year: string, month: string, 
    start: string, end: string
  ): DateRange | null => {
    const y = parseInt(year);
    const m = parseInt(month);
    try {
      if (type === 'yearly') {
        return { start: startOfYear(new Date(y, 0)), end: endOfYear(new Date(y, 0)) };
      }
      if (type === 'monthly') {
        if (month === 'all') {
          return { start: startOfYear(new Date(y, 0)), end: endOfYear(new Date(y, 0)) };
        }
        return { start: startOfMonth(new Date(y, m)), end: endOfMonth(new Date(y, m)) };
      }
      if (type === 'custom' && start && end) {
        return { start: new Date(`${start}T00:00:00`), end: new Date(`${end}T23:59:59`) };
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  const getComparisonDates = (mainPeriod: DateRange, type: ComparisonPeriodType): DateRange | null => {
    if (type === 'none' || !mainPeriod) return null;
    
    const duration = differenceInDays(mainPeriod.end, mainPeriod.start);
    
    if (type === 'previous') {
      const end = subDays(mainPeriod.start, 1);
      const start = subDays(end, duration);
      return { start, end };
    }
    
    if (type === 'lastYear') {
      const start = addYears(mainPeriod.start, -1);
      const end = addYears(mainPeriod.end, -1);
      return { start, end };
    }
    
    return null;
  };

  const mainPeriod = useMemo(() => 
    getPeriodDates(reportType, selectedYear, selectedMonth, startDate, endDate),
  [reportType, selectedYear, selectedMonth, startDate, endDate]);

  const comparisonPeriod = useMemo(() => 
    getComparisonDates(mainPeriod!, comparisonType),
  [mainPeriod, comparisonType]);

  // --- Funções de Filtragem e Cálculo ---

  const filterByDateRange = (dateString: string, period: DateRange | null) => {
    if (!period || !dateString) return false;
    const date = new Date(dateString);
    return date >= period.start && date <= period.end;
  };

  // VACCINATIONS é filtrado por PERÍODO e ENTIDADE
  const mainVaccinations = useMemo(() => {
    // Se estivermos em modo de comparação, não filtre por vacina aqui
    const isComparing = compareVaccine1 !== 'all' && compareVaccine2 !== 'all';
    
    return vaccinations.filter(v => {
      if (!filterByDateRange(v.applicationDate, mainPeriod)) return false;

      const vaccineMatch = isComparing || selectedVaccine === 'all' || 
        batches.find(b => b.id === v.batchId)?.vaccineId === selectedVaccine;
      const employeeMatch = selectedEmployee === 'all' || v.appliedBy === selectedEmployee;
      const clientMatch = selectedClient === 'all' || v.clientId === selectedClient;
      
      return vaccineMatch && employeeMatch && clientMatch;
    });
  }, [vaccinations, mainPeriod, selectedVaccine, selectedEmployee, selectedClient, batches, compareVaccine1, compareVaccine2]);
  
  // VACCINATIONS DE COMPARAÇÃO é filtrado por PERÍODO DE COMPARAÇÃO e ENTIDADE
  const compVaccinations = useMemo(() => {
    // Se estivermos em modo de comparação, não filtre por vacina aqui
    const isComparing = compareVaccine1 !== 'all' && compareVaccine2 !== 'all';

    return vaccinations.filter(v => {
      if (!filterByDateRange(v.applicationDate, comparisonPeriod)) return false;

      const vaccineMatch = isComparing || selectedVaccine === 'all' || 
        batches.find(b => b.id === v.batchId)?.vaccineId === selectedVaccine;
      const employeeMatch = selectedEmployee === 'all' || v.appliedBy === selectedEmployee;
      const clientMatch = selectedClient === 'all' || v.clientId === selectedClient;
      
      return vaccineMatch && employeeMatch && clientMatch;
    });
  }, [vaccinations, comparisonPeriod, selectedVaccine, selectedEmployee, selectedClient, batches, compareVaccine1, compareVaccine2]);


  const calculateMetrics = (
    periodVaccinations: VaccinationRecord[], 
    periodBatches: VaccineBatch[],
    period: DateRange | null
  ): Metrics => {
    let receitaBruta = 0;
    let custoTotal = 0;
    let perdaMargem = 0;
    
    periodVaccinations.forEach(v => {
      const venda = v.precovenda || 0;
      const compra = v.precocompra || 0;
      receitaBruta += venda;
      custoTotal += compra;
      
      const margem = venda - compra;
      if (margem < 0) {
        perdaMargem += Math.abs(margem);
      }
    });

    const lucroTotal = receitaBruta - custoTotal;
    const totalAplicacoes = periodVaccinations.length;
    const margemLucroPercent = receitaBruta > 0 ? (lucroTotal / receitaBruta) * 100 : 0;
    const ticketMedio = totalAplicacoes > 0 ? (receitaBruta / totalAplicacoes) : 0;

    const perdasVencimento = periodBatches
      .filter(b => {
        if (!period) return false;
        const expDate = new Date(b.expirationDate);
        return expDate >= period.start && expDate <= period.end && expDate < new Date() && b.remainingQuantity > 0;
      })
      .reduce((sum, b) => sum + (b.remainingQuantity * (b.purchasePrice || 0)), 0);

    return { 
      receitaBruta, custoTotal, lucroTotal, perdaMargem, 
      totalAplicacoes, margemLucroPercent, ticketMedio, perdasVencimento 
    };
  };

  // --- KPIs Principais ---
  // Note: mainMetrics e compMetrics agora refletem os filtros de entidade (func, vacina, cliente)
  const mainMetrics = useMemo(() => calculateMetrics(mainVaccinations, batches, mainPeriod), [mainVaccinations, batches, mainPeriod]);
  const compMetrics = useMemo(() => calculateMetrics(compVaccinations, batches, comparisonPeriod), [compVaccinations, batches, comparisonPeriod]);

  // --- Lógica de Contexto do Dashboard ---
  const dashboardContext = useMemo((): DashboardContext => {
    if (compareVaccine1 !== 'all' && compareVaccine2 !== 'all') {
      return 'comparison';
    }
    if (selectedEmployee !== 'all') return 'employee';
    if (selectedVaccine !== 'all') return 'vaccine';
    if (selectedClient !== 'all') return 'client';
    return 'general';
  }, [selectedEmployee, selectedVaccine, selectedClient, compareVaccine1, compareVaccine2]);

  // --- Dados para Gráfico de Evolução (Sempre filtrado por mainVaccinations) ---
  const evolutionData = useMemo(() => {
    if (!mainPeriod) return [];
    
    const diffDays = differenceInDays(mainPeriod.end, mainPeriod.start);
    let labels: string[] = [];

    // Geração de Labels
    if (diffDays <= 31) { // Por Dia
      let current = mainPeriod.start;
      while (current <= mainPeriod.end) {
        labels.push(format(current, 'dd/MM'));
        current = subDays(current, -1);
      }
    } else if (diffDays <= 365) { // Por Mês
      let current = startOfMonth(mainPeriod.start);
      while (current <= mainPeriod.end) {
        labels.push(format(current, 'MMM/yy', { locale: ptBR }));
        current = subDays(current, -31); // Avança mês a mês
        current = startOfMonth(current); // Garante que caia no início do próximo
      }
    } else { // Por Ano
      let current = startOfYear(mainPeriod.start);
      while (current <= mainPeriod.end) {
        labels.push(format(current, 'yyyy'));
        current = addYears(current, 1);
      }
    }

    // Mapeamento dos dados
    return labels.map(label => {
      const periodVaccinations = mainVaccinations.filter(v => {
        const date = new Date(v.applicationDate);
        if (diffDays <= 31) return format(date, 'dd/MM') === label;
        if (diffDays <= 365) return format(date, 'MMM/yy', { locale: ptBR }) === label;
        return format(date, 'yyyy') === label;
      });
      
      const metrics = calculateMetrics(periodVaccinations, [], null);
      
      return { 
        label, 
        Aplicações: metrics.totalAplicacoes, 
        Lucro: metrics.lucroTotal, 
        Receita: metrics.receitaBruta 
      };
    });
  }, [mainPeriod, mainVaccinations]);

  // --- Ações (Exportar CSV) ---
  const handleExportCSV = () => {
    if (mainVaccinations.length === 0) {
      toast({ title: "Nenhum dado para exportar", variant: "destructive" });
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    // Cabeçalho
    csvContent += "Data Aplicacao;Cliente;CPF Cliente;Funcionario;Vacina;Lote;Preco Venda;Preco Custo;Lucro\r\n";

    mainVaccinations.forEach(v => {
      const client = clients.find(c => c.id === v.clientId);
      const employee = employees.find(e => e.id === v.appliedBy);
      const batch = batches.find(b => b.id === v.batchId);
      const vaccine = vaccines.find(vac => vac.id === batch?.vaccineId);
      
      const venda = v.precovenda || 0;
      const compra = v.precocompra || 0;
      const lucro = venda - compra;

      const row = [
        v.applicationDate ? format(new Date(v.applicationDate), 'yyyy-MM-dd HH:mm') : '',
        client?.name || 'N/I',
        client?.cpf || 'N/I',
        employee?.name || 'N/I',
        vaccine?.name || 'N/I',
        batch?.batchNumber || 'N/I',
        venda.toFixed(2),
        compra.toFixed(2),
        lucro.toFixed(2)
      ].join(";");
      
      csvContent += row + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_vacinacao_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Hooks de Dados Específicos (para os novos views) ---

  // -> DADOS PARA VIEW GERAL
  const generalData = useMemo(() => {
    if (dashboardContext !== 'general') return null;

    // KPIs de Inventário (só faz sentido na visão geral)
    // Usamos 'vaccinations' (todas) para calcular a média de consumo
    const aplicacoes30d = vaccinations.filter(v => filterByDateRange(v.applicationDate, {start: subDays(new Date(), 30), end: new Date()})).length;
    const aplicacoesPorDia = aplicacoes30d / 30;

    const totalEstoqueDisponivel = batches.reduce((sum, b) => sum + b.remainingQuantity, 0);
    const diasDeCobertura = (aplicacoesPorDia > 0 && isFinite(aplicacoesPorDia)) ? (totalEstoqueDisponivel / aplicacoesPorDia) : 0;
    
    // Usamos 'mainMetrics' (do período) para desperdício
    const custoTotalCompras = mainMetrics.custoTotal;
    const valorPerdaVencimento = mainMetrics.perdasVencimento;
    const taxaDesperdicioPercent = (custoTotalCompras + valorPerdaVencimento) > 0 ? (valorPerdaVencimento / (custoTotalCompras + valorPerdaVencimento)) * 100 : 0;

    // Top 10 Clientes (baseado em mainVaccinations)
    const clientesMap = new Map<string, { id: string; nome: string; gasto: number; aplicacoes: number }>();
    mainVaccinations.forEach(v => {
      const client = clients.find(c => c.id === v.clientId); if (!client) return;
      const gasto = v.precovenda || 0;
      if (!clientesMap.has(client.id)) {
        clientesMap.set(client.id, { id: client.id, nome: client.name, gasto: 0, aplicacoes: 0 });
      }
      const stats = clientesMap.get(client.id)!;
      stats.gasto += gasto;
      stats.aplicacoes++;
    });
    const topClientes = Array.from(clientesMap.values()).sort((a, b) => b.gasto - a.gasto).slice(0, 10);

    // Novos vs. Recorrentes (usa 'vaccinations' e 'mainVaccinations')
    let novos = 0; let recorrentes = 0;
    const clientesNoPeriodo = new Set(mainVaccinations.map(v => v.clientId));
    clientesNoPeriodo.forEach(clientId => {
      const allAppsForClient = vaccinations.filter(v => v.clientId === clientId && v.applicationDate)
        .sort((a, b) => new Date(a.applicationDate).getTime() - new Date(b.applicationDate).getTime());
      if (allAppsForClient.length > 0) {
        const firstEverAppDate = allAppsForClient[0].applicationDate;
        if (filterByDateRange(firstEverAppDate, mainPeriod)) novos++;
        else recorrentes++;
      }
    });
    const novosVsRecorrentesData = [
      { nome: 'Novos', valor: novos, fill: COLORS[0] },
      { nome: 'Recorrentes', valor: recorrentes, fill: COLORS[1] },
    ].filter(d => d.valor > 0);

    // Top 5 Funcionários (baseado em mainVaccinations)
    const funcionariosMap = new Map<string, { id: string; nome: string; aplicacoes: number }>();
    mainVaccinations.forEach(v => {
      const funcionario = employees.find(e => e.id === v.appliedBy); if (!funcionario) return;
      
      if (!funcionariosMap.has(funcionario.id)) {
        funcionariosMap.set(funcionario.id, { id: funcionario.id, nome: funcionario.name, aplicacoes: 0 });
      }
      const stats = funcionariosMap.get(funcionario.id)!;
      stats.aplicacoes++;
    });
    const topFuncionarios = Array.from(funcionariosMap.values())
      .sort((a, b) => b.aplicacoes - a.aplicacoes) // Ordenado por aplicações
      .slice(0, 5);

    // Top 5 Lotes (baseado em mainVaccinations)
    const lotesMap = new Map<string, { id: string; nomeVacina: string; loteNumero: string; aplicacoes: number }>();
    mainVaccinations.forEach(v => {
      const batch = batches.find(b => b.id === v.batchId);
      const vaccine = vaccines.find(vac => vac.id === batch?.vaccineId); 
      if (!batch || !vaccine) return;

      if (!lotesMap.has(batch.id)) {
        lotesMap.set(batch.id, { 
          id: batch.id, 
          nomeVacina: vaccine.name, 
          loteNumero: batch.batchNumber, 
          aplicacoes: 0 
        });
      }
      lotesMap.get(batch.id)!.aplicacoes++;
    });
    const topLotes = Array.from(lotesMap.values())
      .sort((a, b) => b.aplicacoes - a.aplicacoes)
      .slice(0, 5);

    return {
      inventory: { diasDeCobertura, taxaDesperdicioPercent, valorPerdaVencimento },
      crm: { topClientes, novosVsRecorrentesData },
      performance: { topFuncionarios, topLotes } // Retorna topLotes
    };
  }, [dashboardContext, batches, mainPeriod, mainMetrics, mainVaccinations, clients, vaccinations, employees]);

  // -> DADOS PARA VIEW DE VACINA
  const vaccineData = useMemo(() => {
    if (dashboardContext !== 'vaccine') return null;

    // Top 5 Funcionários que mais aplicaram ESTA vacina
    const funcionariosMap = new Map<string, { id: string; nome: string; aplicacoes: number }>();
    mainVaccinations.forEach(v => { // mainVaccinations já está filtrado pela vacina
      const funcionario = employees.find(e => e.id === v.appliedBy); if (!funcionario) return;
      if (!funcionariosMap.has(funcionario.id)) {
        funcionariosMap.set(funcionario.id, { id: funcionario.id, nome: funcionario.name, aplicacoes: 0 });
      }
      funcionariosMap.get(funcionario.id)!.aplicacoes++;
    });
    const topFuncionarios = Array.from(funcionariosMap.values()).sort((a, b) => b.aplicacoes - a.aplicacoes).slice(0, 5);
    
    // Top 5 Lotes (por lucro) DESTA vacina
    const lotesMap = new Map<string, { id: string; codigo: string; lucro: number; aplicacoes: number }>();
    mainVaccinations.forEach(v => {
      const batch = batches.find(b => b.id === v.batchId); if (!batch) return;
      const margem = (v.precovenda || 0) - (v.precocompra || 0);
      if (!lotesMap.has(batch.id)) {
        lotesMap.set(batch.id, { id: batch.id, codigo: batch.batchNumber, lucro: 0, aplicacoes: 0 });
      }
      const stats = lotesMap.get(batch.id)!;
      stats.aplicacoes++;
      if (margem > 0) stats.lucro += margem;
    });
    const topLotes = Array.from(lotesMap.values()).sort((a, b) => b.lucro - a.lucro).slice(0, 5);

    return { topFuncionarios, topLotes };
  }, [dashboardContext, mainVaccinations, employees, batches]);

  // -> DADOS PARA VIEW DE FUNCIONÁRIO
  const employeeData = useMemo(() => {
    if (dashboardContext !== 'employee') return null;

    // Distribuição de vacinas aplicadas por ESTE funcionário
    const vacinasMap = new Map<string, { id: string; nome: string; aplicacoes: number }>();
    mainVaccinations.forEach(v => { // mainVaccinations já está filtrado pelo funcionário
      const batch = batches.find(b => b.id === v.batchId);
      const vaccine = vaccines.find(vac => vac.id === batch?.vaccineId); if (!vaccine) return;
      
      if (!vacinasMap.has(vaccine.id)) {
        vacinasMap.set(vaccine.id, { id: vaccine.id, nome: vaccine.name, aplicacoes: 0 });
      }
      vacinasMap.get(vaccine.id)!.aplicacoes++;
    });
    const vacinasDistrib = Array.from(vacinasMap.values())
      .sort((a, b) => b.aplicacoes - a.aplicacoes)
      .map((v, i) => ({ ...v, fill: COLORS[i % COLORS.length] }));

    return { vacinasDistrib };
  }, [dashboardContext, mainVaccinations, batches, vaccines]);

  // -> DADOS PARA VIEW DE CLIENTE
  const clientData = useMemo(() => {
    if (dashboardContext !== 'client') return null;

    // Distribuição de vacinas recebidas por ESTE cliente
    const vacinasMap = new Map<string, { id: string; nome: string; aplicacoes: number }>();
    mainVaccinations.forEach(v => { // mainVaccinations já está filtrado pelo cliente
      const batch = batches.find(b => b.id === v.batchId);
      const vaccine = vaccines.find(vac => vac.id === batch?.vaccineId); if (!vaccine) return;
      
      if (!vacinasMap.has(vaccine.id)) {
        vacinasMap.set(vaccine.id, { id: vaccine.id, nome: vaccine.name, aplicacoes: 0 });
      }
      vacinasMap.get(vaccine.id)!.aplicacoes++;
    });
    const vacinasDistrib = Array.from(vacinasMap.values())
      .sort((a, b) => b.aplicacoes - a.aplicacoes)
      .map((v, i) => ({ ...v, fill: COLORS[i % COLORS.length] }));

    return { vacinasDistrib };
  }, [dashboardContext, mainVaccinations, batches, vaccines]);

  // -> DADOS PARA VIEW DE COMPARAÇÃO
  const comparisonData = useMemo(() => {
    if (dashboardContext !== 'comparison' || !mainPeriod) return null;

    // 1. Filtrar vacinações para a Vacina 1
    const v1_vaccinations = vaccinations.filter(v => {
      if (!filterByDateRange(v.applicationDate, mainPeriod)) return false;
      const batch = batches.find(b => b.id === v.batchId);
      return batch?.vaccineId === compareVaccine1;
    });

    // 2. Filtrar vacinações para a Vacina 2
    const v2_vaccinations = vaccinations.filter(v => {
      if (!filterByDateRange(v.applicationDate, mainPeriod)) return false;
      const batch = batches.find(b => b.id === v.batchId);
      return batch?.vaccineId === compareVaccine2;
    });

    // 3. Calcular métricas para cada uma
    const metricsV1 = calculateMetrics(v1_vaccinations, batches, mainPeriod);
    const metricsV2 = calculateMetrics(v2_vaccinations, batches, mainPeriod);

    const v1_name = vaccines.find(v => v.id === compareVaccine1)?.name || 'Vacina 1';
    const v2_name = vaccines.find(v => v.id === compareVaccine2)?.name || 'Vacina 2';

    return {
      v1: {
        name: v1_name,
        metrics: metricsV1
      },
      v2: {
        name: v2_name,
        metrics: metricsV2
      },
      // Dados para gráfico de barras
      chartData: [
        { metric: 'Aplicações', [v1_name]: metricsV1.totalAplicacoes, [v2_name]: metricsV2.totalAplicacoes },
        { metric: 'Receita Bruta', [v1_name]: metricsV1.receitaBruta, [v2_name]: metricsV2.receitaBruta },
        { metric: 'Lucro Líquido', [v1_name]: metricsV1.lucroTotal, [v2_name]: metricsV2.lucroTotal },
        { metric: 'Ticket Médio', [v1_name]: metricsV1.ticketMedio, [v2_name]: metricsV2.ticketMedio },
      ]
    };
  }, [dashboardContext, mainPeriod, vaccinations, batches, vaccines, compareVaccine1, compareVaccine2]);


  // --- Título Dinâmico ---
  const dynamicHeader = useMemo(() => {
    switch(dashboardContext) {
      case 'comparison':
        return `Comparação: ${vaccines.find(v => v.id === compareVaccine1)?.name || 'V1'} vs. ${vaccines.find(v => v.id === compareVaccine2)?.name || 'V2'}`;
      case 'employee':
        return `Análise de Performance: ${employees.find(e => e.id === selectedEmployee)?.name || ''}`;
      case 'vaccine':
        return `Análise de Vacina: ${vaccines.find(v => v.id === selectedVaccine)?.name || ''}`;
      case 'client':
        return `Histórico do Cliente: ${clients.find(c => c.id === selectedClient)?.name || ''}`;
      case 'general':
      default:
        return 'Dashboard de Negócios';
    }
  }, [dashboardContext, selectedEmployee, selectedVaccine, selectedClient, compareVaccine1, compareVaccine2, employees, vaccines, clients]);

  // --- Funções de Renderização dos Dashboards ---

  const renderGeneralView = () => (
    <div className="space-y-6">
      {/* KPIs Financeiros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard title="Lucro Líquido" value={mainMetrics.lucroTotal} comparisonValue={comparisonType !== 'none' ? compMetrics.lucroTotal : undefined} formatType="R$" icon={<DollarSign className="h-4 w-4" />} isLoading={loading} />
        <KpiCard title="Receita Bruta" value={mainMetrics.receitaBruta} comparisonValue={comparisonType !== 'none' ? compMetrics.receitaBruta : undefined} formatType="R$" icon={<TrendingUp className="h-4 w-4" />} isLoading={loading} />
        <KpiCard title="Margem de Lucro" value={mainMetrics.margemLucroPercent} comparisonValue={comparisonType !== 'none' ? compMetrics.margemLucroPercent : undefined} formatType="%" icon={<Percent className="h-4 w-4" />} isLoading={loading} />
      </div>
      {/* KPIs Operacionais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard title="Aplicações Totais" value={mainMetrics.totalAplicacoes} comparisonValue={comparisonType !== 'none' ? compMetrics.totalAplicacoes : undefined} formatType="numero" icon={<Syringe className="h-4 w-4" />} isLoading={loading} />
        <KpiCard title="Ticket Médio" value={mainMetrics.ticketMedio} comparisonValue={comparisonType !== 'none' ? compMetrics.ticketMedio : undefined} formatType="R$" icon={<Target className="h-4 w-4" />} isLoading={loading} />
        <KpiCard title="Taxa de Desperdício" value={generalData?.inventory.taxaDesperdicioPercent || 0} formatType="%" icon={<PackageX className="h-4 w-4" />} description="Perda por vencimento vs. Custo" isLoading={loading} />
      </div>
      
      {/* Gráficos de Evolução */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Evolução (Aplicações e Receita)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" fontSize={12} />
                <YAxis yAxisId="left" orientation="left" stroke="hsl(var(--chart-1))" />
                <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--chart-2))" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="Aplicações" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="Receita" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" />Evolução do Lucro</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" fontSize={12} />
                <YAxis />
                <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                <Legend />
                <Line type="monotone" dataKey="Lucro" stroke="hsl(var(--chart-3))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bloco de Rankings e CRM (AGORA 2x2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card de Funcionários Modificado */}
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="flex items-center gap-2"><Award className="h-5 w-5" />Top 5 Funcionários (Aplicações)</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {generalData?.performance.topFuncionarios.length > 0 ? generalData.performance.topFuncionarios.map((func, index) => (
                <div key={func.id} className="p-3 bg-muted/50 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant={index === 0 ? "default" : "secondary"}>#{index + 1}</Badge>
                      <div>
                        <p className="font-medium">{func.nome}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-chart-1">{func.aplicacoes} aplicações</p>
                    </div>
                  </div>
                </div>
              )) : (<p className="text-muted-foreground text-center">Nenhum dado de funcionário.</p>)}
            </div>
          </CardContent>
        </Card>

        {/* Card Novo de Lotes */}
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="flex items-center gap-2"><PackageSearch className="h-5 w-5" />Top 5 Lotes (Aplicações)</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {generalData?.performance.topLotes.length > 0 ? generalData.performance.topLotes.map((lote, index) => (
                <div key={lote.id} className="p-3 bg-muted/50 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant={index === 0 ? "default" : "secondary"}>#{index + 1}</Badge>
                      <div>
                        <p className="font-medium">{lote.nomeVacina}</p>
                        <p className="text-xs text-muted-foreground">Lote: {lote.loteNumero}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-chart-1">{lote.aplicacoes} aplicações</p>
                    </div>
                  </div>
                </div>
              )) : (<p className="text-muted-foreground text-center">Nenhum lote aplicado.</p>)}
            </div>
          </CardContent>
        </Card>

        {/* Card de Clientes (Inalterado) */}
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Top 10 Clientes (Gasto)</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {generalData?.crm.topClientes.length > 0 ? generalData.crm.topClientes.map((client, index) => (
                <div key={client.id} className="p-3 bg-muted/50 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant={index < 3 ? "default" : "secondary"}>#{index + 1}</Badge>
                      <div>
                        <p className="font-medium">{client.nome}</p>
                        <p className="text-xs text-muted-foreground">{client.aplicacoes} aplicações</p>
                      </div>
                    </div>
                    <div className="text-right"><p className="font-bold text-chart-4">R$ {client.gasto.toFixed(2)}</p></div>
                  </div>
                </div>
              )) : (<p className="text-muted-foreground text-center">Nenhum dado de cliente.</p>)}
            </div>
          </CardContent>
        </Card>
        
        {/* Card de Aquisição (Inalterado) */}
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="flex items-center gap-2"><UsersRound className="h-5 w-5" />Aquisição de Clientes</CardTitle></CardHeader>
          <CardContent>
            {generalData?.crm.novosVsRecorrentesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={generalData.crm.novosVsRecorrentesData} dataKey="valor" nameKey="nome" cx="50%" cy="50%" outerRadius={80} label={(entry) => `${entry.valor}`}>
                    {generalData.crm.novosVsRecorrentesData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} />))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (<p className="text-muted-foreground text-center h-[300px] flex items-center justify-center">Nenhum cliente no período.</p>)}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderEmployeeView = () => (
    <div className="space-y-6">
      {/* KPIs do Funcionário */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard title="Lucro Líquido Gerado" value={mainMetrics.lucroTotal} comparisonValue={comparisonType !== 'none' ? compMetrics.lucroTotal : undefined} formatType="R$" icon={<DollarSign className="h-4 w-4" />} isLoading={loading} className="md:col-span-1" />
        <KpiCard title="Receita Gerada" value={mainMetrics.receitaBruta} comparisonValue={comparisonType !== 'none' ? compMetrics.receitaBruta : undefined} formatType="R$" icon={<TrendingUp className="h-4 w-4" />} isLoading={loading} className="md:col-span-1" />
        <KpiCard title="Aplicações Realizadas" value={mainMetrics.totalAplicacoes} comparisonValue={comparisonType !== 'none' ? compMetrics.totalAplicacoes : undefined} formatType="numero" icon={<Syringe className="h-4 w-4" />} isLoading={loading} className="md:col-span-1" />
        <KpiCard title="Ticket Médio" value={mainMetrics.ticketMedio} comparisonValue={comparisonType !== 'none' ? compMetrics.ticketMedio : undefined} formatType="R$" icon={<Target className="h-4 w-4" />} isLoading={loading} className="md:col-span-1" />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Evolução das Aplicações</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" fontSize={12} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Aplicações" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><PieChartIcon className="h-5 w-5" />Vacinas Mais Aplicadas</CardTitle></CardHeader>
          <CardContent>
            {employeeData?.vacinasDistrib.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={employeeData.vacinasDistrib} dataKey="aplicacoes" nameKey="nome" cx="50%" cy="50%" outerRadius={80} label={(entry) => `${entry.aplicacoes}`}>
                    {employeeData.vacinasDistrib.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} />))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (<p className="text-muted-foreground text-center h-[300px] flex items-center justify-center">Nenhuma aplicação no período.</p>)}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderVaccineView = () => (
    <div className="space-y-6">
      {/* KPIs da Vacina */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard title="Lucro Líquido" value={mainMetrics.lucroTotal} comparisonValue={comparisonType !== 'none' ? compMetrics.lucroTotal : undefined} formatType="R$" icon={<DollarSign className="h-4 w-4" />} isLoading={loading} />
        <KpiCard title="Receita Bruta" value={mainMetrics.receitaBruta} comparisonValue={comparisonType !== 'none' ? compMetrics.receitaBruta : undefined} formatType="R$" icon={<TrendingUp className="h-4 w-4" />} isLoading={loading} />
        <KpiCard title="Aplicações Totais" value={mainMetrics.totalAplicacoes} comparisonValue={comparisonType !== 'none' ? compMetrics.totalAplicacoes : undefined} formatType="numero" icon={<Syringe className="h-4 w-4" />} isLoading={loading} />
        <KpiCard title="Margem Média" value={mainMetrics.margemLucroPercent} comparisonValue={comparisonType !== 'none' ? compMetrics.margemLucroPercent : undefined} formatType="%" icon={<Percent className="h-4 w-4" />} isLoading={loading} />
      </div>

      {/* Gráfico de Evolução */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Evolução das Aplicações (Lucro vs Receita)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={evolutionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" fontSize={12} />
              <YAxis yAxisId="left" orientation="left" stroke="hsl(var(--chart-2))" />
              <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--chart-3))" />
              <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
              <Legend />
              <Bar yAxisId="left" dataKey="Receita" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="Lucro" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Rankings Específicos da Vacina */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Award className="h-5 w-5" />Top 5 Funcionários (Aplicações)</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {vaccineData?.topFuncionarios.length > 0 ? vaccineData.topFuncionarios.map((func, index) => (
                <div key={func.id} className="p-3 bg-muted/50 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant={index === 0 ? "default" : "secondary"}>#{index + 1}</Badge>
                      <p className="font-medium">{func.nome}</p>
                    </div>
                    <div className="text-right"><p className="font-bold text-chart-1">{func.aplicacoes} aplicações</p></div>
                  </div>
                </div>
              )) : (<p className="text-muted-foreground text-center">Nenhum funcionário aplicou esta vacina no período.</p>)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><PackageSearch className="h-5 w-5" />Top 5 Lotes (Lucro)</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {vaccineData?.topLotes.length > 0 ? vaccineData.topLotes.map((lote, index) => (
                <div key={lote.id} className="p-3 bg-muted/50 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant={index === 0 ? "default" : "secondary"}>#{index + 1}</Badge>
                      <div>
                        <p className="font-medium">Lote: {lote.codigo}</p>
                        <p className="text-xs text-muted-foreground">{lote.aplicacoes} aplicações</p>
                      </div>
                    </div>
                    <div className="text-right"><p className="font-bold text-chart-2">R$ {lote.lucro.toFixed(2)}</p></div>
                  </div>
                </div>
              )) : (<p className="text-muted-foreground text-center">Nenhum lote desta vacina gerou lucro no período.</p>)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
  
  const renderClientView = () => (
    <div className="space-y-6">
      {/* KPIs do Cliente */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard title="Gasto Total" value={mainMetrics.receitaBruta} comparisonValue={comparisonType !== 'none' ? compMetrics.receitaBruta : undefined} formatType="R$" icon={<DollarSign className="h-4 w-4" />} isLoading={loading} />
        <KpiCard title="Aplicações Totais" value={mainMetrics.totalAplicacoes} comparisonValue={comparisonType !== 'none' ? compMetrics.totalAplicacoes : undefined} formatType="numero" icon={<Syringe className="h-4 w-4" />} isLoading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Histórico de Aplicações */}
        <Card className="lg:col-span-3">
          <CardHeader><CardTitle className="flex items-center gap-2"><History className="h-5 w-5" />Histórico de Aplicações no Período</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Vacina</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead>Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mainVaccinations.length > 0 ? mainVaccinations.map(v => {
                  const batch = batches.find(b => b.id === v.batchId);
                  const vaccine = vaccines.find(vac => vac.id === batch?.vaccineId);
                  return (
                    <TableRow key={v.id}>
                      <TableCell>{format(new Date(v.applicationDate), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>{vaccine?.name || 'N/I'}</TableCell>
                      <TableCell>{batch?.batchNumber || 'N/I'}</TableCell>
                      <TableCell>R$ {v.precovenda?.toFixed(2) || '0.00'}</TableCell>
                    </TableRow>
                  )
                }) : (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Nenhuma aplicação no período.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Vacinas Recebidas */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-2"><PieChartIcon className="h-5 w-5" />Vacinas Recebidas</CardTitle></CardHeader>
          <CardContent>
             {clientData?.vacinasDistrib.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={clientData.vacinasDistrib} dataKey="aplicacoes" nameKey="nome" cx="50%" cy="50%" outerRadius={80} label={(entry) => `${entry.aplicacoes}`}>
                    {clientData.vacinasDistrib.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} />))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (<p className="text-muted-foreground text-center h-[300px] flex items-center justify-center">Nenhuma aplicação no período.</p>)}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderComparisonView = () => (
    <div className="space-y-6">
      {/* Tabela de Comparação */}
      <Card>
        <CardHeader>
          <CardTitle>Comparação de Métricas</CardTitle>
          <CardDescription>Análise lado a lado das vacinas selecionadas no período.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Métrica</TableHead>
                <TableHead>{comparisonData?.v1.name}</TableHead>
                <TableHead>{comparisonData?.v2.name}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Aplicações Totais</TableCell>
                <TableCell>{comparisonData?.v1.metrics.totalAplicacoes}</TableCell>
                <TableCell>{comparisonData?.v2.metrics.totalAplicacoes}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Receita Bruta</TableCell>
                <TableCell>{formatValue(comparisonData?.v1.metrics.receitaBruta || 0, 'R$')}</TableCell>
                <TableCell>{formatValue(comparisonData?.v2.metrics.receitaBruta || 0, 'R$')}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Lucro Líquido</TableCell>
                <TableCell>{formatValue(comparisonData?.v1.metrics.lucroTotal || 0, 'R$')}</TableCell>
                <TableCell>{formatValue(comparisonData?.v2.metrics.lucroTotal || 0, 'R$')}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Ticket Médio</TableCell>
                <TableCell>{formatValue(comparisonData?.v1.metrics.ticketMedio || 0, 'R$')}</TableCell>
                <TableCell>{formatValue(comparisonData?.v2.metrics.ticketMedio || 0, 'R$')}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Margem de Lucro</TableCell>
                <TableCell>{formatValue(comparisonData?.v1.metrics.margemLucroPercent || 0, '%')}</TableCell>
                <TableCell>{formatValue(comparisonData?.v2.metrics.margemLucroPercent || 0, '%')}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Gráfico de Comparação */}
      <Card>
        <CardHeader>
          <CardTitle>Gráfico Comparativo</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData?.chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="metric" fontSize={12} />
              <YAxis />
              <Tooltip formatter={(value: number) => typeof value === 'number' ? value.toLocaleString('pt-BR') : value} />
              <Legend />
              <Bar dataKey={comparisonData?.v1.name} fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              <Bar dataKey={comparisonData?.v2.name} fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );

  const renderDashboardContent = () => {
    switch (dashboardContext) {
      case 'comparison': return renderComparisonView();
      case 'employee': return renderEmployeeView();
      case 'vaccine': return renderVaccineView();
      case 'client': return renderClientView();
      case 'general':
      default: return renderGeneralView();
    }
  };

  // --- Renderização Principal ---
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Carregando relatórios...</div>
      </div>
    );
  }

  const yearsForFilter = [...Array(5)].map((_, i) => (new Date().getFullYear() - i).toString());

  return (
    <div className="container mx-auto py-6 space-y-6">
      
      {/* Cabeçalho e Filtros */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{dynamicHeader}</h1>
          <p className="text-muted-foreground">Análise de performance e KPIs da clínica</p>
        </div>
        
        <Button variant="outline" className="gap-2" onClick={() => setFiltersOpen(true)}>
          <Filter className="h-4 w-4" />
          Filtros e Ações
        </Button>
      </div>

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent className="w-[350px] sm:w-[450px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros e Ações
            </SheetTitle>
          </SheetHeader>
          <div className="py-6 space-y-4">
            <Accordion type="multiple" defaultValue={['periodo', 'entidades']} className="w-full">
              
              {/* Período */}
              <AccordionItem value="periodo">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Período Principal
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="yearly">Anual</SelectItem>
                      <SelectItem value="custom">Período Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {(reportType === 'yearly' || reportType === 'monthly') && (
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {yearsForFilter.map((year) => (
                          <SelectItem key={year} value={year}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  
                  {reportType === 'monthly' && (
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Ano Inteiro</SelectItem>
                        {monthNames.map((month, i) => (
                          <SelectItem key={i} value={i.toString()}>{month.charAt(0).toUpperCase() + month.slice(1)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  
                  {reportType === 'custom' && (
                    <div className="space-y-2">
                      <Label>Data de Início</Label>
                      <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                      <Label>Data de Fim</Label>
                      <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* Comparação */}
              <AccordionItem value="comparacao">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4" /> Comparação de Período
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                   <Label>Comparar com...</Label>
                   <Select value={comparisonType} onValueChange={(v) => setComparisonType(v as ComparisonPeriodType)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        <SelectItem value="previous">Período Anterior</SelectItem>
                        <SelectItem value="lastYear">Ano Anterior</SelectItem>
                      </SelectContent>
                    </Select>
                </AccordionContent>
              </AccordionItem>
              
              {/* Comparar Vacinas */}
              <AccordionItem value="vac_comparacao">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4" /> Comparar Vacinas
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <Label>Vacina 1</Label>
                  <Select value={compareVaccine1} onValueChange={(v) => {
                    setCompareVaccine1(v);
                    setSelectedEmployee('all');
                    setSelectedClient('all');
                    setSelectedVaccine('all');
                  }}>
                    <SelectTrigger><SelectValue placeholder="Selecione a Vacina 1" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Nenhuma</SelectItem>
                      {vaccines.map(v => <SelectItem key={v.id} value={v.id} disabled={v.id === compareVaccine2}>{v.name}</SelectItem>)}
                    </SelectContent>
                  </Select>

                  <Label>Vacina 2</Label>
                  <Select value={compareVaccine2} onValueChange={(v) => {
                    setCompareVaccine2(v);
                    setSelectedEmployee('all');
                    setSelectedClient('all');
                    setSelectedVaccine('all');
                  }}>
                    <SelectTrigger><SelectValue placeholder="Selecione a Vacina 2" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Nenhuma</SelectItem>
                      {vaccines.map(v => <SelectItem key={v.id} value={v.id} disabled={v.id === compareVaccine1}>{v.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </AccordionContent>
              </AccordionItem>

              {/* Entidades */}
              <AccordionItem value="entidades">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" /> Filtros de Entidade
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <Label>Filtrar por Vacina</Label>
                  <Select value={selectedVaccine} onValueChange={(v) => {
                    setSelectedVaccine(v);
                    setSelectedEmployee('all');
                    setSelectedClient('all');
                    setCompareVaccine1('all'); // Limpa comparação
                    setCompareVaccine2('all'); // Limpa comparação
                  }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Vacinas</SelectItem>
                      {vaccines.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  
                  <Label>Filtrar por Funcionário</Label>
                  <Select value={selectedEmployee} onValueChange={(v) => {
                    setSelectedEmployee(v);
                    setSelectedVaccine('all');
                    setSelectedClient('all');
                    setCompareVaccine1('all'); // Limpa comparação
                    setCompareVaccine2('all'); // Limpa comparação
                  }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Funcionários</SelectItem>
                      {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  
                  <Label>Filtrar por Cliente</Label>
                  <Select value={selectedClient} onValueChange={(v) => {
                    setSelectedClient(v);
                    setSelectedVaccine('all');
                    setSelectedEmployee('all');
                    setCompareVaccine1('all'); // Limpa comparação
                    setCompareVaccine2('all'); // Limpa comparação
                  }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Clientes</SelectItem>
                      {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </AccordionContent>
              </AccordionItem>

              {/* Ações */}
              <AccordionItem value="acoes">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Ações
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <Button className="w-full gap-2" onClick={handleExportCSV} disabled={mainVaccinations.length === 0}>
                    <Download className="h-4 w-4" />
                    Exportar para CSV
                  </Button>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Conteúdo Principal do Dashboard (Renderização Condicional) */}
      {renderDashboardContent()}
    </div>
  );
};