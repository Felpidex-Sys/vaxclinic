import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
<<<<<<< HEAD
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
=======
>>>>>>> 20f772dce7bd7782df7dc9f7b2eb7abd919b306a
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
<<<<<<< HEAD
import { useAuth } from '@/hooks/useAuth';
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
=======
import { toBrasiliaISOString } from '@/lib/utils';
import { TrendingUp, TrendingDown, Award, BarChart3, PackageX, AlertTriangle } from 'lucide-react';
>>>>>>> 20f772dce7bd7782df7dc9f7b2eb7abd919b306a

const COLORS = [
  'hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))',
  'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--chart-6))',
  'hsl(var(--chart-7))', 'hsl(var(--chart-8))',
];

const monthNames = [...Array(12)].map((_, i) => format(new Date(2000, i), 'MMM', { locale: ptBR }));

type ComparisonPeriodType = 'none' | 'previous' | 'lastYear';
type ReportType = 'yearly' | 'monthly' | 'custom';
type DashboardContext = 'general' | 'employee' | 'vaccine' | 'client';

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
  
<<<<<<< HEAD
  const [selectedVaccine, setSelectedVaccine] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<string>('all');
  
  const [comparisonType, setComparisonType] = useState<ComparisonPeriodType>('none');

  // --- Carregamento de Dados ---
=======
  const [compareMode, setCompareMode] = useState(false);
  const [vaccine1, setVaccine1] = useState<string>('');
  const [vaccine2, setVaccine2] = useState<string>('');

>>>>>>> 20f772dce7bd7782df7dc9f7b2eb7abd919b306a
  useEffect(() => {
    if (!user) return;

    fetchData();
  }, [user]);

const fetchData = async () => {
    try {
<<<<<<< HEAD
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
=======
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

      const mappedVaccinations: VaccinationRecord[] = (aplicacoesData.data || []).map((a: any) => ({
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
        precovenda: a.precovenda || 0,
        precocompra: a.precocompra || 0,
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
>>>>>>> 20f772dce7bd7782df7dc9f7b2eb7abd919b306a
      }));

      // 3. Setar os estados
      setClients(mappedClients);
      setVaccines(mappedVaccines);
      setVaccinations(mappedVaccinations);
      setBatches(mappedBatches);
      setAgendamentos(agendamentosData.data || []);
<<<<<<< HEAD
      setEmployees(mappedEmployees);

    } catch (error: any) {
      // Este catch agora só pegará erros de lógica no *mapeamento*, não na busca
      console.error('Erro ao mapear dados:', error);
      toast({
        title: "Erro ao processar dados",
        description: `Os dados foram buscados, mas houve um erro ao processá-los: ${error.message}`,
=======
      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados dos relatórios",
>>>>>>> 20f772dce7bd7782df7dc9f7b2eb7abd919b306a
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
    return vaccinations.filter(v => {
<<<<<<< HEAD
      if (!filterByDateRange(v.applicationDate, mainPeriod)) return false;

      const vaccineMatch = selectedVaccine === 'all' || 
        batches.find(b => b.id === v.batchId)?.vaccineId === selectedVaccine;
      const employeeMatch = selectedEmployee === 'all' || v.appliedBy === selectedEmployee;
      const clientMatch = selectedClient === 'all' || v.clientId === selectedClient;
      
      return vaccineMatch && employeeMatch && clientMatch;
    });
  }, [vaccinations, mainPeriod, selectedVaccine, selectedEmployee, selectedClient, batches]);
=======
      if (!filterByPeriod(v.applicationDate)) return false;
      
      if (selectedVaccine !== 'all') {
        const batch = batches.find(b => b.id === v.batchId);
        return batch?.vaccineId === selectedVaccine;
      }
      
      return true;
    });
  }, [vaccinations, selectedYear, selectedMonth, reportType, selectedVaccine, batches, startDate, endDate]);

  const agendamentosNoPeriodo = agendamentos.filter(a => 
    a.status === 'AGENDADO' && filterByPeriod(a.dataagendada)
  );

  const vacinasDisponiveis = batches.reduce((sum, b) => sum + b.remainingQuantity, 0);
  const vacinasAgendadas = agendamentosNoPeriodo.length;
  const vacinasAplicadas = vacinacoesNoPeriodo.length;
