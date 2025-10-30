import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MaskedInput } from '@/components/ui/masked-input';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Shield, Syringe, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { hashPassword } from '@/lib/crypto';
import { validateCPF } from '@/lib/validations';

export const Cadastro: React.FC = () => {
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (!nomeCompleto || !cpf || !email || !senha || !confirmarSenha) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (!validateCPF(cpf)) {
      toast({
        title: "Erro",
        description: "CPF inválido.",
        variant: "destructive",
      });
      return;
    }

    if (senha.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter no mínimo 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    if (senha !== confirmarSenha) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Verificar se email já existe
      const { data: emailExiste } = await supabase
        .from('funcionario')
        .select('email')
        .eq('email', email)
        .maybeSingle();

      if (emailExiste) {
        toast({
          title: "Erro",
          description: "Este email já está cadastrado.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Verificar se CPF já existe
      const cpfNumeros = cpf.replace(/\D/g, '');
      const { data: cpfExiste } = await supabase
        .from('funcionario')
        .select('cpf')
        .eq('cpf', cpfNumeros)
        .maybeSingle();

      if (cpfExiste) {
        toast({
          title: "Erro",
          description: "Este CPF já está cadastrado.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Hash da senha
      const senhaHash = await hashPassword(senha);

      // Criar funcionário (sempre como ADMIN)
      const telefoneNumeros = telefone.replace(/\D/g, '');
      const { error } = await supabase
        .from('funcionario')
        .insert({
          nomecompleto: nomeCompleto,
          cpf: cpfNumeros,
          email: email,
          telefone: telefoneNumeros || null,
          cargo: 'ADMINISTRADOR',
          senha: senhaHash,
          status: 'ATIVO',
          dataadmissao: new Date().toISOString().split('T')[0],
        });

      if (error) {
        console.error('Erro ao cadastrar:', error);
        toast({
          title: "Erro",
          description: "Erro ao criar cadastro. Tente novamente.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Login automático
      const loginSuccess = await login(email, senha);

      if (loginSuccess) {
        toast({
          title: "Cadastro realizado!",
          description: "Bem-vindo ao VixClinic!",
        });
      } else {
        toast({
          title: "Cadastro realizado!",
          description: "Por favor, faça login com suas credenciais.",
        });
      }
    } catch (error) {
      console.error('Erro no cadastro:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao criar seu cadastro.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-blue to-medical-accent flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
            <Syringe className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">VixClinic</h1>
          <p className="text-white/80">Sistema de Gestão de Vacinação</p>
        </div>

        <Card className="card-shadow">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <UserPlus className="w-5 h-5 text-medical-blue" />
              Cadastro de Administrador
            </CardTitle>
            <CardDescription>
              Crie sua conta de administrador para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="nomeCompleto">Nome Completo *</Label>
                  <Input
                    id="nomeCompleto"
                    type="text"
                    placeholder="Seu nome completo"
                    value={nomeCompleto}
                    onChange={(e) => setNomeCompleto(e.target.value)}
                    disabled={isLoading}
                    maxLength={255}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF *</Label>
                  <MaskedInput
                    id="cpf"
                    mask="999.999.999-99"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <MaskedInput
                    id="telefone"
                    mask="(99) 99999-9999"
                    placeholder="(00) 00000-0000"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    maxLength={255}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="senha">Senha *</Label>
                  <Input
                    id="senha"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    disabled={isLoading}
                    minLength={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmarSenha">Confirmar Senha *</Label>
                  <Input
                    id="confirmarSenha"
                    type="password"
                    placeholder="Digite a senha novamente"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    disabled={isLoading}
                    minLength={6}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-medical-blue/10 rounded-lg">
                <Shield className="w-5 h-5 text-medical-blue flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Você será cadastrado automaticamente como <strong>Administrador</strong> com acesso total ao sistema.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full medical-gradient text-white hover:opacity-90"
                disabled={isLoading}
              >
                {isLoading ? 'Cadastrando...' : 'Criar Conta'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
