import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Agendamento, Client, Lote, User as UserType, Vacina } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'react-router-dom';
import { getBrasiliaDate } from '@/lib/utils';

interface AgendamentoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
  batches: Lote[];
  employees: UserType[];
  vaccines: Vacina[];
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
  vaccines,
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

  const [selectedVacinaId, setSelectedVacinaId] = useState<number | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingAgendamento) {
      setFormData({
        Cliente_CPF: editingAgendamento.Cliente_CPF,
        Lote_numLote: editingAgendamento.Lote_numLote,
        dataAgendada: editingAgendamento.dataAgendada.split('T')[0] + 'T' + editingAgendamento.dataAgendada.split('T')[1].slice(0, 5),
        observacoes: editingAgendamento.observacoes || '',
      });

      // Pré-seleciona a vacina com base no lote do agendamento
      const lote = batches.find(b => b.numLote === editingAgendamento.Lote_numLote);
      setSelectedVacinaId(lote?.Vacina_idVacina ?? null);
    } else {
      // Vindo da rota de Clientes com CPF preselecionado
      if (location.state?.clientCPF) {
        setFormData(prev => ({
          ...prev,
          Cliente_CPF: parseInt(location.state.clientCPF.replace(/\D/g, '')),
        }));
      }
      setSelectedVacinaId(null);
    }
  }, [editingAgendamento, location.state, batches]);

  // Limpa erros ao fechar dialog
  useEffect(() => {
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

  const isLoteValido = (lote: Lote) => {
    // Considera válido até o fim do dia de validade em Brasília
    const hojeBrt = getBrasiliaDate();
    const validadeFim = new Date(`${lote.dataValidade}T23:59:59-03:00`);
    return validadeFim >= hojeBrt;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors: Record<string, string> = {};
    
    if (!formData.Cliente_CPF) {
      errors.Cliente_CPF = "Cliente é obrigatório";
    }
    if (!formData.Lote_numLote) {
      errors.Lote_numLote = "Lote é obrigatório";
    }
    if (!formData.dataAgendada) {
      errors.dataAgendada = "Data do agendamento é obrigatória";
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
    
    setFieldErrors({});

    const localTimestamp = formData.dataAgendada.length === 16
      ? `${formData.dataAgendada}:00`
      : formData.dataAgendada;

    const agendamento: Omit<Agendamento, 'idAgendamento'> = {
      Cliente_CPF: formData.Cliente_CPF,
      Funcionario_idFuncionario: null,
      Lote_numLote: formData.Lote_numLote,
      dataAgendada: localTimestamp, // salva como horário local (sem timezone)
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
    setSelectedVacinaId(null);
    
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
              <Label htmlFor="cliente" className={fieldErrors.Cliente_CPF ? 'text-red-500' : ''}>
                Cliente *
              </Label>
              <Select 
                value={formData.Cliente_CPF > 0 ? formData.Cliente_CPF.toString() : ""} 
                onValueChange={(value) => {
                  setFormData({ ...formData, Cliente_CPF: parseInt(value) });
                  clearFieldError('Cliente_CPF');
                }}
              >
                <SelectTrigger className={fieldErrors.Cliente_CPF ? 'border-red-500' : ''}>
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
              {fieldErrors.Cliente_CPF && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <span>⚠</span> {fieldErrors.Cliente_CPF}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="vacina">Vacina *</Label>
              <Select
                value={selectedVacinaId ? selectedVacinaId.toString() : ""}
                onValueChange={(value) => {
                  setSelectedVacinaId(parseInt(value));
                  setFormData({ ...formData, Lote_numLote: 0 });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a vacina" />
                </SelectTrigger>
                <SelectContent>
                  {vaccines.map((vac) => (
                    <SelectItem key={vac.idVacina} value={vac.idVacina.toString()}>
                      {vac.nome}{vac.fabricante ? ` - ${vac.fabricante}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="lote" className={fieldErrors.Lote_numLote ? 'text-red-500' : ''}>
                Lote da Vacina *
              </Label>
              <Select 
                value={formData.Lote_numLote > 0 ? formData.Lote_numLote.toString() : ""} 
                onValueChange={(value) => {
                  setFormData({ ...formData, Lote_numLote: parseInt(value) });
                  clearFieldError('Lote_numLote');
                }}
              >
                <SelectTrigger className={fieldErrors.Lote_numLote ? 'border-red-500' : ''}>
                  <SelectValue placeholder={selectedVacinaId ? "Selecione o lote" : "Selecione a vacina primeiro"} />
                </SelectTrigger>
                <SelectContent>
                  {batches
                    .filter(b => selectedVacinaId ? b.Vacina_idVacina === selectedVacinaId : false)
                    .filter(b => b.quantidadeDisponivel > 0 && isLoteValido(b))
                    .map((batch) => (
                      <SelectItem key={batch.numLote} value={batch.numLote.toString()}>
                        {batch.codigoLote} - {batch.quantidadeDisponivel} doses disponíveis (Val: {batch.dataValidade})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {fieldErrors.Lote_numLote && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <span>⚠</span> {fieldErrors.Lote_numLote}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="dataAgendada" className={fieldErrors.dataAgendada ? 'text-red-500' : ''}>
                Data e Hora *
              </Label>
              <Input
                id="dataAgendada"
                type="datetime-local"
                value={formData.dataAgendada}
                onChange={(e) => {
                  setFormData({ ...formData, dataAgendada: e.target.value });
                  clearFieldError('dataAgendada');
                }}
                className={fieldErrors.dataAgendada ? 'border-red-500 focus-visible:ring-red-500' : ''}
                required
              />
              {fieldErrors.dataAgendada && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <span>⚠</span> {fieldErrors.dataAgendada}
                </p>
              )}
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