>>>>>>> 20f772dce7bd7782df7dc9f7b2eb7abd919b306a
  
  // VACCINATIONS DE COMPARAÇÃO é filtrado por PERÍODO DE COMPARAÇÃO e ENTIDADE
  const compVaccinations = useMemo(() => {
    return vaccinations.filter(v => {
      if (!filterByDateRange(v.applicationDate, comparisonPeriod)) return false;

      const vaccineMatch = selectedVaccine === 'all' || 
        batches.find(b => b.id === v.batchId)?.vaccineId === selectedVaccine;
      const employeeMatch = selectedEmployee === 'all' || v.appliedBy === selectedEmployee;
      const clientMatch = selectedClient === 'all' || v.clientId === selectedClient;
      
      return vaccineMatch && employeeMatch && clientMatch;
    });
  }, [vaccinations, comparisonPeriod, selectedVaccine, selectedEmployee, selectedClient, batches]);


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
    if (selectedEmployee !== 'all') return 'employee';
    if (selectedVaccine !== 'all') return 'vaccine';
    if (selectedClient !== 'all') return 'client';
    return 'general';
  }, [selectedEmployee, selectedVaccine, selectedClient]);

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

<<<<<<< HEAD
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
=======
  const totalVacinas = vacinasPorTipo.reduce((sum, v) => sum + v.quantidade, 0);
  const vacinasPorTipoComPorcentagem = vacinasPorTipo.map(v => ({
    ...v,
    porcentagem: totalVacinas > 0 ? parseFloat(((v.quantidade / totalVacinas) * 100).toFixed(1)) : 0,
  }));

  const statusEstoque = [
    { 
      status: 'Disponíveis', 
      quantidade: vacinasDisponiveis,
      fill: 'hsl(var(--chart-2))',
    },
    { 
      status: 'Agendadas', 
      quantidade: vacinasAgendadas,
      fill: 'hsl(var(--chart-1))',
    },
    { 
      status: 'Aplicadas', 
      quantidade: vacinasAplicadas,
      fill: 'hsl(var(--chart-3))',
    },
    { 
      status: 'Vencidas', 
      quantidade: vacinasVencidas,
      fill: 'hsl(var(--chart-8))',
    },
  ].filter(s => s.quantidade > 0);

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

  const faixasEtarias = {
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

  const faixasEtariasData = Object.entries(faixasEtarias).map(([faixa, quantidade], index) => ({
    faixa,
    quantidade,
    fill: COLORS[index % COLORS.length],
  })).filter(f => f.quantidade > 0);

  const aplicacoesAcumuladas = useMemo(() => {
    let cumulative = 0;
    return generateDynamicLabels.map((label, index) => {
      const periodVaccinations = vacinacoesNoPeriodo.filter(v => {
        const date = new Date(v.applicationDate);
        
        if (reportType === 'yearly') {
          return date.getMonth() <= index;
        }
        
        if (reportType === 'monthly' && selectedMonth !== 'all') {
          return date.getDate() <= index + 1;
        }
        
        if (reportType === 'custom' && startDate && endDate) {
          const diffDays = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays <= 31) {
            const targetDate = new Date(startDate);
            targetDate.setDate(targetDate.getDate() + index);
            return date <= targetDate;
          }
          
          if (diffDays <= 365) {
            const targetDate = new Date(startDate);
            targetDate.setMonth(targetDate.getMonth() + index);
            return date <= targetDate;
          }
          
          const targetYear = new Date(startDate).getFullYear() + index;
          return date.getFullYear() <= targetYear;
        }
        
        return false;
      });
      
      cumulative = periodVaccinations.length;
      return { month: label, acumulado: cumulative };
>>>>>>> 20f772dce7bd7782df7dc9f7b2eb7abd919b306a
    });

<<<<<<< HEAD
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
    const funcionariosMap = new Map<string, { id: string; nome: string; lucro: number; aplicacoes: number }>();
    mainVaccinations.forEach(v => {
      const funcionario = employees.find(e => e.id === v.appliedBy); if (!funcionario) return;
      const margem = (v.precovenda || 0) - (v.precocompra || 0);
      if (!funcionariosMap.has(funcionario.id)) {
        funcionariosMap.set(funcionario.id, { id: funcionario.id, nome: funcionario.name, lucro: 0, aplicacoes: 0 });
      }
      const stats = funcionariosMap.get(funcionario.id)!;
      stats.aplicacoes++;
      if (margem > 0) stats.lucro += margem;
    });
    const topFuncionarios = Array.from(funcionariosMap.values()).sort((a, b) => b.lucro - a.lucro).slice(0, 5);

    return {
      inventory: { diasDeCobertura, taxaDesperdicioPercent, valorPerdaVencimento },
      crm: { topClientes, novosVsRecorrentesData },
      performance: { topFuncionarios }
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


  // --- Título Dinâmico ---
  const dynamicHeader = useMemo(() => {
    switch(dashboardContext) {
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
  }, [dashboardContext, selectedEmployee, selectedVaccine, selectedClient, employees, vaccines, clients]);

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

      {/* Bloco de Rankings e CRM */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="flex items-center gap-2"><Award className="h-5 w-5" />Top 5 Funcionários (Lucro)</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {generalData?.performance.topFuncionarios.length > 0 ? generalData.performance.topFuncionarios.map((func, index) => (
                <div key={func.id} className="p-3 bg-muted/50 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant={index === 0 ? "default" : "secondary"}>#{index + 1}</Badge>
                      <div>
                        <p className="font-medium">{func.nome}</p>
                        <p className="text-xs text-muted-foreground">{func.aplicacoes} aplicações</p>
                      </div>
                    </div>
                    <div className="text-right"><p className="font-bold text-chart-2">R$ {func.lucro.toFixed(2)}</p></div>
                  </div>
                </div>
              )) : (<p className="text-muted-foreground text-center">Nenhum dado de funcionário.</p>)}
            </div>
          </CardContent>
        </Card>

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

  const renderDashboardContent = () => {
    switch (dashboardContext) {
      case 'employee': return renderEmployeeView();
      case 'vaccine': return renderVaccineView();
      case 'client': return renderClientView();
      case 'general':
      default: return renderGeneralView();
    }
  };

  // --- Renderização Principal ---
  
=======
  const estatisticasAcumuladas = useMemo(() => {
    if (!aplicacoesAcumuladas.length) return null;
    
    const totalAcumulado = aplicacoesAcumuladas[aplicacoesAcumuladas.length - 1]?.acumulado || 0;
    const primeiro = aplicacoesAcumuladas[0]?.acumulado || 1;
    const ultimo = aplicacoesAcumuladas[aplicacoesAcumuladas.length - 1]?.acumulado || 0;
    const taxaCrescimento = primeiro > 0 ? (((ultimo - primeiro) / primeiro) * 100).toFixed(1) : '0.0';
    
    const mediaMensal = Math.round(totalAcumulado / aplicacoesAcumuladas.length);
    
    const pico = aplicacoesAcumuladas.reduce((max, item, index) => {
      const mensal = index === 0 ? item.acumulado : item.acumulado - aplicacoesAcumuladas[index - 1].acumulado;
      return mensal > max.valor ? { mes: item.month, valor: mensal } : max;
    }, { mes: '', valor: 0 });
    
    return {
      totalAcumulado,
      taxaCrescimento: parseFloat(taxaCrescimento),
      mediaMensal,
      pico
    };
  }, [aplicacoesAcumuladas]);

  // Estrutura para detalhamento por lote
  type DetalheLote = {
    loteId: string;
    codigoLote: string;
    nomeVacina: string;
    tipoPerda?: 'vencimento' | 'margem_negativa';
    tipoLucro?: 'vendas';
    valor: number;
    quantidadeAfetada: number;
    dataValidade?: string;
  };

  // Análise detalhada por lote
  const lotesDetalhados = useMemo(() => {
    const hoje = new Date();
    
    return batches.map(lote => {
      const vaccine = vaccines.find(v => v.id === lote.vaccineId);
      const vencido = new Date(lote.expirationDate) < hoje;
      
      // Contar aplicações desse lote no período
      const aplicacoesDoLote = vacinacoesNoPeriodo.filter(v => v.batchId === lote.id);
      
      let perdaVencimento = 0;
      let perdaMargem = 0;
      let lucro = 0;
      
      // Calcular perdas por vencimento
      if (vencido) {
        const totalPerdido = lote.remainingQuantity; // Quantidade que venceu sem ser vendida
        perdaVencimento = totalPerdido * (lote.purchasePrice || 0);
      }
      
      // Calcular perdas/lucros por vendas usando preços históricos da aplicação
      aplicacoesDoLote.forEach((aplicacao: any) => {
        // Usar preços salvos na aplicação (históricos) ou fallback para preços atuais do lote
        const precoVenda = aplicacao.precovenda || lote.salePrice || 0;
        const precoCompra = aplicacao.precocompra || lote.purchasePrice || 0;
        
        if (precoVenda && precoCompra) {
          const margem = precoVenda - precoCompra;
          if (margem < 0) {
            perdaMargem += Math.abs(margem);
          } else {
            lucro += margem;
          }
        }
      });
      
      return {
        loteId: lote.id,
        codigoLote: lote.batchNumber,
        nomeVacina: vaccine?.name || 'Desconhecida',
        vencido,
        perdaVencimento,
        perdaMargem,
        lucro,
        perdaTotal: perdaVencimento + perdaMargem,
        aplicacoes: aplicacoesDoLote.length,
        dataValidade: lote.expirationDate,
        quantidadeRestante: lote.remainingQuantity,
      };
    });
  }, [batches, vaccines, vacinacoesNoPeriodo]);

  // Top 5 Lucros por Lote
  const top5Lucro: DetalheLote[] = useMemo(() => {
    return lotesDetalhados
      .filter(l => l.lucro > 0)
      .sort((a, b) => b.lucro - a.lucro)
      .slice(0, 5)
      .map(l => ({
        loteId: l.loteId,
        codigoLote: l.codigoLote,
        nomeVacina: l.nomeVacina,
        tipoLucro: 'vendas' as const,
        valor: l.lucro,
        quantidadeAfetada: l.aplicacoes,
      }));
  }, [lotesDetalhados]);

  // Top 5 Perdas por Lote
  const top5Perda: DetalheLote[] = useMemo(() => {
    const perdas: DetalheLote[] = [];
    
    // Adicionar perdas por vencimento
    lotesDetalhados.forEach(l => {
      if (l.perdaVencimento > 0) {
        perdas.push({
          loteId: l.loteId,
          codigoLote: l.codigoLote,
          nomeVacina: l.nomeVacina,
          tipoPerda: 'vencimento',
          valor: l.perdaVencimento,
          quantidadeAfetada: l.quantidadeRestante,
          dataValidade: l.dataValidade,
        });
      }
      
      // Adicionar perdas por margem negativa
      if (l.perdaMargem > 0) {
        perdas.push({
          loteId: l.loteId,
          codigoLote: l.codigoLote,
          nomeVacina: l.nomeVacina,
          tipoPerda: 'margem_negativa',
          valor: l.perdaMargem,
          quantidadeAfetada: l.aplicacoes,
        });
      }
    });
    
    return perdas
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);
  }, [lotesDetalhados]);

  // Métricas financeiras detalhadas
  const metricasFinanceiras = useMemo(() => {
    const perdasVencimento = lotesDetalhados.reduce((sum, l) => sum + l.perdaVencimento, 0);
    const perdasMargem = lotesDetalhados.reduce((sum, l) => sum + l.perdaMargem, 0);
    const lucroTotal = lotesDetalhados.reduce((sum, l) => sum + l.lucro, 0);
    
    return {
      perdasVencimento,
      perdasMargem,
      totalPerdas: perdasVencimento + perdasMargem,
      lucroTotal,
      balanco: lucroTotal - (perdasVencimento + perdasMargem),
    };
  }, [lotesDetalhados]);

  const vacinaMaisVendida = vaccines
    .map(vaccine => {
      const count = vacinacoesNoPeriodo.filter(v => {
        const batch = batches.find(b => b.id === v.batchId);
        return batch?.vaccineId === vaccine.id;
      }).length;
      return { ...vaccine, count };
    })
    .filter(v => v.count > 0)
    .sort((a, b) => b.count - a.count)[0];

  const vacinaMenosVendida = vaccines
    .map(vaccine => {
      const count = vacinacoesNoPeriodo.filter(v => {
        const batch = batches.find(b => b.id === v.batchId);
        return batch?.vaccineId === vaccine.id;
      }).length;
      return { ...vaccine, count };
    })
    .filter(v => v.count > 0)
    .sort((a, b) => a.count - b.count)[0];

  const availableYears = Array.from(
    new Set(vaccinations.map(v => new Date(v.applicationDate).getFullYear()))
  ).sort((a, b) => b - a);

  const comparisonData = useMemo(() => {
    if (!vaccine1 || !vaccine2) return null;
    
    const calcVaccineStats = (vaccineId: string) => {
      const aplicacoes = vacinacoesNoPeriodo.filter(v => {
        const batch = batches.find(b => b.id === v.batchId);
        return batch?.vaccineId === vaccineId;
      });
      
      let lucro = 0, perda = 0;
      aplicacoes.forEach(a => {
        const batch = batches.find(b => b.id === a.batchId);
        if (batch && batch.salePrice && batch.purchasePrice) {
          const margem = batch.salePrice - batch.purchasePrice;
          if (margem > 0) lucro += margem;
          else perda += Math.abs(margem);
        }
      });
      
      return {
        aplicacoes: aplicacoes.length,
        lucro,
        perda,
        ticketMedio: aplicacoes.length > 0 ? (lucro - perda) / aplicacoes.length : 0,
      };
    };
    
    const stats1 = calcVaccineStats(vaccine1);
    const stats2 = calcVaccineStats(vaccine2);
    const vaccine1Name = vaccines.find(v => v.id === vaccine1)?.name || 'Vacina 1';
    const vaccine2Name = vaccines.find(v => v.id === vaccine2)?.name || 'Vacina 2';
    
    return {
      vaccine1: stats1,
      vaccine2: stats2,
      chartData: [
        {
          metric: 'Aplicações',
          [vaccine1Name]: stats1.aplicacoes,
          [vaccine2Name]: stats2.aplicacoes,
        },
        {
          metric: 'Lucro (R$)',
          [vaccine1Name]: parseFloat(stats1.lucro.toFixed(2)),
          [vaccine2Name]: parseFloat(stats2.lucro.toFixed(2)),
        },
        {
          metric: 'Ticket Médio (R$)',
          [vaccine1Name]: parseFloat(stats1.ticketMedio.toFixed(2)),
          [vaccine2Name]: parseFloat(stats2.ticketMedio.toFixed(2)),
        },
      ],
      vaccine1Name,
      vaccine2Name,
    };
  }, [vaccine1, vaccine2, vacinacoesNoPeriodo, batches, vaccines]);

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
      color: "hsl(var(--chart-8))",
    },
    acumulado: {
      label: "Acumulado",
      color: "hsl(var(--chart-3))",
    },
  };

>>>>>>> 20f772dce7bd7782df7dc9f7b2eb7abd919b306a
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg">Carregando relatórios...</p>
      </div>
    );
  }

  const yearsForFilter = [...Array(5)].map((_, i) => (new Date().getFullYear() - i).toString());

  return (
<<<<<<< HEAD
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
                    <History className="h-4 w-4" /> Comparação
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
              
              {/* Entidades */}
              <AccordionItem value="entidades">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" /> Entidades
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <Label>Filtrar por Vacina</Label>
                  <Select value={selectedVaccine} onValueChange={(v) => {
                    setSelectedVaccine(v);
                    setSelectedEmployee('all');
                    setSelectedClient('all');
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
=======
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">📊 Relatório de Vacinas</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Tipo de Relatório</label>
              <Select value={reportType} onValueChange={(value) => {
                setReportType(value);
                if (value !== 'custom') {
                  setStartDate('');
                  setEndDate('');
                }
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yearly">Anual</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="custom">Período Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {reportType === 'custom' ? (
              <>
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Data Início</label>
                  <Input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Data Fim</label>
                  <Input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className="w-full"
                  />
                </div>
              </>
            ) : (
              <>
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
              </>
            )}

            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Vacina</label>
              <Select value={selectedVaccine} onValueChange={setSelectedVaccine}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as vacinas</SelectItem>
                  {vaccines.map(vaccine => (
                    <SelectItem key={vaccine.id} value={vaccine.id}>
                      {vaccine.name}{vaccine.manufacturer ? ` - ${vaccine.manufacturer}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Disponíveis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-chart-2">{vacinasDisponiveis}</div>
            <p className="text-xs text-muted-foreground mt-1">vacinas em estoque</p>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Agendadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-chart-1">{vacinasAgendadas}</div>
            <p className="text-xs text-muted-foreground mt-1">aplicações agendadas</p>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Aplicadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-chart-3">{vacinasAplicadas}</div>
            <p className="text-xs text-muted-foreground mt-1">no período</p>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-chart-8">{vacinasVencidas}</div>
            <p className="text-xs text-muted-foreground mt-1">lotes vencidos</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle>📈 Vacinações por Mês</CardTitle>
            <CardDescription>Número de aplicações realizadas por mês</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={vaccinationsByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="hsl(var(--chart-1))" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--chart-1))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader>
            <CardTitle>💰 Resumo Financeiro</CardTitle>
            <CardDescription>Análise detalhada de lucros e perdas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-chart-2/10 p-4 rounded-lg border border-chart-2/20">
                  <p className="text-sm text-muted-foreground mb-1">Lucro Total</p>
                  <p className="text-2xl font-bold text-chart-2">
                    R$ {metricasFinanceiras.lucroTotal.toFixed(2)}
                  </p>
                </div>
                
                <div className="bg-chart-8/10 p-4 rounded-lg border border-chart-8/20">
                  <p className="text-sm text-muted-foreground mb-1">Total de Perdas</p>
                  <p className="text-2xl font-bold text-chart-8">
                    R$ {metricasFinanceiras.totalPerdas.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <PackageX className="w-4 h-4 text-destructive" />
                    <p className="text-xs text-muted-foreground">Perdas por Vencimento</p>
                  </div>
                  <p className="text-lg font-semibold text-destructive">
                    R$ {metricasFinanceiras.perdasVencimento.toFixed(2)}
                  </p>
                </div>
                
                <div className="bg-muted/50 p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    <p className="text-xs text-muted-foreground">Perdas por Vendas Negativas</p>
                  </div>
                  <p className="text-lg font-semibold text-orange-500">
                    R$ {metricasFinanceiras.perdasMargem.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className={`p-4 rounded-lg border-2 ${
                metricasFinanceiras.balanco >= 0 
                  ? 'bg-chart-2/5 border-chart-2' 
                  : 'bg-chart-8/5 border-chart-8'
              }`}>
                <p className="text-sm text-muted-foreground mb-1">Balanço Líquido</p>
                <p className={`text-3xl font-bold ${
                  metricasFinanceiras.balanco >= 0 ? 'text-chart-2' : 'text-chart-8'
                }`}>
                  {metricasFinanceiras.balanco >= 0 ? '+' : ''}R$ {metricasFinanceiras.balanco.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle>🧮 Distribuição de Vacinas</CardTitle>
            <CardDescription>Proporção de vacinas aplicadas por tipo</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={vacinasPorTipoComPorcentagem}
                    dataKey="quantidade"
                    nameKey="nome"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry) => `${entry.porcentagem}%`}
                  >
                    {vacinasPorTipoComPorcentagem.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader>
            <CardTitle>📊 Status do Estoque</CardTitle>
            <CardDescription>Situação atual das vacinas</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
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
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader>
            <CardTitle>👥 Faixa Etária</CardTitle>
            <CardDescription>Distribuição por idade dos vacinados</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
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
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="card-shadow">
        <CardHeader>
          <CardTitle>📈 Acumulado de Aplicações</CardTitle>
          <CardDescription>Crescimento acumulado ao longo do ano</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Gráfico - 2/3 do espaço */}
            <div className="lg:col-span-2 mt-4">
              <ChartContainer config={chartConfig} className="h-[420px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={aplicacoesAcumuladas}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="acumulado"
                      name="Total Acumulado"
                      stroke="hsl(var(--chart-3))" 
                      fill="hsl(var(--chart-3))"
                      fillOpacity={0.6}
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--chart-3))", r: 4, strokeWidth: 2, stroke: "hsl(var(--background))" }}
                      activeDot={{ r: 6, strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
            
            {/* Métricas - 1/3 do espaço */}
            {estatisticasAcumuladas && (
              <div className="space-y-4">
                {/* Total Acumulado */}
                <div className="bg-muted/50 p-4 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground mb-1">Total Acumulado</p>
                  <p className="text-3xl font-bold text-chart-3">{estatisticasAcumuladas.totalAcumulado}</p>
                  <p className="text-xs text-muted-foreground mt-1">aplicações no período</p>
                </div>
                
                {/* Taxa de Crescimento */}
                <div className="bg-muted/50 p-4 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground mb-1">Taxa de Crescimento</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold">
                      {estatisticasAcumuladas.taxaCrescimento > 0 ? '+' : ''}
                      {estatisticasAcumuladas.taxaCrescimento}%
                    </p>
                    {estatisticasAcumuladas.taxaCrescimento > 0 ? (
                      <TrendingUp className="h-5 w-5 text-green-500" />
                    ) : estatisticasAcumuladas.taxaCrescimento < 0 ? (
                      <TrendingDown className="h-5 w-5 text-red-500" />
                    ) : null}
                  </div>
                  {estatisticasAcumuladas.taxaCrescimento > 0 && (
                    <Badge variant="secondary" className="mt-2 bg-green-500/10 text-green-600 border-green-500/20">
                      Crescimento
                    </Badge>
                  )}
                  {estatisticasAcumuladas.taxaCrescimento < 0 && (
                    <Badge variant="secondary" className="mt-2 bg-red-500/10 text-red-600 border-red-500/20">
                      Declínio
                    </Badge>
                  )}
                </div>
                
                {/* Média Mensal */}
                <div className="bg-muted/50 p-4 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground mb-1">Média por Período</p>
                  <p className="text-2xl font-bold">{estatisticasAcumuladas.mediaMensal}</p>
                  <p className="text-xs text-muted-foreground mt-1">aplicações em média</p>
                </div>
                
                {/* Pico */}
                {estatisticasAcumuladas.pico.valor > 0 && (
                  <div className="bg-muted/50 p-4 rounded-lg border border-border">
                    <div className="flex items-center gap-2 mb-1">
                      <Award className="h-4 w-4 text-chart-3" />
                      <p className="text-sm text-muted-foreground">Pico de Aplicações</p>
                    </div>
                    <p className="text-xl font-bold">{estatisticasAcumuladas.pico.mes}</p>
                    <Badge variant="secondary" className="mt-2">
                      {estatisticasAcumuladas.pico.valor} aplicações
                    </Badge>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle>📈 Top 5 Lotes por Lucro</CardTitle>
            <CardDescription>Lotes com maior retorno financeiro</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {top5Lucro.map((lote, index) => (
                <div key={index} className="p-3 bg-muted/50 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <div>
                        <p className="font-medium">{lote.nomeVacina}</p>
                        <p className="text-xs text-muted-foreground">Lote #{lote.codigoLote}</p>
                      </div>
                    </div>
                    <Badge className="bg-chart-2 text-white">
                      Vendas
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      {lote.quantidadeAfetada} aplicações
                    </p>
                    <p className="font-bold text-chart-2">R$ {lote.valor.toFixed(2)}</p>
                  </div>
                </div>
              ))}
              {top5Lucro.length === 0 && (
                <p className="text-center text-muted-foreground py-4">Nenhum lucro registrado</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader>
            <CardTitle>📉 Top 5 Lotes por Perda</CardTitle>
            <CardDescription>Lotes com maior perda financeira</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {top5Perda.map((lote, index) => (
                <div key={index} className="p-3 bg-muted/50 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <div>
                        <p className="font-medium">{lote.nomeVacina}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground">Lote #{lote.codigoLote}</p>
                          {lote.tipoPerda === 'vencimento' && lote.dataValidade && (
                            <p className="text-xs text-muted-foreground">
                              (Venceu: {new Date(lote.dataValidade).toLocaleDateString('pt-BR')})
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge 
                      variant="destructive"
                      className={
                        lote.tipoPerda === 'vencimento' 
                          ? 'bg-destructive text-destructive-foreground' 
                          : 'bg-orange-500 text-white'
                      }
                    >
                      {lote.tipoPerda === 'vencimento' ? (
                        <span className="flex items-center gap-1">
                          <PackageX className="w-3 h-3" />
                          Vencido
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Prejuízo
                        </span>
                      )}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      {lote.tipoPerda === 'vencimento' 
                        ? `${lote.quantidadeAfetada} doses não vendidas`
                        : `${lote.quantidadeAfetada} aplicações com prejuízo`
                      }
                    </p>
                    <p className="font-bold text-chart-8">R$ {lote.valor.toFixed(2)}</p>
                  </div>
                </div>
              ))}
              {top5Perda.length === 0 && (
                <p className="text-center text-muted-foreground py-4">Nenhuma perda registrada</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {vacinaMaisVendida && (
          <Card className="card-shadow border-2 border-chart-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-6 h-6 text-chart-2" />
                  Vacina Mais Aplicada
                </CardTitle>
                <Badge className="bg-chart-2 text-white">🏆 Top 1</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <div>
                  <p className="text-2xl font-bold">{vacinaMaisVendida.name}</p>
                  <p className="text-sm text-muted-foreground">{vacinaMaisVendida.manufacturer}</p>
                </div>
                <div className="flex items-center justify-center gap-8">
                  <div>
                    <p className="text-4xl font-bold text-chart-2">{vacinaMaisVendida.count}</p>
                    <p className="text-sm text-muted-foreground">aplicações</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-chart-2">
                      {totalVacinas > 0 ? ((vacinaMaisVendida.count / totalVacinas) * 100).toFixed(1) : 0}%
                    </p>
                    <p className="text-sm text-muted-foreground">do total</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {vacinaMenosVendida && (
          <Card className="card-shadow border-2 border-chart-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-chart-4" />
                  Vacina Menos Aplicada
                </CardTitle>
                <Badge variant="outline">📊 Atenção</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <div>
                  <p className="text-2xl font-bold">{vacinaMenosVendida.name}</p>
                  <p className="text-sm text-muted-foreground">{vacinaMenosVendida.manufacturer}</p>
                </div>
                <div className="flex items-center justify-center gap-8">
                  <div>
                    <p className="text-4xl font-bold text-chart-4">{vacinaMenosVendida.count}</p>
                    <p className="text-sm text-muted-foreground">aplicações</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-chart-4">
                      {totalVacinas > 0 ? ((vacinaMenosVendida.count / totalVacinas) * 100).toFixed(1) : 0}%
                    </p>
                    <p className="text-sm text-muted-foreground">do total</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="card-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                🔄 Comparador de Vacinas
              </CardTitle>
              <CardDescription>Compare o desempenho entre duas vacinas</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="compare-mode"
                checked={compareMode}
                onCheckedChange={setCompareMode}
              />
              <Label htmlFor="compare-mode">Ativar</Label>
            </div>
          </div>
        </CardHeader>
        {compareMode && (
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="text-sm font-medium mb-2 block">Vacina 1</label>
                <Select value={vaccine1} onValueChange={setVaccine1}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {vaccines.map(vaccine => (
                      <SelectItem key={vaccine.id} value={vaccine.id}>
                        {vaccine.name}{vaccine.manufacturer ? ` - ${vaccine.manufacturer}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="text-center">
                <p className="text-2xl font-bold text-muted-foreground">VS</p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Vacina 2</label>
                <Select value={vaccine2} onValueChange={setVaccine2}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {vaccines.map(vaccine => (
                      <SelectItem key={vaccine.id} value={vaccine.id}>
                        {vaccine.name}{vaccine.manufacturer ? ` - ${vaccine.manufacturer}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {comparisonData && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-muted/30">
                    <CardHeader>
                      <CardTitle className="text-lg">📊 {comparisonData.vaccine1Name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Aplicações:</span>
                        <span className="font-bold">{comparisonData.vaccine1.aplicacoes}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Lucro:</span>
                        <span className="font-bold text-chart-2">
                          R$ {comparisonData.vaccine1.lucro.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Perda:</span>
                        <span className="font-bold text-chart-8">
                          R$ {comparisonData.vaccine1.perda.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Ticket Médio:</span>
                        <span className="font-bold">
                          R$ {comparisonData.vaccine1.ticketMedio.toFixed(2)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-muted/30">
                    <CardHeader>
                      <CardTitle className="text-lg">📊 {comparisonData.vaccine2Name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Aplicações:</span>
                        <span className="font-bold">{comparisonData.vaccine2.aplicacoes}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Lucro:</span>
                        <span className="font-bold text-chart-2">
                          R$ {comparisonData.vaccine2.lucro.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Perda:</span>
                        <span className="font-bold text-chart-8">
                          R$ {comparisonData.vaccine2.perda.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Ticket Médio:</span>
                        <span className="font-bold">
                          R$ {comparisonData.vaccine2.ticketMedio.toFixed(2)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Comparação Visual</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={comparisonData.chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="metric" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey={comparisonData.vaccine1Name} fill="hsl(var(--chart-1))" />
                          <Bar dataKey={comparisonData.vaccine2Name} fill="hsl(var(--chart-4))" />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </>
            )}
          </CardContent>
        )}
      </Card>
>>>>>>> 20f772dce7bd7782df7dc9f7b2eb7abd919b306a
    </div>
  );
};