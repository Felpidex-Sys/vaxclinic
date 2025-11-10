import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Client, Vaccine, VaccineBatch, VaccinationRecord, User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VaccineApplicationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
  vaccines: Vaccine[];
  batches: VaccineBatch[];
  employees: User[];
  onSave: (vaccination: Omit<VaccinationRecord, 'id' | 'createdAt'>) => void;
}

export const VaccineApplicationForm: React.FC<VaccineApplicationFormProps> = ({
  open,
  onOpenChange,
  clients,
  vaccines,
  batches,
  employees,
  onSave,
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    clientId: '',
    vaccineId: '',
    batchId: '',
    employeeId: '',
    doseNumber: 1,
    nextDueDate: '',
    notes: '',
  });

  const activeEmployees = employees.filter(emp => emp.active === true);

  const availableBatches = batches.filter(batch => {
    if (batch.vaccineId !== formData.vaccineId) return false;
    if (batch.remainingQuantity <= 0) return false;
    
    // Verificar se o lote está vencido
    const expirationDate = new Date(batch.expirationDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return expirationDate >= today;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientId || !formData.vaccineId || !formData.batchId || !formData.employeeId) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Data e hora atuais no formato ISO
      const dataHoraAtual = new Date().toISOString();
      
      // Primeiro, salvar a aplicação no banco
      const { error: aplicacaoError } = await supabase
        .from('aplicacao')
        .insert({
          cliente_cpf: formData.clientId,
          funcionario_idfuncionario: parseInt(formData.employeeId),
          agendamento_idagendamento: null, // Aplicação sem agendamento prévio
          dataaplicacao: dataHoraAtual,
          dose: formData.doseNumber,
          observacoes: formData.notes || null,
        });

      if (aplicacaoError) throw aplicacaoError;

      // O estoque é atualizado automaticamente pelo trigger ao inserir a aplicação
      
      const vaccination: Omit<VaccinationRecord, 'id' | 'createdAt'> = {
        ...formData,
        appliedBy: formData.employeeId,
        applicationDate: dataHoraAtual,
        nextDueDate: formData.nextDueDate ? new Date(formData.nextDueDate).toISOString() : '',
      };

      onSave(vaccination);
      onOpenChange(false);
      setFormData({
        clientId: '',
        vaccineId: '',
        batchId: '',
        employeeId: '',
        doseNumber: 1,
        nextDueDate: '',
        notes: '',
      });
      
      toast({
        title: "Vacina aplicada",
        description: "A vacinação foi registrada com sucesso no banco de dados.",
      });
    } catch (error: any) {
      console.error('Erro ao aplicar vacina:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível registrar a vacinação.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Aplicar Vacina</DialogTitle>
          <DialogDescription>
            Registre a aplicação de uma vacina para um cliente.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="client">Cliente *</Label>
              <Select value={formData.clientId} onValueChange={(value) => setFormData({ ...formData, clientId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} - {client.cpf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="employee">Vacinador *</Label>
              <Select value={formData.employeeId} onValueChange={(value) => setFormData({ ...formData, employeeId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o vacinador" />
                </SelectTrigger>
                <SelectContent>
                  {activeEmployees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name} - {employee.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="vaccine">Vacina *</Label>
              <Select 
                value={formData.vaccineId} 
                onValueChange={(value) => setFormData({ ...formData, vaccineId: value, batchId: '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a vacina" />
                </SelectTrigger>
                <SelectContent>
                  {vaccines.map((vaccine) => (
                    <SelectItem key={vaccine.id} value={vaccine.id}>
                      {vaccine.name} - {vaccine.manufacturer}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="batch">Lote *</Label>
              <Select 
                value={formData.batchId} 
                onValueChange={(value) => setFormData({ ...formData, batchId: value })}
                disabled={!formData.vaccineId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o lote" />
                </SelectTrigger>
                <SelectContent>
                  {availableBatches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.batchNumber} - {batch.remainingQuantity} doses
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="doseNumber">Número da Dose</Label>
              <Input
                id="doseNumber"
                type="number"
                min="1"
                value={formData.doseNumber}
                onChange={(e) => setFormData({ ...formData, doseNumber: parseInt(e.target.value) })}
              />
            </div>
            
            <div>
              <Label htmlFor="nextDueDate">Próxima Dose (opcional)</Label>
              <Input
                id="nextDueDate"
                type="date"
                value={formData.nextDueDate}
                onChange={(e) => setFormData({ ...formData, nextDueDate: e.target.value })}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observações sobre a aplicação"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="medical-gradient text-white">
              Aplicar Vacina
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};