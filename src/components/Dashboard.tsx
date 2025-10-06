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
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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
      // Fetch clients
      const { data: clientesData } = await supabase
        .from('cliente')
        .select('*');

      const mappedClients: Client[] = (clientesData || []).map(cliente => ({
        id: cliente.cpf,
        name: cliente.nomecompleto,
        cpf: cliente.cpf,
        dateOfBirth: cliente.datanasc || '',
        phone: cliente.telefone || '',
        email: cliente.email || '',
        address: '',
        allergies: cliente.alergias || '',
        observations: cliente.observacoes || '',
        createdAt: new Date().toISOString(),
      }));

      // Fetch employees
      const { data: funcionariosData } = await supabase
        .from('funcionario')
        .select('*');

      const mappedEmployees: User[] = (funcionariosData || []).map(func => ({
        id: func.idfuncionario.toString(),
        name: func.nomecompleto,
        email: func.email,
        cpf: func.cpf,
        role: (func.cargo || 'funcionario') as 'admin' | 'funcionario' | 'vacinador',
        permissions: [],
        active: func.status === 'ATIVO',
        createdAt: new Date().toISOString(),
      }));

      // Fetch vaccines
      const { data: vacinasData } = await supabase
        .from('vacina')
        .select('*');

      const mappedVaccines: Vaccine[] = (vacinasData || []).map(vac => ({
        id: vac.idvacina.toString(),
        name: vac.nome,
        manufacturer: vac.fabricante || '',
        description: vac.descricao || '',
        targetDisease: vac.categoria || '',
        dosesRequired: vac.quantidadedoses || 1,
        createdAt: new Date().toISOString(),
      }));

      // Fetch batches
      const { data: lotesData } = await supabase
        .from('lote')
        .select('*')
        .order('datavalidade', { ascending: true });

      const mappedBatches: VaccineBatch[] = (lotesData || []).map(lote => ({
        id: lote.numlote.toString(),
        vaccineId: lote.vacina_idvacina.toString(),
        batchNumber: lote.codigolote,
        quantity: lote.quantidadeinicial,
        remainingQuantity: lote.quantidadedisponivel,
        manufacturingDate: '',
        expirationDate: lote.datavalidade,
        createdAt: new Date().toISOString(),
      }));

      setClients(mappedClients);
      setEmployees(mappedEmployees);
      setVaccines(mappedVaccines);
      setBatches(mappedBatches);

      // Calculate stats
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 30);
      
      const expiringBatches = mappedBatches.filter(batch => {
        const expirationDate = new Date(batch.expirationDate);
        return expirationDate <= tomorrow && batch.remainingQuantity > 0;
      }).slice(0, 5);

      setStats({
        totalClients: mappedClients.length,
        totalEmployees: mappedEmployees.length,
        totalVaccines: mappedVaccines.length,
        vaccinationsToday: 0,
        expiringBatches,
        recentVaccinations: []
      });
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
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
            Bem-vindo ao VixClinic, {user?.name?.split(' ')[0]}!
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
                          {new Date(vaccination.applicationDate).toLocaleDateString('pt-BR')}
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