import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MaskedInput } from '@/components/ui/masked-input';
import { Client } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { clienteSchema, formatCPF, formatTelefone } from '@/lib/validations';

interface ClientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client;
  onSave: (client: Omit<Client, 'id' | 'createdAt'>) => void;
}

export const ClientForm: React.FC<ClientFormProps> = ({
  open,
  onOpenChange,
  client,
  onSave,
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    dateOfBirth: '',
    phone: '',
    email: '',
    address: '',
    allergies: '',
    observations: '',
    status: 'ATIVO' as 'ATIVO' | 'INATIVO',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Update form data when client prop changes
  React.useEffect(() => {
    if (client) {
      setFormData({
        name: client.name,
        cpf: client.cpf,
        dateOfBirth: client.dateOfBirth,
        phone: client.phone,
        email: client.email,
        address: client.address || '',
        allergies: client.allergies || '',
        observations: client.observations || '',
        status: 'ATIVO',
      });
    } else {
      setFormData({
        name: '',
        cpf: '',
        dateOfBirth: '',
        phone: '',
        email: '',
        address: '',
        allergies: '',
        observations: '',
        status: 'ATIVO',
      });
    }
    // Limpa erros ao fechar dialog
    if (!open) {
      setFieldErrors({});
    }
  }, [client, open]);

  const clearFieldError = (fieldName: string) => {
    if (fieldErrors[fieldName]) {
      const { [fieldName]: _, ...rest } = fieldErrors;
      setFieldErrors(rest);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Limpa CPF e telefone (remove máscara)
    const cleanedData = {
      ...formData,
      cpf: formatCPF(formData.cpf),
      phone: formatTelefone(formData.phone),
    };

    // Validação com Zod
    try {
      clienteSchema.parse(cleanedData);
      setFieldErrors({});
    } catch (error: any) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err: any) => {
        const field = err.path[0] as string;
        errors[field] = err.message;
      });
      setFieldErrors(errors);
      
      toast({
        title: "⚠ Atenção - Campos inválidos",
        description: `Corrija os ${error.errors.length} campo(s) destacado(s) em vermelho.`,
        variant: "default",
      });
      return;
    }

    onSave(cleanedData);
    onOpenChange(false);
    setFormData({
      name: '',
      cpf: '',
      dateOfBirth: '',
      phone: '',
      email: '',
      address: '',
      allergies: '',
      observations: '',
      status: 'ATIVO',
    });
    
    toast({
      title: client ? "Cliente atualizado" : "Cliente cadastrado",
      description: client ? "As informações foram atualizadas com sucesso." : "Novo cliente foi cadastrado com sucesso.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{client ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
          <DialogDescription>
            {client ? 'Atualize as informações do cliente.' : 'Cadastre um novo cliente no sistema.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className={fieldErrors.name ? 'text-red-500' : ''}>
                Nome Completo *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  clearFieldError('name');
                }}
                className={fieldErrors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}
                placeholder="Digite o nome completo"
                required
              />
              {fieldErrors.name && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <span>⚠</span> {fieldErrors.name}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="cpf" className={fieldErrors.cpf ? 'text-red-500' : ''}>
                CPF *
              </Label>
              <MaskedInput
                mask="999.999.999-99"
                id="cpf"
                value={formData.cpf}
                onChange={(e) => {
                  setFormData({ ...formData, cpf: e.target.value });
                  clearFieldError('cpf');
                }}
                className={fieldErrors.cpf ? 'border-red-500 focus-visible:ring-red-500' : ''}
                placeholder="000.000.000-00"
                required
                disabled={!!client}
              />
              {fieldErrors.cpf && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <span>⚠</span> {fieldErrors.cpf}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="dateOfBirth" className={fieldErrors.dateOfBirth ? 'text-red-500' : ''}>
                Data de Nascimento *
              </Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => {
                  setFormData({ ...formData, dateOfBirth: e.target.value });
                  clearFieldError('dateOfBirth');
                }}
                className={fieldErrors.dateOfBirth ? 'border-red-500 focus-visible:ring-red-500' : ''}
                required
              />
              {fieldErrors.dateOfBirth && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <span>⚠</span> {fieldErrors.dateOfBirth}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="phone" className={fieldErrors.phone ? 'text-red-500' : ''}>
                Telefone *
              </Label>
              <MaskedInput
                mask="(99) 99999-9999"
                id="phone"
                value={formData.phone}
                onChange={(e) => {
                  setFormData({ ...formData, phone: e.target.value });
                  clearFieldError('phone');
                }}
                className={fieldErrors.phone ? 'border-red-500 focus-visible:ring-red-500' : ''}
                placeholder="(00) 00000-0000"
                required
              />
              {fieldErrors.phone && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <span>⚠</span> {fieldErrors.phone}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="email" className={fieldErrors.email ? 'text-red-500' : ''}>
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  clearFieldError('email');
                }}
                className={fieldErrors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}
                placeholder="email@exemplo.com"
              />
              {fieldErrors.email && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <span>⚠</span> {fieldErrors.email}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Rua, número, bairro"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="allergies">Alergias</Label>
            <Textarea
              id="allergies"
              value={formData.allergies}
              onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
              placeholder="Descreva alergias conhecidas"
              rows={2}
            />
          </div>
          
          <div>
            <Label htmlFor="observations">Observações</Label>
            <Textarea
              id="observations"
              value={formData.observations}
              onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
              placeholder="Observações adicionais"
              rows={2}
            />
          </div>
          
          <div className="flex items-center gap-4">
            <Label htmlFor="status">Status:</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value: 'ATIVO' | 'INATIVO') => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ATIVO">Ativo</SelectItem>
                <SelectItem value="INATIVO">Inativo</SelectItem>
              </SelectContent>
            </Select>
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
              {client ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};