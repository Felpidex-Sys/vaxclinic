// VixClinic Types - Database Schema Aligned

// Cliente - Aligned with database schema
export interface Cliente {
  CPF: string;
  nomeCompleto: string;
  dataNasc: string;
  email?: string;
  telefone: string;
  alergias?: string;
  observacoes?: string;
  status: 'ATIVO' | 'INATIVO';
}

// Funcionario - Aligned with database schema
export interface Funcionario {
  idFuncionario: number;
  nomeCompleto: string;
  CPF: string;
  email: string;
  telefone?: string;
  cargo?: string;
  senha: string;
  status: 'ATIVO' | 'INATIVO';
  dataAdmissao?: string;
}

// Vacina - Aligned with database schema (tipo de vacina)
export interface Vacina {
  idVacina: number;
  nome: string;
  fabricante?: string;
  categoria?: 'VIRAL' | 'BACTERIANA' | 'OUTRA';
  quantidadeDoses?: number;
  intervaloDoses?: number;
  descricao?: string;
  status: 'ATIVA' | 'INATIVA';
}

// Lote - Aligned with database schema (controla estoque)
export interface Lote {
  numLote: number;
  codigoLote: string;
  quantidadeInicial: number;
  quantidadeDisponivel: number;
  dataValidade: string;
  Vacina_idVacina: number;
}

// Agendamento - Aligned with database schema
export interface Agendamento {
  idAgendamento: number;
  dataAgendada: string;
  status: 'AGENDADO' | 'REALIZADO';
  observacoes?: string;
  Cliente_CPF: number;
  Funcionario_idFuncionario: number | null;
  Lote_numLote: number;
}

// Aplicacao - Aligned with database schema
export interface Aplicacao {
  idAplicacao: number;
  dataAplicacao: string;
  dose?: number;
  reacoesAdversas?: string;
  observacoes?: string;
  Funcionario_idFuncionario: number;
  Cliente_CPF: number;
  Agendamento_idAgendamento: number;
}

// Legacy interfaces for backward compatibility
export interface User {
  id: string;
  name: string;
  email: string;
  cpf: string; // VARCHAR(11) - apenas números, sem formatação
  role: 'admin' | 'funcionario' | 'vacinador';
  permissions: string[];
  active: boolean;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  cpf: string; // VARCHAR(11) - apenas números, sem formatação
  dateOfBirth: string;
  phone: string; // VARCHAR(11) - apenas números, sem formatação
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
  appliedBy: string;
  doseNumber: number;
  nextDueDate?: string;
  observations?: string;
  createdAt: string;
}

export interface AgendamentoProximo {
  id: string;
  clienteNome: string;
  clienteCpf: string;
  vacinaNome: string;
  dataAgendada: string;
  tempoRestante: string;
  urgente: boolean;
}

export interface DashboardStats {
  totalClients: number;
  totalEmployees: number;
  totalVaccines: number;
  vaccinationsToday: number;
  totalAgendamentos: number;
  agendamentosHoje: number;
  expiringBatches: VaccineBatch[];
  upcomingAppointments: AgendamentoProximo[];
}

// Dashboard Stats interface
export interface DashboardStatsVix {
  totalClientes: number;
  totalFuncionarios: number;
  totalVacinas: number;
  vacinacoesHoje: number;
  agendamentosHoje: number;
  lotesVencendo: Lote[];
  aplicacoesRecentes: Aplicacao[];
  agendamentosProximos: Agendamento[];
}