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
import { toBrasiliaISOString, getBrasiliaDate } from '@/lib/utils';

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const activeEmployees = employees.filter(emp => emp.active === true);

  const availableBatches = batches.filter(batch => {
    if (batch.vaccineId !== formData.vaccineId) return false;
    if (batch.remainingQuantity <= 0) return false;
    
    // Verificar se o lote está vencido (usando horário de Brasília)
    const expirationDate = new Date(batch.expirationDate);
    const today = getBrasiliaDate();
    today.setHours(0, 0, 0, 0);
    
    return expirationDate >= today;
  });

  // Limpa erros ao fechar dialog
  React.useEffect(() => {
    if (!open) {
      setFieldErrors({});
    }
  }, [open]);

  const clearFieldError = (fieldName: string) => {
    if (fieldErrors[fieldName]) {
      const { [fieldName]: _, ...rest } = fieldErrors;
      setFieldErrors(rest);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors: Record<string, string> = {};
    
    if (!formData.clientId) {
      errors.clientId = "Cliente é obrigatório";
    }
    if (!formData.vaccineId) {
      errors.vaccineId = "Vacina é obrigatória";
    }
    if (!formData.batchId) {
      errors.batchId = "Lote é obrigatório";
    }
    if (!formData.employeeId) {
      errors.employeeId = "Vacinador é obrigatório";
    }
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast({
        title: "⚠ Atenção - Campos obrigatórios",
        description: `Preencha os ${Object.keys(errors).length} campo(s) destacado(s).`,
        variant: "default",
      });
      return;
    }
    
    // Buscar dados da vacina para verificar intervalo entre doses
    const selectedVaccine = vaccines.find(v => v.id === formData.vaccineId);
    const intervaloDoses = selectedVaccine?.dosesRequired > 1 ? (selectedVaccine as any).intervalodoses : 0;

    // Validar se a data da próxima dose é futura E respeita o intervalo
    if (formData.nextDueDate) {
      const nextDate = new Date(formData.nextDueDate);
      const today = getBrasiliaDate();
      today.setHours(0, 0, 0, 0);
      
      if (nextDate <= today) {
        toast({
          title: "⚠ Data inválida",
          description: "A data da próxima dose deve ser uma data futura.",
          variant: "default",
        });
        return;
      }
      
      // Validar intervalo mínimo entre doses
      if (intervaloDoses && intervaloDoses > 0) {
        const dataMinima = new Date(today);
        dataMinima.setDate(dataMinima.getDate() + intervaloDoses);
        
        if (nextDate < dataMinima) {
          toast({
            title: "⚠ Intervalo inválido",
            description: `Esta vacina requer um intervalo mínimo de ${intervaloDoses} dias entre as doses. A próxima dose deve ser agendada a partir de ${dataMinima.toLocaleDateString('pt-BR')}.`,
            variant: "default",
          });
          return;
        }
      }
    }
    
    setFieldErrors({});

    try {
      // Data e hora atuais no formato ISO (horário de Brasília)
      const dataHoraAtual = toBrasiliaISOString();
      
      // Buscar os preços atuais do lote selecionado
      const { data: loteData, error: loteError } = await supabase
        .from('lote')
        .select('precocompra, precovenda, quantidadeinicial')
        .eq('numlote', parseInt(formData.batchId))
        .single();

      if (loteError) throw loteError;

      // Calcular custo unitário por dose
      const custoUnitario = loteData.precocompra / loteData.quantidadeinicial;
      
      // Primeiro, salvar a aplicação no banco com os preços históricos
      const { error: aplicacaoError } = await supabase
        .from('aplicacao')
        .insert({
          cliente_cpf: formData.clientId,
          funcionario_idfuncionario: parseInt(formData.employeeId),
          agendamento_idagendamento: null, // Aplicação sem agendamento prévio
          lote_numlote: parseInt(formData.batchId), // Salvar referência ao lote
          dataaplicacao: dataHoraAtual,
          dose: formData.doseNumber,
          observacoes: formData.notes || null,
          precocompra: custoUnitario,
          precovenda: loteData.precovenda,
        });

      if (aplicacaoError) throw aplicacaoError;

      // Se foi informada uma data para a próxima dose, criar agendamento automático
      let agendamentoCriado = false;
      if (formData.nextDueDate) {
        // Converter a data para o formato correto (incluir hora)
        const nextDoseDate = new Date(formData.nextDueDate);
        nextDoseDate.setHours(9, 0, 0, 0); // Agendar para 9h da manhã por padrão
        const nextDoseDateISO = toBrasiliaISOString(nextDoseDate);
        
        // Buscar lote disponível da mesma vacina
        const { data: batchData } = await supabase
          .from('lote')
          .select('quantidadedisponivel, numlote')
          .eq('vacina_idvacina', parseInt(formData.vaccineId))
          .gt('quantidadedisponivel', 0)
          .gte('datavalidade', nextDoseDateISO)
          .order('datavalidade', { ascending: false })
          .limit(1)
          .single();
        
        // Se houver lote disponível, criar o agendamento
        if (batchData) {
          const { error: agendamentoError } = await supabase
            .from('agendamento')
            .insert({
              cliente_cpf: formData.clientId,
              lote_numlote: batchData.numlote,
              dataagendada: nextDoseDateISO,
              funcionario_idfuncionario: null, // Deixar null para ser atribuído depois
              observacoes: `Agendamento automático para dose ${formData.doseNumber + 1}. Criado após aplicação da dose ${formData.doseNumber}.`,
              status: 'AGENDADO'
            });
          
          if (!agendamentoError) {
            agendamentoCriado = true;
            toast({
              title: "Agendamento criado",
              description: `Próxima dose (${formData.doseNumber + 1}) agendada para ${new Date(formData.nextDueDate).toLocaleDateString('pt-BR')}.`,
              variant: "default",
            });
          } else {
            console.warn('Erro ao criar agendamento automático:', agendamentoError);
          }
        } else {
          // Se não houver lote disponível, apenas avisar
          toast({
            title: "⚠ Atenção",
            description: "Vacina aplicada, mas não há lotes disponíveis para agendar a próxima dose. Cadastre um novo lote.",
            variant: "default",
          });
        }
      }

      // O estoque é atualizado automaticamente pelo trigger ao inserir a aplicação
      
      const vaccination: Omit<VaccinationRecord, 'id' | 'createdAt'> = {
        ...formData,
        appliedBy: formData.employeeId,
        applicationDate: dataHoraAtual,
        nextDueDate: formData.nextDueDate ? toBrasiliaISOString(formData.nextDueDate) : '',
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
        description: agendamentoCriado 
          ? `Vacinação registrada e próxima dose (${formData.doseNumber + 1}) agendada automaticamente!`
          : "A vacinação foi registrada com sucesso no banco de dados.",
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
              <Label htmlFor="client" className={fieldErrors.clientId ? 'text-red-500' : ''}>
                Cliente *
              </Label>
              <Select 
                value={formData.clientId} 
                onValueChange={(value) => {
                  setFormData({ ...formData, clientId: value });
                  clearFieldError('clientId');
                }}
              >
                <SelectTrigger className={fieldErrors.clientId ? 'border-red-500' : ''}>
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
              {fieldErrors.clientId && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <span>⚠</span> {fieldErrors.clientId}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="employee" className={fieldErrors.employeeId ? 'text-red-500' : ''}>
                Vacinador *
              </Label>
              <Select 
                value={formData.employeeId} 
                onValueChange={(value) => {
                  setFormData({ ...formData, employeeId: value });
                  clearFieldError('employeeId');
                }}
              >
                <SelectTrigger className={fieldErrors.employeeId ? 'border-red-500' : ''}>
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
              {fieldErrors.employeeId && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <span>⚠</span> {fieldErrors.employeeId}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="vaccine" className={fieldErrors.vaccineId ? 'text-red-500' : ''}>
                Vacina *
              </Label>
              <Select 
                value={formData.vaccineId} 
                onValueChange={(value) => {
                  setFormData({ ...formData, vaccineId: value, batchId: '' });
                  clearFieldError('vaccineId');
                }}
              >
                <SelectTrigger className={fieldErrors.vaccineId ? 'border-red-500' : ''}>
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
              {fieldErrors.vaccineId && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <span>⚠</span> {fieldErrors.vaccineId}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="batch" className={fieldErrors.batchId ? 'text-red-500' : ''}>
                Lote *
              </Label>
              <Select 
                value={formData.batchId} 
                onValueChange={(value) => {
                  setFormData({ ...formData, batchId: value });
                  clearFieldError('batchId');
                }}
                disabled={!formData.vaccineId}
              >
                <SelectTrigger className={fieldErrors.batchId ? 'border-red-500' : ''}>
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
              {fieldErrors.batchId && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <span>⚠</span> {fieldErrors.batchId}
                </p>
              )}
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
            <Label htmlFor="nextDueDate" className="flex items-center gap-2">
              Próxima Dose (opcional)
              <span className="text-xs text-muted-foreground">
                {(() => {
                  const selectedVaccine = vaccines.find(v => v.id === formData.vaccineId);
                  const intervaloDoses = selectedVaccine?.dosesRequired > 1 ? (selectedVaccine as any).intervalodoses : 0;
                  return intervaloDoses > 0 
                    ? `📅 Intervalo mínimo: ${intervaloDoses} dias`
                    : 'Se informado, um agendamento será criado automaticamente';
                })()}
              </span>
            </Label>
            <Input
              id="nextDueDate"
              type="date"
              value={formData.nextDueDate}
              onChange={(e) => setFormData({ ...formData, nextDueDate: e.target.value })}
              min={(() => {
                const selectedVaccine = vaccines.find(v => v.id === formData.vaccineId);
                const intervaloDoses = selectedVaccine?.dosesRequired > 1 ? (selectedVaccine as any).intervalodoses : 0;
                
                if (intervaloDoses && intervaloDoses > 0) {
                  const today = new Date();
                  today.setDate(today.getDate() + intervaloDoses);
                  return today.toISOString().split('T')[0];
                }
                
                return new Date().toISOString().split('T')[0];
              })()}
              disabled={!formData.vaccineId}
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