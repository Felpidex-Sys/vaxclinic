// VixClinic Types - Following the class diagram specification

// Legacy interfaces (to maintain compatibility)
export interface User {
  id: string;
  name: string;
  email: string;
  cpf: string;
  role: 'admin' | 'funcionario' | 'vacinador';
  permissions: string[];
  active: boolean;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  cpf: string;
  dateOfBirth: string;
  phone: string;
  email?: string;
  address?: string;
  allergies?: string;
  observations?: string;
  createdAt: string;
}

export interface Vaccine {
  id: string;
  name: string;
  manufacturer: string;
  description: string;
  targetDisease: string;
  dosesRequired: number;
  createdAt: string;
}

export interface VaccineBatch {
  id: string;
  vaccineId: string;
  batchNumber: string;
  quantity: number;
  remainingQuantity: number;
  manufacturingDate: string;
  expirationDate: string;
  createdAt: string;
}

export interface VaccinationRecord {
  id: string;
  clientId: string;
  vaccineId: string;
  batchId: string;
  applicationDate: string;
  appliedBy: string; // User ID
  doseNumber: number;
  nextDueDate?: string;
  observations?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalClients: number;
  totalEmployees: number;
  totalVaccines: number;
  vaccinationsToday: number;
  expiringBatches: VaccineBatch[];
  recentVaccinations: VaccinationRecord[];
}

// New VixClinic interfaces following the class diagram
export interface Usuario {
  id: string;
  nome: string;
  login: string;
  senha: string;
  ativo: boolean;
  criadoEm: string;
}

// Funcionario extends Usuario
export interface Funcionario extends Usuario {
  tipo: 'funcionario' | 'vacinador';
  permissoes: string[];
}

// Administrador extends Usuario  
export interface Administrador extends Usuario {
  tipo: 'admin';
  permissoes: string[];
}

// Paciente interface following the class diagram
export interface Paciente {
  id: string;
  nome: string;
  cpf: string;
  dataNascimento: string;
  contato: string;
  email?: string;
  endereco?: string;
  alergias?: string;
  observacoes?: string;
  criadoEm: string;
}

// Vacina interface following the class diagram
export interface Vacina {
  id: string;
  nome: string;
  lote: string;
  dataValidade: string;
  quantidadeEstoque: number;
  fabricante: string;
  descricao?: string;
  doencaAlvo?: string;
  dosesNecessarias: number;
  criadoEm: string;
}

// Agendamento interface following the class diagram
export interface Agendamento {
  id: string;
  pacienteId: string;
  funcionarioId: string;
  vacinaId: string;
  dataHora: string;
  status: 'Agendado' | 'Cancelado' | 'Concluido';
  observacoes?: string;
  criadoEm: string;
}

// Aplicacao interface following the class diagram
export interface Aplicacao {
  id: string;
  pacienteId: string;
  vacinaId: string;
  agendamentoId?: string;
  dataAplicacao: string;
  aplicadoPor: string; // User ID
  numeroDose: number;
  proximaDataDevida?: string;
  observacoes?: string;
  criadoEm: string;
}

// New Dashboard Stats interface
export interface DashboardStatsVix {
  totalPacientes: number;
  totalFuncionarios: number;
  totalVacinas: number;
  vacinacaoHoje: number;
  agendamentosHoje: number;
  vacinasVencendo: Vacina[];
  aplicacoesRecentes: Aplicacao[];
  agendamentosProximos: Agendamento[];
}