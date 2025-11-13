import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
import { TrendingUp, TrendingDown, Award, BarChart3, PackageX, AlertTriangle } from 'lucide-react';

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
      
      return true;
    });
  }, [vaccinations, selectedYear, selectedMonth, reportType, selectedVaccine, batches, startDate, endDate]);

  const agendamentosNoPeriodo = agendamentos.filter(a => 
    a.status === 'AGENDADO' && filterByPeriod(a.dataagendada)
  );

  const vacinasDisponiveis = batches.reduce((sum, b) => sum + b.remainingQuantity, 0);
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
      
      cumulative = periodVaccinations.length;
      return { month: label, acumulado: cumulative };
    });
  }, [generateDynamicLabels, vacinacoesNoPeriodo, reportType, selectedMonth, startDate, endDate]);

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
      
      // Calcular perdas/lucros por vendas
      aplicacoesDoLote.forEach(() => {
        if (lote.salePrice && lote.purchasePrice) {
          const margem = lote.salePrice - lote.purchasePrice;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg">Carregando relatórios...</p>
      </div>
    );
  }

  return (
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
                      {vaccine.name}
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
                        {vaccine.name}
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
                        {vaccine.name}
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
    </div>
  );
};
