import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, FileText, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const Relatorios: React.FC = () => {
  const { toast } = useToast();

  const handleNotImplemented = () => {
    toast({
      title: 'Funcionalidade em desenvolvimento',
      description: 'O sistema de relatórios será implementado em breve.',
      variant: 'default',
    });
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="h-8 w-8" />
          Relatórios
        </h1>
        <p className="text-muted-foreground mt-2">
          Gerencie e exporte relatórios do sistema
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Página em Desenvolvimento
            </CardTitle>
            <CardDescription>
              O sistema de relatórios está sendo migrado para a API C#.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Em breve você poderá gerar relatórios de:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Vacinações realizadas</li>
              <li>Clientes ativos</li>
              <li>Estoque de vacinas</li>
              <li>Lotes próximos ao vencimento</li>
              <li>Performance por funcionário</li>
            </ul>
            <Button onClick={handleNotImplemented} className="w-full mt-4">
              <Download className="mr-2 h-4 w-4" />
              Exportar Relatório
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dados do Dashboard</CardTitle>
            <CardDescription>
              Você pode visualizar estatísticas básicas no Dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Enquanto o sistema de relatórios não está pronto, você pode:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Ver estatísticas gerais no Dashboard</li>
              <li>Consultar lotes vencendo</li>
              <li>Ver aplicações recentes</li>
              <li>Verificar totais de clientes e vacinas</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
