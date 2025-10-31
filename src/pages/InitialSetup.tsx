import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { z } from 'zod';
import { Stethoscope } from 'lucide-react';

const setupSchema = z.object({
  nomeClinica: z.string().min(3, 'Nome da clínica deve ter no mínimo 3 caracteres').max(255),
  email: z.string().email('Email inválido').max(255),
  senha: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  confirmarSenha: z.string()
}).refine((data) => data.senha === data.confirmarSenha, {
  message: 'As senhas não coincidem',
  path: ['confirmarSenha']
});

export const InitialSetup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nomeClinica: '',
    email: '',
    senha: '',
    confirmarSenha: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Check if setup is already complete
    const checkSetup = async () => {
      const { data } = await supabase
        .from('configuracao_sistema')
        .select('setup_completo')
        .single();
      
      if (data?.setup_completo) {
        navigate('/login');
      }
    };
    
    checkSetup();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      // Validate form
      setupSchema.parse(formData);

      // Check if setup was already completed
      const { data: configCheck } = await supabase
        .from('configuracao_sistema')
        .select('setup_completo')
        .single();

      if (configCheck?.setup_completo) {
        // Setup already done, try to login instead
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.senha,
        });

        if (signInError) {
          toast.error('Setup já foi concluído. Redirecionando para login...');
          navigate('/login');
          return;
        }

        toast.success('Login realizado com sucesso!');
        // Wait for auth state to update before navigating
        await new Promise(resolve => setTimeout(resolve, 500));
        navigate('/');
        return;
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.senha,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Erro ao criar usuário');

      // Insert into administradores table
      const { error: adminError } = await supabase
        .from('administradores')
        .insert({
          id: authData.user.id,
          nome_clinica: formData.nomeClinica,
          email: formData.email
        });

      if (adminError) throw adminError;

      // Insert admin role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: 'admin'
        });

      if (roleError) throw roleError;

      // Mark setup as complete
      const { error: configError } = await supabase
        .from('configuracao_sistema')
        .update({ 
          setup_completo: true,
          nome_clinica: formData.nomeClinica 
        })
        .eq('setup_completo', false);

      if (configError) throw configError;

      // Auto-login após criar conta
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.senha,
      });

      if (signInError) throw signInError;

      toast.success('Conta de administrador criada com sucesso!');
      
      // Wait for auth state to update before navigating
      await new Promise(resolve => setTimeout(resolve, 500));
      navigate('/');
    } catch (error: any) {
      console.error('Setup error:', error);
      
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else if (error.code === 'user_already_exists') {
        toast.error('Este email já está registrado. Por favor, faça login.');
        navigate('/login');
      } else {
        toast.error(error.message || 'Erro ao criar conta. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-medical-blue/10 to-medical-teal/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-medical-blue rounded-full flex items-center justify-center">
              <Stethoscope className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Configuração Inicial</CardTitle>
          <CardDescription>
            Configure sua clínica e crie sua conta de administrador
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nomeClinica">Nome da Clínica</Label>
              <Input
                id="nomeClinica"
                type="text"
                placeholder="VixClinic"
                value={formData.nomeClinica}
                onChange={(e) => setFormData({ ...formData, nomeClinica: e.target.value })}
                required
              />
              {errors.nomeClinica && (
                <p className="text-sm text-destructive">{errors.nomeClinica}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email do Administrador</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@vixclinic.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                placeholder="••••••••"
                value={formData.senha}
                onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                required
              />
              {errors.senha && (
                <p className="text-sm text-destructive">{errors.senha}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmarSenha">Confirmar Senha</Label>
              <Input
                id="confirmarSenha"
                type="password"
                placeholder="••••••••"
                value={formData.confirmarSenha}
                onChange={(e) => setFormData({ ...formData, confirmarSenha: e.target.value })}
                required
              />
              {errors.confirmarSenha && (
                <p className="text-sm text-destructive">{errors.confirmarSenha}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Configurando...' : 'Criar Conta de Administrador'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
