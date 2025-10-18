import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Syringe, Package, Calendar, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { vacinaService, loteService, agendamentoService, aplicacaoService } from '@/lib/csharp-api';

export const Vacinas: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalVacinas: 0,
    totalLotes: 0,
    agendamentosAtivos: 0,
    aplicacoesTotal: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [vacinas, lotes, agendamentos, aplicacoes] = await Promise.all([
        vacinaService.getAll(),
        loteService.getAll(),
        agendamentoService.getAll(),
        aplicacaoService.getAll(),
      ]);

      setStats({
        totalVacinas: vacinas?.length || 0,
        totalLotes: lotes?.length || 0,
        agendamentosAtivos: agendamentos?.filter((a: any) => a.status === 'AGENDADO').length || 0,
        aplicacoesTotal: aplicacoes?.length || 0,
      });
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

  const handleNotImplemented = () => {
    toast({
      title: 'Funcionalidade em desenvolvimento',
      description: 'O gerenciamento completo de vacinas será implementado em breve.',
      variant: 'default',
    });
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Syringe className="h-8 w-8" />
          Gerenciamento de Vacinas
        </h1>
        <p className="text-muted-foreground mt-2">
          Gerencie vacinas, lotes, agendamentos e aplicações
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vacinas</CardTitle>
            <Syringe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVacinas}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Lotes</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLotes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendamentos Ativos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.agendamentosAtivos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aplicações Total</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.aplicacoesTotal}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Página em Desenvolvimento
          </CardTitle>
          <CardDescription>
            O gerenciamento completo de vacinas está sendo migrado para a API C#.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Funcionalidades Planejadas:</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Syringe className="h-4 w-4" />
                  Gestão de Vacinas
                </h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                  <li>Cadastrar novas vacinas</li>
                  <li>Editar informações de vacinas</li>
                  <li>Inativar vacinas</li>
                  <li>Visualizar histórico</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Gestão de Lotes
                </h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                  <li>Cadastrar novos lotes</li>
                  <li>Controle de validade</li>
                  <li>Gestão de estoque</li>
                  <li>Alertas de vencimento</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Agendamentos
                </h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                  <li>Criar novos agendamentos</li>
                  <li>Visualizar agenda</li>
                  <li>Cancelar agendamentos</li>
                  <li>Filtrar por status</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Aplicações
                </h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                  <li>Registrar aplicações</li>
                  <li>Visualizar histórico por cliente</li>
                  <li>Reportar reações adversas</li>
                  <li>Gerar comprovantes</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-4">
              Por enquanto, você pode usar o <strong>Dashboard</strong> para visualizar estatísticas básicas e a página de <strong>Agendamentos</strong> para funcionalidades limitadas.
            </p>
            <Button onClick={handleNotImplemented} className="w-full md:w-auto">
              Notificar quando estiver pronto
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
