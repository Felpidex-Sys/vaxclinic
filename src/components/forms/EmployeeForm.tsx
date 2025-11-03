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
  }, [employee, open]);

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
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors?.[0]?.message || "Dados inválidos";
        toast({
          title: "Erro de validação",
          description: errorMessage,
          variant: "destructive",
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
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Digite o nome completo"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="cpf">CPF *</Label>
              <MaskedInput
                mask="999.999.999-99"
                id="cpf"
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                placeholder="000.000.000-00"
                required
                disabled={!!employee}
                className={!!employee ? 'opacity-60 cursor-not-allowed' : ''}
              />
            </div>
            
            <div>
              <Label htmlFor="coren">COREN</Label>
              <Input
                id="coren"
                value={formData.coren}
                onChange={(e) => setFormData({ ...formData, coren: e.target.value })}
                placeholder="123456-SP"
              />
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