import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { MaskedInput } from '@/components/ui/masked-input';
import { formatCPF } from '@/lib/validations';

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'signup') {
      if (password !== confirmPassword) {
        toast({
          title: 'Erro',
          description: 'As senhas não coincidem.',
          variant: 'destructive',
        });
        return;
      }

      if (password.length < 8) {
        toast({
          title: 'Erro',
          description: 'A senha deve ter no mínimo 8 caracteres.',
          variant: 'destructive',
        });
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        // Criar usuário no Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: name,
            }
          }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('Erro ao criar usuário');

        const cleanedCpf = formatCPF(cpf);

        // Verificar se é o primeiro usuário (será admin)
        const { count } = await supabase
          .from('funcionario')
          .select('*', { count: 'exact', head: true });

        const isFirstUser = count === 0;
        const role = isFirstUser ? 'admin' : 'funcionario';

        // Criar registro na tabela funcionario
        const { error: funcError } = await supabase
          .from('funcionario')
          .insert({
            user_id: authData.user.id,
            cpf: cleanedCpf,
            nomecompleto: name,
            email,
            cargo: isFirstUser ? 'ADMIN' : 'FUNCIONARIO',
            senha: password,
            status: 'ATIVO',
          });

        if (funcError) {
          if (funcError.code === '23505') {
            throw new Error('Já existe um usuário cadastrado com este CPF ou email.');
          }
          throw funcError;
        }

        // Criar registro na tabela user_roles
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role: role as 'admin' | 'funcionario' | 'vacinador',
          });

        if (roleError) {
          console.error('Erro ao criar role:', roleError);
        }

        toast({
          title: 'Conta criada!',
          description: isFirstUser 
            ? 'Primeira conta criada com permissões de administrador. Você pode fazer login agora.'
            : 'Sua conta foi criada com sucesso. Você pode fazer login agora.',
        });

        // Limpa o formulário
        setEmail('');
        setPassword('');
        setName('');
        setCpf('');
        setConfirmPassword('');
        setMode('signin');

      } else {
        // Login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: 'Login realizado!',
          description: 'Bem-vindo de volta.',
        });

        navigate('/');
      }
    } catch (error: any) {
      console.error('Erro:', error);
      toast({
        title: mode === 'signup' ? 'Erro ao criar conta' : 'Erro ao fazer login',
        description: error.message || (mode === 'signup' ? 'Não foi possível criar a conta.' : 'Email ou senha incorretos.'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-medical-blue/10 via-white to-medical-green/10 p-4">
      <Card className="w-full max-w-md card-shadow">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center text-medical-blue">
            VixClinic
          </CardTitle>
          <CardDescription className="text-center">
            Sistema de Gestão de Clínica de Vacinação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={mode} onValueChange={(v) => setMode(v as 'signin' | 'signup')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Cadastrar</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full medical-gradient text-white"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    'Entrar'
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nome Completo</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Seu nome completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-cpf">CPF</Label>
                  <MaskedInput
                    mask="999.999.999-99"
                    id="signup-cpf"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    minLength={8}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar Senha</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Digite a senha novamente"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full medical-gradient text-white"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando conta...
                    </>
                  ) : (
                    'Criar Conta'
                  )}
                </Button>
              </form>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> O primeiro usuário cadastrado será automaticamente um administrador.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
