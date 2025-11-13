import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MaskedInput } from '@/components/ui/masked-input';
import { User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { funcionarioSchema, formatCPF } from '@/lib/validations';
import { z } from 'zod';

interface EmployeeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: User;
  onSave: (employee: any) => void;
}

export const EmployeeForm: React.FC<EmployeeFormProps> = ({
  open,
  onOpenChange,
  employee,
  onSave,
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpf: '',
    coren: '',
    active: true,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Update form data when employee prop changes
  React.useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name,
        email: employee.email,
        cpf: employee.cpf,
        coren: (employee as any).coren || '',
        active: employee.active,
      });
    } else {
      setFormData({
        name: '',
        email: '',
        cpf: '',
        coren: '',
        active: true,
      });
    }
    // Limpa erros ao fechar dialog
    if (!open) {
      setFieldErrors({});
    }
  }, [employee, open]);

  const clearFieldError = (fieldName: string) => {
    if (fieldErrors[fieldName]) {
      const { [fieldName]: _, ...rest } = fieldErrors;
      setFieldErrors(rest);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Limpa CPF (remove máscara)
    const cleanedData = {
      ...formData,
      cpf: formatCPF(formData.cpf),
    };

    // Validação com Zod
    try {
      funcionarioSchema.parse(cleanedData);
      setFieldErrors({});
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach(err => {
          const field = err.path[0] as string;
          errors[field] = err.message;
        });
        setFieldErrors(errors);
        
        toast({
          title: "⚠ Atenção - Campos inválidos",
          description: `Corrija os ${error.errors.length} campo(s) destacado(s) em vermelho.`,
          variant: "default",
        });
      }
      return;
    }

    onSave(cleanedData);
    onOpenChange(false);
    setFormData({
      name: '',
      email: '',
      cpf: '',
      coren: '',
      active: true,
    });
    
    toast({
      title: employee ? "Funcionário atualizado" : "Funcionário cadastrado",
      description: employee ? "As informações foram atualizadas com sucesso." : "Novo funcionário foi cadastrado com sucesso.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{employee ? 'Editar Funcionário' : 'Novo Funcionário'}</DialogTitle>
          <DialogDescription>
            {employee ? 'Atualize as informações do funcionário.' : 'Cadastre um novo funcionário no sistema.'}
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
              <Label htmlFor="email" className={fieldErrors.email ? 'text-red-500' : ''}>
                E-mail *
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
                required
              />
              {fieldErrors.email && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <span>⚠</span> {fieldErrors.email}
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
                disabled={!!employee}
              />
              {fieldErrors.cpf && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <span>⚠</span> {fieldErrors.cpf}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="coren" className={fieldErrors.coren ? 'text-red-500' : ''}>
                COREN
              </Label>
              <Input
                id="coren"
                value={formData.coren}
                onChange={(e) => {
                  setFormData({ ...formData, coren: e.target.value });
                  clearFieldError('coren');
                }}
                className={fieldErrors.coren ? 'border-red-500 focus-visible:ring-red-500' : ''}
                placeholder="123456-SP"
              />
              {fieldErrors.coren && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <span>⚠</span> {fieldErrors.coren}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Label htmlFor="active">Status:</Label>
            <Select 
              value={formData.active ? 'true' : 'false'} 
              onValueChange={(value) => setFormData({ ...formData, active: value === 'true' })}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Ativo</SelectItem>
                <SelectItem value="false">Inativo</SelectItem>
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
              {employee ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};