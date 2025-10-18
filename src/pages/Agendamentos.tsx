import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Calendar, CheckCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { agendamentoService } from '@/lib/csharp-api';

export const Agendamentos: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    agendados: 0,
    realizados: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const agendamentos = await agendamentoService.getAll();
      
      setStats({
        total: agendamentos?.length || 0,
        agendados: agendamentos?.filter((a: any) => a.status === 'AGENDADO').length || 0,
        realizados: agendamentos?.filter((a: any) => a.status === 'REALIZADO').length || 0,
      });
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os agendamentos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNotImplemented = () => {
    toast({
      title: 'Funcionalidade em desenvolvimento',
      description: 'O gerenciamento completo de agendamentos será implementado em breve.',
      variant: 'default',
    });
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Calendar className="h-8 w-8" />
          Gerenciamento de Agendamentos
        </h1>
        <p className="text-muted-foreground mt-2">
          Gerencie agendamentos de vacinação
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendados</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.agendados}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Realizados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.realizados}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Página em Desenvolvimento
          </CardTitle>
          <CardDescription>
            O gerenciamento completo de agendamentos está sendo migrado para a API C#.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Em breve você poderá:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li>Criar novos agendamentos</li>
            <li>Visualizar agendamentos por data</li>
            <li>Editar agendamentos existentes</li>
            <li>Cancelar agendamentos</li>
            <li>Marcar agendamentos como realizados</li>
            <li>Filtrar por status e cliente</li>
          </ul>
          <div className="pt-4 border-t">
            <Button onClick={handleNotImplemented} className="w-full md:w-auto">
              Notificar quando estiver pronto
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
