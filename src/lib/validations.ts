import { z } from 'zod';

// Validação de CPF (11 dígitos)
export const cpfSchema = z.string()
  .min(11, "CPF deve ter 11 dígitos")
  .max(11, "CPF deve ter 11 dígitos")
  .regex(/^[0-9]{11}$/, "CPF deve conter apenas números");

// Validação de Email
export const emailSchema = z.string()
  .email("Email inválido")
  .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Formato de email inválido");

// Validação de Telefone (10-11 dígitos)
export const telefoneSchema = z.string()
  .min(10, "Telefone deve ter 10 ou 11 dígitos")
  .max(11, "Telefone deve ter 10 ou 11 dígitos")
  .regex(/^[0-9]{10,11}$/, "Telefone deve conter apenas números")
  .optional().or(z.literal(''));

// Validação de Senha
export const senhaSchema = z.string()
  .min(8, "Senha deve ter no mínimo 8 caracteres");

// Schema completo para Cliente
export const clienteSchema = z.object({
  name: z.string()
    .min(1, "Nome é obrigatório")
    .max(45, "Nome deve ter no máximo 45 caracteres")
    .refine((val) => val.trim().length > 0, "Nome não pode estar vazio"),
  cpf: cpfSchema,
  dateOfBirth: z.string()
    .min(1, "Data de nascimento é obrigatória")
    .refine((date) => {
      const birthDate = new Date(date);
      return birthDate <= new Date();
    }, "Data de nascimento não pode ser no futuro"),
  phone: z.string()
    .min(10, "Telefone deve ter 10 ou 11 dígitos")
    .max(11, "Telefone deve ter 10 ou 11 dígitos")
    .regex(/^[0-9]{10,11}$/, "Telefone deve conter apenas números"),
  email: emailSchema.optional().or(z.literal('')),
  address: z.string().max(200, "Endereço deve ter no máximo 200 caracteres").optional(),
  allergies: z.string().optional(),
  observations: z.string().optional(),
  status: z.enum(['ATIVO', 'INATIVO']).default('ATIVO'),
});

// Schema completo para Funcionário
export const funcionarioSchema = z.object({
  name: z.string()
    .min(1, "Nome é obrigatório")
    .max(45, "Nome deve ter no máximo 45 caracteres")
    .refine((val) => val.trim().length > 0, "Nome não pode estar vazio"),
  email: emailSchema,
  cpf: cpfSchema,
  role: z.string().min(1, "Cargo é obrigatório"),
  permissions: z.array(z.string()),
  active: z.boolean(),
  dataAdmissao: z.string()
    .optional()
    .refine((date) => {
      if (!date) return true;
      const admissionDate = new Date(date);
      return admissionDate <= new Date();
    }, "Data de admissão não pode ser no futuro"),
});

// Schema para Lote
export const loteSchema = z.object({
  batchNumber: z.string()
    .min(1, "Código do lote é obrigatório")
    .max(50, "Código deve ter no máximo 50 caracteres")
    .refine((val) => val.trim().length > 0, "Código do lote não pode estar vazio"),
  initialQuantity: z.number().min(1, "Quantidade inicial deve ser maior que 0"),
  remainingQuantity: z.number().min(0, "Quantidade disponível não pode ser negativa"),
  expiryDate: z.string()
    .min(1, "Data de validade é obrigatória")
    .refine((date) => {
      const expiryDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return expiryDate >= today;
    }, "Data de validade não pode ser anterior à data atual"),
}).refine((data) => data.remainingQuantity <= data.initialQuantity, {
  message: "Quantidade disponível não pode ser maior que a quantidade inicial",
  path: ["remainingQuantity"],
});

// Schema para Vacina
export const vacinaSchema = z.object({
  nome: z.string()
    .min(1, "Nome é obrigatório")
    .max(45, "Nome deve ter no máximo 45 caracteres")
    .refine((val) => val.trim().length > 0, "Nome não pode estar vazio"),
  fabricante: z.string().max(45, "Fabricante deve ter no máximo 45 caracteres").optional(),
  categoria: z.enum(['VIRAL', 'BACTERIANA', 'OUTRA']).optional(),
  quantidadeDoses: z.number()
    .positive("Quantidade de doses deve ser maior que 0")
    .optional(),
  intervaloDoses: z.number()
    .min(0, "Intervalo de doses não pode ser negativo")
    .optional(),
  descricao: z.string().optional(),
  status: z.enum(['ATIVA', 'INATIVA']).default('ATIVA'),
});

// Schema para Agendamento
export const agendamentoSchema = z.object({
  dataAgendada: z.string()
    .min(1, "Data do agendamento é obrigatória")
    .refine((date) => {
      const scheduledDate = new Date(date);
      return scheduledDate > new Date();
    }, "Data do agendamento deve ser no futuro"),
  observacoes: z.string().optional(),
  Cliente_CPF: z.string().regex(/^[0-9]{11}$/, "CPF inválido"),
  Funcionario_idFuncionario: z.number().positive("ID do funcionário inválido"),
  Lote_numLote: z.number().positive("ID do lote inválido"),
});

// Schema para Aplicação
export const aplicacaoSchema = z.object({
  dataAplicacao: z.string()
    .min(1, "Data da aplicação é obrigatória")
    .refine((date) => {
      const applicationDate = new Date(date);
      return applicationDate <= new Date();
    }, "Data da aplicação não pode ser no futuro"),
  dose: z.number().positive("Dose deve ser maior que 0").optional(),
  reacoesAdversas: z.string().optional(),
  observacoes: z.string().optional(),
  Funcionario_idFuncionario: z.number().positive("ID do funcionário inválido"),
  Cliente_CPF: z.string().regex(/^[0-9]{11}$/, "CPF inválido"),
  Agendamento_idAgendamento: z.number().positive("ID do agendamento inválido"),
});

export const formatCPF = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  return numbers.slice(0, 11);
};

export const formatTelefone = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  return numbers.slice(0, 11);
};

export const displayCPF = (cpf: string): string => {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

export const displayTelefone = (telefone: string): string => {
  if (telefone.length === 11) {
    return telefone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (telefone.length === 10) {
    return telefone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return telefone;
};

export const validateCPF = (cpf: string): boolean => {
  const cleaned = formatCPF(cpf);
  return /^[0-9]{11}$/.test(cleaned);
};

export const validateEmail = (email: string): boolean => {
  if (!email) return true; // email é opcional
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
};

export const validateTelefone = (telefone: string): boolean => {
  const cleaned = formatTelefone(telefone);
  return /^[0-9]{10,11}$/.test(cleaned);
};
