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