import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export const Auth: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Página de Autenticação
          </CardTitle>
          <CardDescription>
            Esta página foi migrada.  Use /auth/login para fazer login.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            O sistema de autenticação agora usa a API C# com JWT tokens.
            Acesse a página de login através do menu lateral ou pela rota /auth.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
