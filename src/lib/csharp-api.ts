import api from './api';

// Tipos de resposta da API C#
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    nome: string;
    email: string;
    cargo: string | null;
  };
}

export interface Cliente {
  cpf: string;
  nomeCompleto: string;
  dataNasc?: string;
  email?: string;
  telefone?: string;
  alergias?: string;
  status: 'ATIVO' | 'INATIVO';
}

export interface Funcionario {
  idFuncionario?: number;
  nomeCompleto: string;
  cpf: string;
  email: string;
  senha?: string;
  telefone?: string;
  cargo?: string;
  dataAdmissao?: string;
  status: 'ATIVO' | 'INATIVO';
}

export interface Vacina {
  idVacina?: number;
  nome: string;
  fabricante?: string;
  categoria?: 'VIRAL' | 'BACTERIANA' | 'OUTRA';
  quantidadeDoses?: number;
  intervaloDoses?: number;
  status: 'ATIVA' | 'INATIVA';
}

export interface Lote {
  numLote?: number;
  codigoLote: string;
  quantidadeInicial: number;
  quantidadeDisponivel: number;
  dataValidade: string;
  precoCompra: number;
  precoVenda: number;
  vacinaId: number;
}

export interface Agendamento {
  idAgendamento?: number;
  dataAgendada: string;
  status: 'AGENDADO' | 'REALIZADO';
  clienteCpf: string;
  funcionarioId?: number;
  loteNumLote: number;
}

export interface Aplicacao {
  idAplicacao?: number;
  dataAplicacao: string;
  dose?: number;
  reacoesAdversas?: string;
  observacoes?: string;
  funcionarioId: number;
  clienteCpf: string;
  agendamentoId?: number;
}

// ==================== AUTH ====================
export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', {
      email,
      password,
    });
    
    // Salvar token e usuário
    localStorage.setItem('vaxclinic_token', response.data.token);
    localStorage.setItem('vaxclinic_user', JSON.stringify(response.data.user));
    
    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('vaxclinic_token');
      localStorage.removeItem('vaxclinic_user');
    }
  },

  getUser: () => {
    const userStr = localStorage.getItem('vaxclinic_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('vaxclinic_token');
  },
};

// ==================== CLIENTES ====================
export const clienteService = {
  getAll: async (): Promise<Cliente[]> => {
    const response = await api.get<Cliente[]>('/clientes');
    return response.data;
  },

  getByCpf: async (cpf: string): Promise<Cliente> => {
    const response = await api.get<Cliente>(`/clientes/${cpf}`);
    return response.data;
  },

  create: async (cliente: Cliente): Promise<Cliente> => {
    const response = await api.post<Cliente>('/clientes', cliente);
    return response.data;
  },

  update: async (cpf: string, cliente: Cliente): Promise<Cliente> => {
    const response = await api.put<Cliente>(`/clientes/${cpf}`, cliente);
    return response.data;
  },

  delete: async (cpf: string): Promise<void> => {
    await api.delete(`/clientes/${cpf}`);
  },

  getStats: async (): Promise<{ total: number; ativos: number; inativos: number }> => {
    const response = await api.get('/clientes/stats');
    return response.data;
  },
};

// ==================== FUNCIONARIOS ====================
export const funcionarioService = {
  getAll: async (): Promise<Funcionario[]> => {
    const response = await api.get<Funcionario[]>('/funcionarios');
    return response.data;
  },

  getById: async (id: number): Promise<Funcionario> => {
    const response = await api.get<Funcionario>(`/funcionarios/${id}`);
    return response.data;
  },

  create: async (funcionario: Funcionario): Promise<Funcionario> => {
    const response = await api.post<Funcionario>('/funcionarios', funcionario);
    return response.data;
  },

  update: async (id: number, funcionario: Funcionario): Promise<Funcionario> => {
    const response = await api.put<Funcionario>(`/funcionarios/${id}`, funcionario);
    return response.data;
  },

  getStats: async (): Promise<{ total: number; ativos: number; inativos: number }> => {
    const response = await api.get('/funcionarios/stats');
    return response.data;
  },
};

