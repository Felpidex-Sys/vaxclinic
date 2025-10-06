// VixClinic Types - Database Schema Aligned

// Cliente - Aligned with database schema
export interface Cliente {
  CPF: number;
  nomeCompleto: string;
  dataNasc: string;
  email?: string;
  telefone: string;
  alergias?: string;
  observacoes?: string;
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
  Funcionario_idFuncionario: number;
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
  appliedBy: string;
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