import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertTriangle,
  FileText,
  BarChart3,
  PackageX
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Cliente {
  cpf: string;
  nomecompleto: string;
  datanasc: string;
}

interface Funcionario {
  idfuncionario: number;
  nomecompleto: string;
}

interface Vacina {
  idvacina: number;
  nome: string;
}

interface Lote {
  numlote: number;
  codigolote: string;
  quantidadeinicial: number;
  quantidadedisponivel: number;
  datavalidade: string;
  vacina_idvacina: number;
  precocompra: number;
  precovenda: number;
}

interface Aplicacao {
  idaplicacao: number;
  dataaplicacao: string;
  dose: number;
  funcionario_idfuncionario: number;
  cliente_cpf: string;
  agendamento_idagendamento: number | null;
}

interface Agendamento {
  idagendamento: number;
  dataagendada: string;
  status: string;
  lote_numlote: number;
}

export const Relatorios: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [vacinas, setVacinas] = useState<Vacina[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [aplicacoes, setAplicacoes] = useState<Aplicacao[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [clientesRes, funcionariosRes, vacinasRes, lotesRes, aplicacoesRes, agendamentosRes] = 
        await Promise.all([
          supabase.from('cliente').select('*'),
          supabase.from('funcionario').select('*'),
          supabase.from('vacina').select('*'),
          supabase.from('lote').select('*'),
          supabase.from('aplicacao').select('*'),
          supabase.from('agendamento').select('*'),
        ]);

      if (clientesRes.error) throw clientesRes.error;
      if (funcionariosRes.error) throw funcionariosRes.error;
      if (vacinasRes.error) throw vacinasRes.error;
      if (lotesRes.error) throw lotesRes.error;
      if (aplicacoesRes.error) throw aplicacoesRes.error;
      if (agendamentosRes.error) throw agendamentosRes.error;

      setClientes(clientesRes.data || []);
      setFuncionarios(funcionariosRes.data || []);
      setVacinas(vacinasRes.data || []);
      setLotes(lotesRes.data || []);
      setAplicacoes(aplicacoesRes.data || []);
      setAgendamentos(agendamentosRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível carregar os dados dos relatórios.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar aplicações por período
  const getApplicationsByPeriod = () => {
    const days = parseInt(selectedPeriod);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return aplicacoes.filter(app => {
      const appDate = new Date(app.dataaplicacao);
      return appDate >= cutoffDate;
    });
  };

  // Calcular estatísticas gerais
  const totalClientes = clientes.length;
  const totalFuncionarios = funcionarios.length;
  const totalVacinas = vacinas.length;
  const aplicacoesPeriodo = getApplicationsByPeriod();
  const totalAplicacoes = aplicacoesPeriodo.length;

  // Calcular lotes vencendo (próximos 30 dias)
  const lotesVencendo = lotes.filter(lote => {
    const dataValidade = new Date(lote.datavalidade);
    const hoje = new Date();
    const diffTime = dataValidade.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 30 && lote.quantidadedisponivel > 0;
  });

  // Calcular lotes vencidos
  const lotesVencidos = lotes.filter(lote => {
    const dataValidade = new Date(lote.datavalidade);
    const hoje = new Date();
    return dataValidade < hoje && lote.quantidadedisponivel > 0;
  });

  // RELATÓRIO FINANCEIRO
  
  // 1. Gastos Totais (soma de todos os lotes comprados)
  const gastosTotais = lotes.reduce((sum, lote) => {
    return sum + (lote.quantidadeinicial * lote.precocompra);
  }, 0);

  // 2. Perdas por Vencimento (lotes vencidos com doses ainda disponíveis)
  const perdasVencimento = lotesVencidos.reduce((sum, lote) => {
    return sum + (lote.quantidadedisponivel * lote.precocompra);
  }, 0);

  // 3. Receita Total (aplicações realizadas)
  const receitaTotal = aplicacoesPeriodo.reduce((sum, app) => {
    // Buscar o lote usado (via agendamento se existir)
    const agendamento = agendamentos.find(ag => ag.idagendamento === app.agendamento_idagendamento);
    if (agendamento) {
      const lote = lotes.find(l => l.numlote === agendamento.lote_numlote);
      if (lote) {
        return sum + lote.precovenda;
      }
    }
    return sum;
  }, 0);

  // 4. Lucro (Receita - Custo das aplicações)
  const custoAplicacoes = aplicacoesPeriodo.reduce((sum, app) => {
    const agendamento = agendamentos.find(ag => ag.idagendamento === app.agendamento_idagendamento);
    if (agendamento) {
      const lote = lotes.find(l => l.numlote === agendamento.lote_numlote);
      if (lote) {
        return sum + lote.precocompra;
      }
    }
    return sum;
  }, 0);
  const lucro = receitaTotal - custoAplicacoes;

  // 5. Estoque Total Valorizado
  const valorEstoque = lotes.reduce((sum, lote) => {
    return sum + (lote.quantidadedisponivel * lote.precocompra);
  }, 0);

  // Vacinações por tipo
  const vaccinationsByType = vacinas.map(vacina => {
    const count = aplicacoesPeriodo.filter(app => {
      const agendamento = agendamentos.find(ag => ag.idagendamento === app.agendamento_idagendamento);
      if (agendamento) {
        const lote = lotes.find(l => l.numlote === agendamento.lote_numlote);
        return lote?.vacina_idvacina === vacina.idvacina;
      }
      return false;
    }).length;

    return {
      name: vacina.nome,
      count,
      percentage: totalAplicacoes > 0 ? (count / totalAplicacoes) * 100 : 0,
    };
  }).sort((a, b) => b.count - a.count);

  // Vacinações por funcionário
  const vaccinationsByEmployee = funcionarios.map(func => {
    const count = aplicacoesPeriodo.filter(
      app => app.funcionario_idfuncionario === func.idfuncionario
    ).length;

    return {
      name: func.nomecompleto,
      count,
      percentage: totalAplicacoes > 0 ? (count / totalAplicacoes) * 100 : 0,
    };
  }).sort((a, b) => b.count - a.count);

  // Clientes por faixa etária
  const clientsByAge = [
    { range: '0-12 anos', min: 0, max: 12, count: 0 },
    { range: '13-18 anos', min: 13, max: 18, count: 0 },
    { range: '19-35 anos', min: 19, max: 35, count: 0 },
    { range: '36-59 anos', min: 36, max: 59, count: 0 },
    { range: '60+ anos', min: 60, max: 150, count: 0 },
  ];

  clientes.forEach(cliente => {
    if (cliente.datanasc) {
      const birthDate = new Date(cliente.datanasc);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      const ageGroup = clientsByAge.find(group => age >= group.min && age <= group.max);
      if (ageGroup) {
        ageGroup.count++;
      }
    }
  });

  // Status do estoque
  const stockByVaccine = vacinas.map(vacina => {
    const vacinaLotes = lotes.filter(l => l.vacina_idvacina === vacina.idvacina);
    const totalStock = vacinaLotes.reduce((sum, l) => sum + l.quantidadedisponivel, 0);
    const vencendoProx = vacinaLotes.filter(l => {
      const dataValidade = new Date(l.datavalidade);
      const hoje = new Date();
      const diffTime = dataValidade.getTime() - hoje.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 && diffDays <= 30;
    }).length;

    return {
      name: vacina.nome,
      stock: totalStock,
      expiringSoon: vencendoProx,
      status: totalStock === 0 ? 'out' : totalStock < 10 ? 'low' : 'good',
    };
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-blue mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Relatórios e Análises</h1>
        <p className="text-muted-foreground">
          Análise detalhada de desempenho, finanças e estoque
        </p>
      </div>

      {/* Filtro de Período */}
      <Card>
        <CardHeader>
          <CardTitle>Período de Análise</CardTitle>
          <CardDescription>Selecione o período para os relatórios</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Estatísticas Gerais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Aplicações</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAplicacoes}</div>
            <p className="text-xs text-muted-foreground">Nos últimos {selectedPeriod} dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Cadastrados</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClientes}</div>
            <p className="text-xs text-muted-foreground">Total no sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Funcionários Ativos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFuncionarios}</div>
            <p className="text-xs text-muted-foreground">Total no sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tipos de Vacinas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVacinas}</div>
            <p className="text-xs text-muted-foreground">Vacinas cadastradas</p>
          </CardContent>
        </Card>
      </div>

      {/* Relatório Financeiro */}
      <Card>
        <CardHeader>
          <CardTitle>Relatório Financeiro</CardTitle>
          <CardDescription>Análise de gastos, perdas, receitas e lucro</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Gastos Totais (Compras)</span>
                <TrendingDown className="h-4 w-4 text-destructive" />
              </div>
              <div className="text-2xl font-bold text-destructive">
                R$ {gastosTotais.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Total investido em todos os lotes
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Receita Total (Vendas)</span>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-600">
                R$ {receitaTotal.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Nos últimos {selectedPeriod} dias
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Perdas por Vencimento</span>
                <PackageX className="h-4 w-4 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-orange-600">
                R$ {perdasVencimento.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {lotesVencidos.length} lote(s) vencido(s)
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Lucro Líquido</span>
                <DollarSign className={`h-4 w-4 ${lucro >= 0 ? 'text-green-600' : 'text-destructive'}`} />
              </div>
              <div className={`text-2xl font-bold ${lucro >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                R$ {lucro.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Receita - Custo das aplicações
              </p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Valor do Estoque Atual</span>
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-600">
                R$ {valorEstoque.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Valor total das doses em estoque
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alertas de Estoque */}
      {(lotesVencendo.length > 0 || lotesVencidos.length > 0) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Alertas de Estoque
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {lotesVencidos.length > 0 && (
              <div className="p-3 bg-red-100 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-800">
                  {lotesVencidos.length} lote(s) vencido(s) com {lotesVencidos.reduce((sum, l) => sum + l.quantidadedisponivel, 0)} dose(s) restantes
                </p>
              </div>
            )}
            {lotesVencendo.length > 0 && (
              <div className="p-3 bg-orange-100 border border-orange-200 rounded-lg">
                <p className="text-sm font-medium text-orange-800">
                  {lotesVencendo.length} lote(s) vencendo nos próximos 30 dias
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Vacinações por Tipo */}
      <Card>
        <CardHeader>
          <CardTitle>Vacinações por Tipo</CardTitle>
          <CardDescription>Distribuição de aplicações por vacina</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {vaccinationsByType.map((item) => (
              <div key={item.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {item.count} ({item.percentage.toFixed(1)}%)
                  </span>
                </div>
                <Progress value={item.percentage} className="h-2" />
              </div>
            ))}
            {vaccinationsByType.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma aplicação no período selecionado
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Vacinações por Funcionário */}
      <Card>
        <CardHeader>
          <CardTitle>Vacinações por Funcionário</CardTitle>
          <CardDescription>Produtividade da equipe</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {vaccinationsByEmployee.map((item) => (
              <div key={item.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {item.count} ({item.percentage.toFixed(1)}%)
                  </span>
                </div>
                <Progress value={item.percentage} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Clientes por Faixa Etária */}
      <Card>
        <CardHeader>
          <CardTitle>Clientes por Faixa Etária</CardTitle>
          <CardDescription>Distribuição demográfica</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {clientsByAge.map((item) => {
              const percentage = totalClientes > 0 ? (item.count / totalClientes) * 100 : 0;
              return (
                <div key={item.range} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.range}</span>
                    <span className="text-sm text-muted-foreground">
                      {item.count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Status do Estoque */}
      <Card>
        <CardHeader>
          <CardTitle>Status do Estoque</CardTitle>
          <CardDescription>Disponibilidade por vacina</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stockByVaccine.map((item) => (
              <div key={item.name} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">{item.stock} doses disponíveis</p>
                </div>
                <div className="flex items-center gap-2">
                  {item.expiringSoon > 0 && (
                    <Badge variant="outline" className="bg-orange-50">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {item.expiringSoon} vencendo
                    </Badge>
                  )}
                  <Badge
                    variant={
                      item.status === 'out'
                        ? 'destructive'
                        : item.status === 'low'
                        ? 'outline'
                        : 'default'
                    }
                  >
                    {item.status === 'out' ? 'Esgotado' : item.status === 'low' ? 'Estoque Baixo' : 'Disponível'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
