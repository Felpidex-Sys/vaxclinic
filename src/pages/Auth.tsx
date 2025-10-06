import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Activity } from 'lucide-react';

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // Signup
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          }
        });

        if (error) throw error;

        // Criar registro na tabela funcionario
        if (data.user) {
          const { error: profileError } = await supabase
            .from('funcionario')
            .insert({
              email: formData.email,
              nomecompleto: 'Administrador',
              cpf: '00000000000', // CPF temporário - deve ser atualizado
              cargo: 'ADMIN',
              senha: formData.password, // Nota: em produção, não salve senha em texto plano
              status: 'ATIVO',
            });

          if (profileError) {
            console.error('Erro ao criar perfil:', profileError);
          }
        }

        toast({
          title: "Cadastro realizado com sucesso!",
          description: "Você já pode fazer login.",
        });
        
        setIsSignUp(false);
      } else {
        // Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo ao VixClinic",
        });

        navigate('/');
      }
    } catch (error: any) {
      toast({
        title: isSignUp ? "Erro ao cadastrar" : "Erro ao fazer login",
        description: error.message || "Verifique suas credenciais e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Activity className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">VixClinic</CardTitle>
          <CardDescription>
            {isSignUp ? 'Criar nova conta' : 'Sistema de Gestão de Clínicas de Vacinação'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={loading}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full medical-gradient text-white" 
              disabled={loading}
            >
              {loading ? (isSignUp ? "Cadastrando..." : "Entrando...") : (isSignUp ? "Cadastrar" : "Entrar")}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-primary hover:underline"
              disabled={loading}
            >
              {isSignUp ? 'Já tem uma conta? Entrar' : 'Criar nova conta'}
            </button>
          </div>
          
          {!isSignUp && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground text-center mb-2">
                <strong>Primeira vez?</strong>
              </p>
              <p className="text-sm text-center">
                Clique em "Criar nova conta" para cadastrar o administrador.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
