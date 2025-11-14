import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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
import { 
  TrendingUp, TrendingDown, Award, BarChart3, PackageX, 
  AlertTriangle, DollarSign, Target, Syringe, Package, 
  User as UserIcon, Filter, Calendar, Users, Activity 
} from 'lucide-react';

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--chart-6))',
  'hsl(var(--chart-7))',
  'hsl(var(--chart-8))',
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
  const [selectedVaccine, setSelectedVaccine] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  const [compareMode, setCompareMode] = useState(false);
  const [vaccine1, setVaccine1] = useState<string>('');
  const [vaccine2, setVaccine2] = useState<string>('');

  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [employees, setEmployees] = useState<any[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (reportType === 'custom' && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (end < start) {
        toast({
          title: "Erro de validação",
          description: "A data de fim deve ser posterior à data de início.",
          variant: "destructive",
        });
        setEndDate('');
      }
    }
  }, [startDate, endDate, reportType, toast]);

  const fetchData = async () => {
    try {
      const [clientsData, vaccinesData, aplicacoesData, batchesData, agendamentosData, funcionariosData] = await Promise.all([
        supabase.from('cliente').select('*'),
        supabase.from('vacina').select('*'),
        supabase.from('aplicacao').select('*'),
        supabase.from('lote').select('*'),
        supabase.from('agendamento').select('*'),
        supabase.from('funcionario').select('*'),
      ]);

      if (clientsData.error) throw clientsData.error;
      if (vaccinesData.error) throw vaccinesData.error;
      if (aplicacoesData.error) throw aplicacoesData.error;
      if (batchesData.error) throw batchesData.error;
      if (agendamentosData.error) throw agendamentosData.error;
      if (funcionariosData.error) throw funcionariosData.error;

      const mappedClients: Client[] = (clientsData.data || []).map(c => ({
        id: c.cpf,
        name: c.nomecompleto,
        cpf: c.cpf,
        dateOfBirth: c.datanasc || '',
        phone: c.telefone || '',
        email: c.email || '',
        address: '',
        allergies: c.alergias || '',
        status: c.status,
        observations: c.observacoes || '',
      }));

      const mappedVaccines: Vaccine[] = (vaccinesData.data || []).map(v => ({
        id: v.idvacina.toString(),
        name: v.nome,
        manufacturer: v.fabricante || '',
        description: v.descricao || '',
        category: v.categoria || 'OUTRA',
        dosesRequired: v.quantidadedoses || 1,
        intervalBetweenDoses: v.intervalodoses || 0,
        status: v.status,
      }));

      const mappedBatches: VaccineBatch[] = (batchesData.data || []).map(b => ({
        id: b.numlote.toString(),
        vaccineId: b.vacina_idvacina.toString(),
        batchCode: b.codigolote,
        quantity: b.quantidadeinicial,
        availableQuantity: b.quantidadedisponivel,
        expirationDate: b.datavalidade,
        purchasePrice: b.precocompra,
        salePrice: b.precovenda,
      }));

      const mappedVaccinations: VaccinationRecord[] = (aplicacoesData.data || []).map(a => ({
        id: a.idaplicacao.toString(),
        clientId: a.cliente_cpf,
        appliedBy: a.funcionario_idfuncionario.toString(),
        batchId: a.lote_numlote?.toString() || '',
        applicationDate: a.dataaplicacao,
        dose: a.dose || 1,
        nextDose: '',
        adverseReactions: a.reacoesadversas || '',
        observations: a.observacoes || '',
        precovenda: a.precovenda || 0,
        precocompra: a.precocompra || 0,
      }));

      const mappedAgendamentos = (agendamentosData.data || []).map(a => ({
        id: a.idagendamento,
        clientId: a.cliente_cpf,
        batchId: a.lote_numlote.toString(),
        scheduledDate: a.dataagendada,
        status: a.status,
        employeeId: a.funcionario_idfuncionario?.toString(),
        observations: a.observacoes,
      }));

      const mappedEmployees = (funcionariosData.data || []).map(f => ({
        id: f.idfuncionario.toString(),
        name: f.nomecompleto,
        cpf: f.cpf,
        email: f.email,
        cargo: f.cargo,
      }));

      setClients(mappedClients);
      setVaccines(mappedVaccines);
      setVaccinations(mappedVaccinations);
      setBatches(mappedBatches);
      setAgendamentos(mappedAgendamentos);
      setEmployees(mappedEmployees);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados dos relatórios.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const filterByPeriod = (dateString: string) => {
    const date = new Date(dateString);
    
    // Filtro por período personalizado
    if (reportType === 'custom') {
      if (startDate && endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return date >= start && date <= end;
      }
      return true;
    }
    
    // Filtro anual
    const yearMatch = date.getFullYear().toString() === selectedYear;
    if (reportType === 'yearly') {
      return yearMatch;
    }
    
    // Filtro mensal
    if (selectedMonth === 'all') return yearMatch;
    return yearMatch && date.getMonth().toString() === selectedMonth;
  };

  const generateDynamicLabels = useMemo(() => {
    // Modo ANUAL: retorna meses (Jan-Dez)
    if (reportType === 'yearly') {
      return monthNames;
    }
    
    // Modo MENSAL: retorna dias do mês selecionado
    if (reportType === 'monthly' && selectedMonth !== 'all') {
      const year = parseInt(selectedYear);
      const month = parseInt(selectedMonth);
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      return Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString());
    }
    
    // Modo PERÍODO PERSONALIZADO
    if (reportType === 'custom' && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Se período <= 31 dias: mostrar por dia
      if (diffDays <= 31) {
        const labels: string[] = [];
        const current = new Date(start);
        while (current <= end) {
          labels.push(`${current.getDate()}/${current.getMonth() + 1}`);
          current.setDate(current.getDate() + 1);
        }
        return labels;
      }
      
      // Se período <= 12 meses: mostrar por mês
      if (diffDays <= 365) {
        const labels: string[] = [];
        const current = new Date(start);
        while (current <= end) {
          labels.push(`${monthNames[current.getMonth()]}/${current.getFullYear().toString().slice(2)}`);
          current.setMonth(current.getMonth() + 1);
        }
        return labels;
      }
      
      // Se período > 12 meses: mostrar por ano
      const labels: string[] = [];
      const current = new Date(start);
      while (current <= end) {
        if (!labels.includes(current.getFullYear().toString())) {
          labels.push(current.getFullYear().toString());
        }
        current.setFullYear(current.getFullYear() + 1);
      }
      return labels;
    }
    
    // Fallback: retorna meses
    return monthNames;
  }, [reportType, selectedYear, selectedMonth, startDate, endDate]);

  const vacinacoesNoPeriodo = useMemo(() => {
    return vaccinations.filter(v => {
      if (!filterByPeriod(v.applicationDate)) return false;
      
      if (selectedVaccine !== 'all') {
        const batch = batches.find(b => b.id === v.batchId);
        return batch?.vaccineId === selectedVaccine;
      }
      
      if (selectedEmployee !== 'all') {
        return v.appliedBy === selectedEmployee;
      }

      if (selectedClient !== 'all') {
        return v.clientId === selectedClient;
      }
      
      return true;
    });
  }, [vaccinations, selectedYear, selectedMonth, reportType, selectedVaccine, batches, startDate, endDate, selectedEmployee, selectedClient]);

  const agendamentosNoPeriodo = agendamentos.filter(a => 
    a.status === 'AGENDADO' && filterByPeriod(a.scheduledDate)
  );

  const vacinasDisponiveis = batches.reduce((sum, b) => sum + b.availableQuantity, 0);
  const vacinasAgendadas = agendamentosNoPeriodo.length;
  const vacinasAplicadas = vacinacoesNoPeriodo.length;
  
  const today = new Date();
  const vacinasVencidas = batches.filter(b => {
    const expDate = new Date(b.expirationDate);
    return filterByPeriod(b.expirationDate) && expDate < today;
  }).length;

  const vaccinationsByMonth = useMemo(() => {
    return generateDynamicLabels.map((label, index) => {
      const count = vacinacoesNoPeriodo.filter(v => {
        const date = new Date(v.applicationDate);
        
        // Modo ANUAL: filtrar por mês
        if (reportType === 'yearly') {
          return date.getMonth() === index;
        }
        
        // Modo MENSAL: filtrar por dia do mês
        if (reportType === 'monthly' && selectedMonth !== 'all') {
          return date.getDate() === index + 1;
        }
        
        // Modo PERÍODO PERSONALIZADO
        if (reportType === 'custom' && startDate && endDate) {
          const diffDays = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
          
          // Por dia
          if (diffDays <= 31) {
            const targetDate = new Date(startDate);
            targetDate.setDate(targetDate.getDate() + index);
            return date.getDate() === targetDate.getDate() && 
                   date.getMonth() === targetDate.getMonth();
          }
          
          // Por mês
          if (diffDays <= 365) {
            const targetDate = new Date(startDate);
            targetDate.setMonth(targetDate.getMonth() + index);
            return date.getMonth() === targetDate.getMonth() && 
                   date.getFullYear() === targetDate.getFullYear();
          }
          
          // Por ano
          const targetYear = new Date(startDate).getFullYear() + index;
          return date.getFullYear() === targetYear;
        }
        
        return false;
      }).length;
      
      return { month: label, count };
    });
  }, [generateDynamicLabels, vacinacoesNoPeriodo, reportType, selectedMonth, startDate, endDate]);

  const profitLossByMonth = useMemo(() => {
    return generateDynamicLabels.map((label, index) => {
      const monthVaccinations = vacinacoesNoPeriodo.filter(v => {
        const date = new Date(v.applicationDate);
        
        // Modo ANUAL: filtrar por mês
        if (reportType === 'yearly') {
          return date.getMonth() === index;
        }
        
        // Modo MENSAL: filtrar por dia do mês
        if (reportType === 'monthly' && selectedMonth !== 'all') {
          return date.getDate() === index + 1;
        }
        
        // Modo PERÍODO PERSONALIZADO
        if (reportType === 'custom' && startDate && endDate) {
          const diffDays = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays <= 31) {
            const targetDate = new Date(startDate);
            targetDate.setDate(targetDate.getDate() + index);
            return date.getDate() === targetDate.getDate() && 
                   date.getMonth() === targetDate.getMonth();
          }
          
          if (diffDays <= 365) {
            const targetDate = new Date(startDate);
            targetDate.setMonth(targetDate.getMonth() + index);
            return date.getMonth() === targetDate.getMonth() && 
                   date.getFullYear() === targetDate.getFullYear();
          }
          
          const targetYear = new Date(startDate).getFullYear() + index;
          return date.getFullYear() === targetYear;
        }
        
        return false;
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
        month: label, 
        lucro: parseFloat(profit.toFixed(2)), 
        perda: parseFloat(loss.toFixed(2)) 
      };
    });
  }, [generateDynamicLabels, vacinacoesNoPeriodo, reportType, selectedMonth, startDate, endDate, batches]);

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

      cumulative += periodVaccinations.length;
      return { label, cumulative };
    });
  }, [generateDynamicLabels, vacinacoesNoPeriodo, reportType, selectedMonth, startDate, endDate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Carregando relatórios...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground">Análise detalhada e estatísticas</p>
        </div>
        
        <Button variant="outline" className="gap-2" onClick={() => setFiltersOpen(true)}>
          <Filter className="h-4 w-4" />
          Filtros
        </Button>
      </div>

      <p className="text-muted-foreground">Sistema de relatórios inteligente implementado com sucesso.</p>
    </div>
  );
};
