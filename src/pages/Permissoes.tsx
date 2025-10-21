import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const Permissoes: React.FC = () => {
  const { toast } = useToast();

  const handleNotImplemented = () => {
    toast({
      title: 'Funcionalidade em desenvolvimento',
      description: 'O gerenciamento de permissões será implementado em breve.',
      variant: 'default',
    });
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="h-8 w-8" />
          Gerenciamento de Permissões
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure permissões e níveis de acesso dos funcionários
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Página em Desenvolvimento
          </CardTitle>
          <CardDescription>
            O gerenciamento avançado de permissões está sendo migrado para a API C#.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Por enquanto, você pode gerenciar funcionários básicos na página de Funcionários.
          </p>
          <p className="text-sm text-muted-foreground">
            As permissões granulares serão implementadas em uma próxima versão.
          </p>
          <Button onClick={handleNotImplemented} className="mt-4">
            Notificar quando estiver pronto
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