// ==================== VACINAS ====================
export const vacinaService = {
  getAll: async (): Promise<Vacina[]> => {
    const response = await api.get<Vacina[]>('/vacinas');
    return response.data;
  },

  getById: async (id: number): Promise<Vacina> => {
    const response = await api.get<Vacina>(`/vacinas/${id}`);
    return response.data;
  },

  create: async (vacina: Vacina): Promise<Vacina> => {
    const response = await api.post<Vacina>('/vacinas', vacina);
    return response.data;
  },

  update: async (id: number, vacina: Vacina): Promise<Vacina> => {
    const response = await api.put<Vacina>(`/vacinas/${id}`, vacina);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/vacinas/${id}`);
  },

  getStats: async (): Promise<{ total: number; ativas: number; inativas: number }> => {
    const response = await api.get('/vacinas/stats');
    return response.data;
  },
};

// ==================== LOTES ====================
export const loteService = {
  getAll: async (): Promise<Lote[]> => {
    const response = await api.get<Lote[]>('/lotes');
    return response.data;
  },

  getById: async (id: number): Promise<Lote> => {
    const response = await api.get<Lote>(`/lotes/${id}`);
    return response.data;
  },

  create: async (lote: Lote): Promise<Lote> => {
    const response = await api.post<Lote>('/lotes', lote);
    return response.data;
  },

  update: async (id: number, lote: Lote): Promise<Lote> => {
    const response = await api.put<Lote>(`/lotes/${id}`, lote);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/lotes/${id}`);
  },

  getVencendo: async (dias: number = 30): Promise<Lote[]> => {
    const response = await api.get<Lote[]>(`/lotes/vencendo?dias=${dias}`);
    return response.data;
  },
};

// ==================== AGENDAMENTOS ====================
export const agendamentoService = {
  getAll: async (): Promise<Agendamento[]> => {
    const response = await api.get<Agendamento[]>('/agendamentos');
    return response.data;
  },

  getById: async (id: number): Promise<Agendamento> => {
    const response = await api.get<Agendamento>(`/agendamentos/${id}`);
    return response.data;
  },

  create: async (agendamento: Agendamento): Promise<Agendamento> => {
    const response = await api.post<Agendamento>('/agendamentos', agendamento);
    return response.data;
  },

  update: async (id: number, agendamento: Agendamento): Promise<Agendamento> => {
    const response = await api.put<Agendamento>(`/agendamentos/${id}`, agendamento);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/agendamentos/${id}`);
  },
};

// ==================== APLICACOES ====================
export const aplicacaoService = {
  getAll: async (): Promise<Aplicacao[]> => {
    const response = await api.get<Aplicacao[]>('/aplicacoes');
    return response.data;
  },

  getById: async (id: number): Promise<Aplicacao> => {
    const response = await api.get<Aplicacao>(`/aplicacoes/${id}`);
    return response.data;
  },

  create: async (aplicacao: Aplicacao): Promise<Aplicacao> => {
    const response = await api.post<Aplicacao>('/aplicacoes', aplicacao);
    return response.data;
  },

  getByClienteCpf: async (cpf: string): Promise<Aplicacao[]> => {
    const response = await api.get<Aplicacao[]>(`/aplicacoes/cliente/${cpf}`);
    return response.data;
  },
};

// ==================== DASHBOARD ====================
export const dashboardService = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  getLotesVencendo: async (dias: number = 30) => {
    const response = await api.get(`/dashboard/lotes-vencendo?dias=${dias}`);
    return response.data;
  },

  getAplicacoesRecentes: async (limite: number = 10) => {
    const response = await api.get(`/dashboard/aplicacoes-recentes?limite=${limite}`);
    return response.data;
  },
};
