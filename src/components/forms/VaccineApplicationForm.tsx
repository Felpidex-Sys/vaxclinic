import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Client, Vaccine, VaccineBatch, VaccinationRecord } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VaccineApplicationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
  vaccines: Vaccine[];
  batches: VaccineBatch[];
  onSave: (vaccination: Omit<VaccinationRecord, 'id' | 'createdAt'>) => void;
  appliedBy: string;
}

export const VaccineApplicationForm: React.FC<VaccineApplicationFormProps> = ({
  open,
  onOpenChange,
  clients,
  vaccines,
  batches,
  onSave,
  appliedBy,
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    clientId: '',
    vaccineId: '',
    batchId: '',
    doseNumber: 1,
    applicationDate: new Date().toISOString().split('T')[0],
    nextDueDate: '',
    notes: '',
  });

  const availableBatches = batches.filter(
    batch => batch.vaccineId === formData.vaccineId && batch.remainingQuantity > 0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientId || !formData.vaccineId || !formData.batchId) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Primeiro, salvar a aplicação no banco
      const { error: aplicacaoError } = await supabase
        .from('aplicacao')
        .insert({
          cliente_cpf: formData.clientId,
          funcionario_idfuncionario: parseInt(appliedBy),
          agendamento_idagendamento: null, // Aplicação sem agendamento prévio
          dataaplicacao: formData.applicationDate,
          dose: formData.doseNumber,
          observacoes: formData.notes || null,
        });

      if (aplicacaoError) throw aplicacaoError;

      // Atualizar o estoque do lote
      // Buscar a quantidade atual
      const { data: loteAtual, error: loteSelectError } = await supabase
        .from('lote')
        .select('quantidadedisponivel')
        .eq('numlote', parseInt(formData.batchId))
        .single();

      if (loteSelectError) throw loteSelectError;

      // Atualizar com a nova quantidade
      const { error: updateError } = await supabase
        .from('lote')
        .update({ quantidadedisponivel: (loteAtual?.quantidadedisponivel || 1) - 1 })
        .eq('numlote', parseInt(formData.batchId));
      
      if (updateError) throw updateError;

      const vaccination: Omit<VaccinationRecord, 'id' | 'createdAt'> = {
        ...formData,
        appliedBy,
        applicationDate: new Date(formData.applicationDate).toISOString(),
        nextDueDate: formData.nextDueDate ? new Date(formData.nextDueDate).toISOString() : '',
      };

      onSave(vaccination);
      onOpenChange(false);
      setFormData({
        clientId: '',
        vaccineId: '',
        batchId: '',
        doseNumber: 1,
        applicationDate: new Date().toISOString().split('T')[0],
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
              <Label htmlFor="applicationDate">Data de Aplicação *</Label>
              <Input
                id="applicationDate"
                type="date"
                value={formData.applicationDate}
                onChange={(e) => setFormData({ ...formData, applicationDate: e.target.value })}
                required
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