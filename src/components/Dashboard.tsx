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
import { format, parseISO } from 'date-fns';

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
    expiringBatches: [],
    recentVaccinations: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      const [clientsData, employeesData, vaccinesData, batchesData, aplicacoesData, aplicacoesHojeData, agendamentosData] = await Promise.all([
        supabase.from('cliente').select('*'),
        supabase.from('funcionario').select('*'),
        supabase.from('vacina').select('*'),
        supabase.from('lote').select('*'),
        supabase.from('aplicacao').select('*').order('dataaplicacao', { ascending: false }).limit(5),
        supabase.from('aplicacao').select('idaplicacao').gte('dataaplicacao', `${today}T00:00:00`).lte('dataaplicacao', `${today}T23:59:59`),
        supabase.from('agendamento').select('*').eq('status', 'REALIZADO').order('dataagendada', { ascending: false }).limit(5),
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
        createdAt: new Date().toISOString(),
      }));

      const mappedEmployees: User[] = (employeesData.data || []).map(e => ({
        id: e.idfuncionario.toString(),
        name: e.nomecompleto,
        email: e.email,
        cpf: e.cpf,
        role: 'funcionario' as const,
        permissions: ['all'],
        active: e.status === 'ATIVO',
        createdAt: e.dataadmissao || new Date().toISOString(),
      }));

      const mappedVaccines: Vaccine[] = (vaccinesData.data || []).map(v => ({
        id: v.idvacina.toString(),
        name: v.nome,
        manufacturer: v.fabricante || '',
        description: v.descricao || '',
        targetDisease: v.categoria || '',
        dosesRequired: v.quantidadedoses || 1,
        createdAt: new Date().toISOString(),
      }));

      const mappedBatches: VaccineBatch[] = (batchesData.data || []).map(b => ({
        id: b.numlote.toString(),
        vaccineId: b.vacina_idvacina.toString(),
        batchNumber: b.codigolote,
        quantity: b.quantidadeinicial,
        remainingQuantity: b.quantidadedisponivel,
        manufacturingDate: new Date().toISOString(),
        expirationDate: b.datavalidade,
        createdAt: new Date().toISOString(),
      }));

      setClients(mappedClients);
      setEmployees(mappedEmployees);
      setVaccines(mappedVaccines);
      setBatches(mappedBatches);

      // Calcular estatísticas
      const vacinacoesHoje = (aplicacoesHojeData.data || []).length;

      const lotesVencendo = mappedBatches.filter(batch => {
        const daysUntilExpiration = Math.floor(
          (new Date(batch.expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysUntilExpiration > 0 && daysUntilExpiration <= 30;
      });

      const mappedRecentVaccinations: VaccinationRecord[] = (aplicacoesData.data || []).map(a => ({
        id: a.idaplicacao.toString(),
        clientId: a.cliente_cpf,
        vaccineId: '', 
        batchId: '', 
        appliedBy: a.funcionario_idfuncionario.toString(),
        applicationDate: a.dataaplicacao,
        doseNumber: a.dose || 1,
        observations: a.observacoes || '',
        adverseReactions: a.reacoesadversas || '',
        createdAt: a.dataaplicacao,
      }));

      // Adicionar agendamentos finalizados como vacinações recentes
      const agendamentosFinalizados: VaccinationRecord[] = (agendamentosData.data || []).map(ag => ({
        id: `ag-${ag.idagendamento}`,
        clientId: ag.cliente_cpf,
        vaccineId: '',
        batchId: ag.lote_numlote?.toString() || '',
        appliedBy: ag.funcionario_idfuncionario?.toString() || '',
        applicationDate: ag.dataagendada.split('T')[0],
        doseNumber: 1,
        observations: ag.observacoes || '',
        adverseReactions: '',
        createdAt: ag.dataagendada,
      }));

      // Combinar e ordenar por data
      const todasVacinacoes = [...mappedRecentVaccinations, ...agendamentosFinalizados]
        .sort((a, b) => new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime())
        .slice(0, 5);

      setStats({
        totalClients: mappedClients.length,
        totalEmployees: mappedEmployees.length,
        totalVaccines: mappedVaccines.length,
        vaccinationsToday: vacinacoesHoje,
        expiringBatches: lotesVencendo,
        recentVaccinations: todasVacinacoes,
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
    <Card className="card-shadow smooth-transition hover:shadow-lg cursor-pointer" onClick={onClick}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-medical-blue" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-medical-blue">{value}</div>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total de Clientes"
          value={stats.totalClients}
          description="Clientes cadastrados"
          icon={Users}
          trend="up"
          onClick={() => navigate('/clientes')}
        />
        
        <StatCard
          title="Funcionários"
          value={stats.totalEmployees}
          description="Equipe ativa"
          icon={UserCheck}
          onClick={() => navigate('/funcionarios')}
        />
        
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
          description="Aplicadas hoje"
          icon={Activity}
          trend="up"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expiring Batches */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Lotes com Validade Próxima
            </CardTitle>
            <CardDescription>
              Lotes que vencem nos próximos 30 dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.expiringBatches.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum lote próximo do vencimento
              </p>
            ) : (
              <div className="space-y-3">
                {stats.expiringBatches.map((batch) => {
                  const vaccine = vaccines.find(v => v.id === batch.vaccineId);
                  const daysUntilExpiry = Math.ceil(
                    (new Date(batch.expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  );
                  
                  return (
                    <div key={batch.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <div>
                        <p className="font-medium">{vaccine?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Lote: {batch.batchNumber}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={daysUntilExpiry <= 7 ? 'destructive' : 'secondary'}>
                          {daysUntilExpiry} dias
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          {batch.remainingQuantity} unidades
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Vaccinations */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-medical-blue" />
              Vacinações Recentes
            </CardTitle>
            <CardDescription>
              Últimas 5 vacinas aplicadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentVaccinations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma vacinação registrada
              </p>
            ) : (
              <div className="space-y-3">
                {stats.recentVaccinations.map((vaccination) => {
                  const client = clients.find(c => c.id === vaccination.clientId);
                  const vaccine = vaccines.find(v => v.id === vaccination.vaccineId);
                  const appliedBy = employees.find(e => e.id === vaccination.appliedBy);
                  
                  return (
                    <div key={vaccination.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div>
                        <p className="font-medium">{client?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {vaccine?.name} - Dose {vaccination.doseNumber}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {format(parseISO(vaccination.applicationDate), 'dd/MM/yyyy')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          por {appliedBy?.name}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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