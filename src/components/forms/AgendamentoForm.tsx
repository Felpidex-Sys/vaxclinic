import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Client, Vaccine, User, Agendamento } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface AgendamentoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
  vaccines: Vaccine[];
  employees: User[];
  onSave: (agendamento: Omit<Agendamento, 'id' | 'criadoEm'>) => void;
  currentUserId: string;
  editingAgendamento?: Agendamento | null;
}

export const AgendamentoForm: React.FC<AgendamentoFormProps> = ({
  open,
  onOpenChange,
  clients,
  vaccines,
  employees,
  onSave,
  currentUserId,
  editingAgendamento,
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    pacienteId: editingAgendamento?.pacienteId || '',
    funcionarioId: editingAgendamento?.funcionarioId || currentUserId,
    vacinaId: editingAgendamento?.vacinaId || '',
    dataHora: editingAgendamento?.dataHora.split('T')[0] + 'T' + editingAgendamento?.dataHora.split('T')[1].slice(0, 5) || '',
    observacoes: editingAgendamento?.observacoes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.pacienteId || !formData.vacinaId || !formData.dataHora) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const agendamento: Omit<Agendamento, 'id' | 'criadoEm'> = {
      ...formData,
      dataHora: new Date(formData.dataHora).toISOString(),
      status: 'Agendado',
    };

    onSave(agendamento);
    onOpenChange(false);
    setFormData({
      pacienteId: '',
      funcionarioId: currentUserId,
      vacinaId: '',
      dataHora: '',
      observacoes: '',
    });
    
    toast({
      title: editingAgendamento ? "Agendamento atualizado" : "Agendamento criado",
      description: editingAgendamento 
        ? "O agendamento foi atualizado com sucesso."
        : "O agendamento foi criado com sucesso.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editingAgendamento ? 'Editar Agendamento' : 'Novo Agendamento'}
          </DialogTitle>
          <DialogDescription>
            {editingAgendamento 
              ? 'Atualize as informações do agendamento.'
              : 'Crie um novo agendamento de vacinação.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cliente">Cliente *</Label>
              <Select 
                value={formData.pacienteId} 
                onValueChange={(value) => setFormData({ ...formData, pacienteId: value })}
              >
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
              <Label htmlFor="vacina">Vacina *</Label>
              <Select 
                value={formData.vacinaId} 
                onValueChange={(value) => setFormData({ ...formData, vacinaId: value })}
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
              <Label htmlFor="funcionario">Funcionário *</Label>
              <Select 
                value={formData.funcionarioId} 
                onValueChange={(value) => setFormData({ ...formData, funcionarioId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o funcionário" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name} - {employee.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="dataHora">Data e Hora *</Label>
              <Input
                id="dataHora"
                type="datetime-local"
                value={formData.dataHora}
                onChange={(e) => setFormData({ ...formData, dataHora: e.target.value })}
                required
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Observações sobre o agendamento"
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
              {editingAgendamento ? 'Atualizar' : 'Criar'} Agendamento
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};