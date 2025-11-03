import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Agendamento, Client, Lote, User as UserType } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'react-router-dom';

interface AgendamentoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
  batches: Lote[];
  employees: UserType[];
  onSave: (agendamento: Omit<Agendamento, 'idAgendamento'>) => void;
  currentUserId: string;
  editingAgendamento?: Agendamento | null;
}

export const AgendamentoForm: React.FC<AgendamentoFormProps> = ({
  open,
  onOpenChange,
  clients,
  batches,
  employees,
  onSave,
  currentUserId,
  editingAgendamento,
}) => {
  const { toast } = useToast();
  const location = useLocation();
  const [formData, setFormData] = useState({
    Cliente_CPF: editingAgendamento?.Cliente_CPF || 0,
    Lote_numLote: editingAgendamento?.Lote_numLote || 0,
    dataAgendada: editingAgendamento?.dataAgendada ? editingAgendamento.dataAgendada.split('T')[0] + 'T' + editingAgendamento.dataAgendada.split('T')[1].slice(0, 5) : '',
    observacoes: editingAgendamento?.observacoes || '',
  });

  useEffect(() => {
    if (editingAgendamento) {
      setFormData({
        Cliente_CPF: editingAgendamento.Cliente_CPF,
        Lote_numLote: editingAgendamento.Lote_numLote,
        dataAgendada: editingAgendamento.dataAgendada.split('T')[0] + 'T' + editingAgendamento.dataAgendada.split('T')[1].slice(0, 5),
        observacoes: editingAgendamento.observacoes || '',
      });
    } else if (location.state?.clientCPF) {
      setFormData(prev => ({
        ...prev,
        Cliente_CPF: parseInt(location.state.clientCPF.replace(/\D/g, '')),
      }));
    }
  }, [editingAgendamento, location.state]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.Cliente_CPF || !formData.Lote_numLote || !formData.dataAgendada) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const agendamento: Omit<Agendamento, 'idAgendamento'> = {
      Cliente_CPF: formData.Cliente_CPF,
      Funcionario_idFuncionario: null,
      Lote_numLote: formData.Lote_numLote,
      dataAgendada: new Date(formData.dataAgendada).toISOString(),
      status: 'AGENDADO',
      observacoes: formData.observacoes,
    };

    onSave(agendamento);
    onOpenChange(false);
    setFormData({
      Cliente_CPF: 0,
      Lote_numLote: 0,
      dataAgendada: '',
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
                value={formData.Cliente_CPF > 0 ? formData.Cliente_CPF.toString() : ""} 
                onValueChange={(value) => setFormData({ ...formData, Cliente_CPF: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.cpf}>
                      {client.name} - {client.cpf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="lote">Lote da Vacina *</Label>
              <Select 
                value={formData.Lote_numLote > 0 ? formData.Lote_numLote.toString() : ""} 
                onValueChange={(value) => setFormData({ ...formData, Lote_numLote: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o lote" />
                </SelectTrigger>
                <SelectContent>
                  {batches.filter(b => b.quantidadeDisponivel > 0).map((batch) => (
                    <SelectItem key={batch.numLote} value={batch.numLote.toString()}>
                      {batch.codigoLote} - {batch.quantidadeDisponivel} doses disponíveis
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="dataAgendada">Data e Hora *</Label>
              <Input
                id="dataAgendada"
                type="datetime-local"
                value={formData.dataAgendada}
                onChange={(e) => setFormData({ ...formData, dataAgendada: e.target.value })}
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