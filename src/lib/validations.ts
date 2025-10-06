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
  name: z.string().min(1, "Nome é obrigatório").max(45, "Nome deve ter no máximo 45 caracteres"),
  cpf: cpfSchema,
  dateOfBirth: z.string().min(1, "Data de nascimento é obrigatória"),
  phone: z.string()
    .min(10, "Telefone deve ter 10 ou 11 dígitos")
    .max(11, "Telefone deve ter 10 ou 11 dígitos")
    .regex(/^[0-9]{10,11}$/, "Telefone deve conter apenas números"),
  email: emailSchema.optional().or(z.literal('')),
  address: z.string().max(200, "Endereço deve ter no máximo 200 caracteres").optional(),
  allergies: z.string().optional(),
  observations: z.string().optional(),
});

// Schema completo para Funcionário
export const funcionarioSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(45, "Nome deve ter no máximo 45 caracteres"),
  email: emailSchema,
  cpf: cpfSchema,
  role: z.string().min(1, "Cargo é obrigatório"),
  permissions: z.array(z.string()),
  active: z.boolean(),
});

// Schema para Lote
export const loteSchema = z.object({
  batchNumber: z.string().min(1, "Código do lote é obrigatório").max(50, "Código deve ter no máximo 50 caracteres"),
  initialQuantity: z.number().min(1, "Quantidade inicial deve ser maior que 0"),
  remainingQuantity: z.number().min(0, "Quantidade disponível não pode ser negativa"),
  expiryDate: z.string().min(1, "Data de validade é obrigatória"),
}).refine((data) => data.remainingQuantity <= data.initialQuantity, {
  message: "Quantidade disponível não pode ser maior que a quantidade inicial",
  path: ["remainingQuantity"],
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
