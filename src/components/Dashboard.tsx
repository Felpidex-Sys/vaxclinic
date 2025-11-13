import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  UserCheck, 
  Syringe, 
  Calendar,
  AlertTriangle,
  Plus,
  TrendingUp,
  Activity
} from 'lucide-react';
import { DashboardStats, Client, User, Vaccine, VaccineBatch, VaccinationRecord, Agendamento } from '@/types';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getBrasiliaDate, toBrasiliaISOString, formatBrasiliaDate, formatBrasiliaDateTime } from '@/lib/utils';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [batches, setBatches] = useState<VaccineBatch[]>([]);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    totalEmployees: 0,
    totalVaccines: 0,
    vaccinationsToday: 0,
    totalAgendamentos: 0,
    agendamentosHoje: 0,
    expiringBatches: [],
    upcomingAppointments: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Get today's date in Brasília timezone
      const d = getBrasiliaDate(); const pad = (n: number) => String(n).padStart(2,'0'); const today = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
      
      const [clientsData, employeesData, vaccinesData, batchesData, aplicacoesHojeData, agendamentosProximosData, totalAgendamentosData, agendamentosHojeData] = await Promise.all([
        supabase.from('cliente').select('*'),
        supabase.from('funcionario').select('*').neq('cargo', 'ADMINISTRADOR'),
        supabase.from('vacina').select('*'),
        supabase.from('lote').select('*'),
        supabase.from('aplicacao').select('idaplicacao').gte('dataaplicacao', `${today}T00:00:00`).lte('dataaplicacao', `${today}T23:59:59`),
        supabase
          .from('agendamento')
          .select('*')
          .eq('status', 'AGENDADO')
          .order('dataagendada', { ascending: true })
          .limit(50),
        supabase.from('agendamento').select('*', { count: 'exact', head: true }).eq('status', 'AGENDADO'),
        supabase
          .from('agendamento')
          .select('idagendamento')
          .eq('status', 'AGENDADO')
          .gte('dataagendada', `${today}T00:00:00`)
          .lte('dataagendada', `${today}T23:59:59`),
      ]);

      if (clientsData.error) throw clientsData.error;
      if (employeesData.error) throw employeesData.error;
      if (vaccinesData.error) throw vaccinesData.error;
      if (batchesData.error) throw batchesData.error;

      const mappedClients: Client[] = (clientsData.data || []).map(c => ({
        id: c.cpf,
        name: c.nomecompleto,
        cpf: c.cpf,
        dateOfBirth: c.datanasc || '',
        phone: c.telefone || '',
        email: c.email || '',
        address: '',
        allergies: c.alergias || '',
        observations: c.observacoes || '',
        createdAt: toBrasiliaISOString(),
      }));

      const mappedEmployees: User[] = (employeesData.data || []).map(e => ({
        id: e.idfuncionario.toString(),
        name: e.nomecompleto,
        email: e.email,
        cpf: e.cpf,
        role: 'funcionario' as const,
        permissions: ['all'],
        active: e.status === 'ATIVO',
        createdAt: e.dataadmissao || toBrasiliaISOString(),
      }));

      const mappedVaccines: Vaccine[] = (vaccinesData.data || []).map(v => ({
        id: v.idvacina.toString(),
        name: v.nome,
        manufacturer: v.fabricante || '',
        description: v.descricao || '',
        targetDisease: v.categoria || '',
        dosesRequired: v.quantidadedoses || 1,
        createdAt: toBrasiliaISOString(),
      }));

      const mappedBatches: VaccineBatch[] = (batchesData.data || []).map(b => ({
        id: b.numlote.toString(),
        vaccineId: b.vacina_idvacina.toString(),
        batchNumber: b.codigolote,
        quantity: b.quantidadeinicial,
        remainingQuantity: b.quantidadedisponivel,
        manufacturingDate: toBrasiliaISOString(),
        expirationDate: b.datavalidade,
        createdAt: toBrasiliaISOString(),
      }));

      setClients(mappedClients);
      setEmployees(mappedEmployees);
      setVaccines(mappedVaccines);
      setBatches(mappedBatches);

      // Calcular estatísticas
      const vacinacoesHoje = (aplicacoesHojeData.data || []).length;

      const lotesVencendo = mappedBatches.filter(batch => {
        const daysUntilExpiration = Math.floor(
          (new Date(batch.expirationDate).getTime() - getBrasiliaDate().getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysUntilExpiration > 0 && daysUntilExpiration <= 30;
      });

      // Buscar dados adicionais para agendamentos próximos
      const parseAsBrasilia = (ts: string) => {
        // Trata timestamps do banco (sem timezone) como horário de Brasília
        if (/Z|[+-]\d{2}:\d{2}$/.test(ts)) return new Date(ts);
        return new Date(`${ts}-03:00`);
      };

      const agoraBRT = getBrasiliaDate();
      const proximosAg = (agendamentosProximosData.data || [])
        .filter((ag) => parseAsBrasilia(ag.dataagendada) >= agoraBRT)
        .slice(0, 5);

      const upcomingAppointments = await Promise.all(
        proximosAg.map(async (ag) => {
          const [clientData, loteData] = await Promise.all([
            supabase.from('cliente').select('nomecompleto').eq('cpf', ag.cliente_cpf).single(),
            supabase.from('lote').select('vacina_idvacina').eq('numlote', ag.lote_numlote).single(),
          ]);

          let vacinaNome = 'Vacina não encontrada';
          if (loteData.data?.vacina_idvacina) {
            const vacinaData = await supabase
              .from('vacina')
              .select('nome')
              .eq('idvacina', loteData.data.vacina_idvacina)
              .single();
            vacinaNome = vacinaData.data?.nome || vacinaNome;
          }

          const agendamento = parseAsBrasilia(ag.dataagendada);
          const diffMs = agendamento.getTime() - agoraBRT.getTime();
          const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          const horas = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

          let tempoRestante = '';
          let urgente = false;

          if (dias > 0) {
            tempoRestante = `${dias} dia${dias > 1 ? 's' : ''}`;
          } else if (horas > 0) {
            tempoRestante = `${horas}h${minutos > 0 ? `${minutos}min` : ''}`;
            urgente = horas < 24;
          } else {
            tempoRestante = `${Math.max(minutos, 0)}min`;
            urgente = true;
          }

          return {
            id: ag.idagendamento.toString(),
            clienteNome: clientData.data?.nomecompleto || 'Cliente não encontrado',
            clienteCpf: ag.cliente_cpf,
            vacinaNome,
            dataAgendada: ag.dataagendada,
            tempoRestante,
            urgente,
          };
        })
      );

      setStats({
        totalClients: mappedClients.length,
        totalEmployees: mappedEmployees.filter(e => e.active).length,
        totalVaccines: mappedVaccines.length,
        vaccinationsToday: aplicacoesHojeData.data?.length || 0,
        totalAgendamentos: totalAgendamentosData.count || 0,
        agendamentosHoje: agendamentosHojeData.data?.length || 0,
        expiringBatches: lotesVencendo,
        upcomingAppointments: upcomingAppointments
      });
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados do sistema.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    description, 
    icon: Icon, 
    trend,
    onClick 
  }: {
    title: string;
    value: number;
    description: string;
    icon: React.ElementType;
    trend?: 'up' | 'down';
    onClick?: () => void;
  }) => (
    <Card 
      className={`card-shadow smooth-transition border border-border/50 min-h-[140px] flex flex-col justify-between ${onClick ? 'hover:shadow-lg hover:scale-[1.02] cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm md:text-base font-medium text-foreground">{title}</CardTitle>
        <div className="p-2.5 md:p-3 bg-primary/10 rounded-xl">
          <Icon className="h-6 w-6 md:h-7 md:w-7 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-end">
        <div className="text-4xl md:text-5xl font-bold text-primary mb-2">{value}</div>
        <p className="text-xs md:text-sm text-muted-foreground flex items-center gap-1">
          {trend && (
            <TrendingUp className={`h-3 w-3 ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`} />
          )}
          {description}
        </p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      ) : (
        <>
          {/* Welcome Header */}
          <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-medical-blue">
            Bem-vindo ao VixClinic!
          </h1>
          <p className="text-muted-foreground">
            Visão geral do sistema de vacinação
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            className="medical-gradient text-white"
            onClick={() => navigate('/clientes')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Cliente
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="space-y-6">
        {/* Estatísticas de Pessoas */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Pessoas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <StatCard
              title="Total de Clientes"
              value={stats.totalClients}
              description="Clientes cadastrados"
              icon={Users}
              trend="up"
              onClick={() => navigate('/clientes')}
            />
            
            <StatCard
              title="Funcionários Ativos"
              value={stats.totalEmployees}
              description="Equipe ativa"
              icon={UserCheck}
              onClick={() => navigate('/funcionarios')}
            />
          </div>
        </div>

        {/* Estatísticas de Vacinação */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Vacinação</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 md:gap-6">
            <StatCard
              title="Vacinas Disponíveis"
              value={stats.totalVaccines}
              description="Tipos de vacina"
              icon={Syringe}
              onClick={() => navigate('/vacinas')}
            />
            
            <StatCard
              title="Vacinações Hoje"
              value={stats.vaccinationsToday}
              description="Aplicações realizadas • Ver histórico"
              icon={Activity}
              onClick={() => navigate('/historico')}
            />
            
            <StatCard
              title="Total de Agendamentos"
              value={stats.totalAgendamentos}
              description="Agendamentos com status agendado"
              icon={Calendar}
              onClick={() => navigate('/agendamentos')}
            />
            
            <StatCard
              title="Agendamentos Hoje"
              value={stats.agendamentosHoje}
              description="Agendados para hoje"
              icon={Calendar}
              onClick={() => navigate('/agendamentos')}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Expiring Batches */}
        <Card className="card-shadow border border-border/50 min-h-[400px] flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <AlertTriangle className="w-5 h-5" />
              Lotes com Validade Próxima
            </CardTitle>
            <CardDescription>
              Lotes que vencem nos próximos 30 dias
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            <div className="h-full max-h-[280px] overflow-y-auto pr-2"
            >
              {stats.expiringBatches.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum lote próximo do vencimento
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                {stats.expiringBatches.map((batch) => {
                  const vaccine = vaccines.find(v => v.id === batch.vaccineId);
                  const daysUntilExpiry = Math.ceil(
                    (new Date(batch.expirationDate).getTime() - getBrasiliaDate().getTime()) / (1000 * 60 * 60 * 24)
                  );
                  
                   return (
                    <div 
                      key={batch.id} 
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-accent/5 to-accent/10 rounded-lg cursor-pointer hover:from-accent/10 hover:to-accent/20 smooth-transition hover:scale-[1.02] border border-border/50"
                      onClick={() => navigate('/vacinas', { state: { selectedLote: batch.batchNumber } })}
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{vaccine?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Lote: {batch.batchNumber}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={daysUntilExpiry <= 7 ? 'destructive' : 'secondary'} className="mb-1">
                          {daysUntilExpiry} dias
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {batch.remainingQuantity} unidades
                        </p>
                      </div>
                    </div>
                  );
                })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card className="card-shadow border border-border/50 min-h-[400px] flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Calendar className="w-5 h-5" />
              Agendamentos Próximos
            </CardTitle>
            <CardDescription>
              Próximos 5 agendamentos
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            <div className="h-full max-h-[280px] overflow-y-auto pr-2"
            >
              {stats.upcomingAppointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum agendamento próximo
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                {stats.upcomingAppointments.map((appointment) => {
                  const getBadgeColor = () => {
                    if (appointment.tempoRestante.includes('min') || appointment.tempoRestante.includes('h')) {
                      return appointment.tempoRestante.includes('min') && !appointment.tempoRestante.includes('h')
                        ? 'bg-red-100 text-red-800'
                        : 'bg-orange-100 text-orange-800';
                    }
                    return 'bg-blue-100 text-blue-800';
                  };
                  
                   return (
                    <div 
                      key={appointment.id} 
                      className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg cursor-pointer hover:from-primary/10 hover:to-primary/20 smooth-transition hover:scale-[1.02] border border-border/50"
                      onClick={() => navigate('/agendamentos', { state: { selectedAgendamento: parseInt(appointment.id) } })}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-semibold text-foreground">{appointment.clienteNome}</p>
                        <Badge className={getBadgeColor()}>
                          {appointment.tempoRestante}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{appointment.vacinaNome}</p>
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">
                          {formatBrasiliaDate(appointment.dataAgendada)} às{' '}
                          {new Date(appointment.dataAgendada).toLocaleTimeString('pt-BR', {
                            timeZone: 'America/Sao_Paulo',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>
            Acesse rapidamente as funcionalidades mais utilizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-20 flex flex-col gap-2"
              onClick={() => navigate('/clientes')}
            >
              <Users className="w-6 h-6 text-medical-blue" />
              <span className="text-sm">Novo Cliente</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-20 flex flex-col gap-2"
              onClick={() => navigate('/vacinas')}
            >
              <Syringe className="w-6 h-6 text-medical-blue" />
              <span className="text-sm">Aplicar Vacina</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-20 flex flex-col gap-2"
              onClick={() => navigate('/agendamentos')}
            >
              <Calendar className="w-6 h-6 text-medical-blue" />
              <span className="text-sm">Agendamentos</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-20 flex flex-col gap-2"
              onClick={() => navigate('/relatorios')}
            >
              <TrendingUp className="w-6 h-6 text-medical-blue" />
              <span className="text-sm">Relatórios</span>
            </Button>
          </div>
        </CardContent>
      </Card>
        </>
      )}
    </div>
  );
};