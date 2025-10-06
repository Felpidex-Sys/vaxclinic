import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const vaccineSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  fabricante: z.string().min(1, 'Fabricante é obrigatório'),
  categoria: z.string().min(1, 'Categoria é obrigatória'),
  descricao: z.string().optional(),
  quantidadedoses: z.number().min(1, 'Quantidade de doses deve ser no mínimo 1'),
  intervalodoses: z.number().optional(),
});

type VaccineFormData = z.infer<typeof vaccineSchema>;

interface VaccineFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vaccine?: {
    idvacina: number;
    nome: string;
    fabricante: string;
    categoria: string;
    descricao?: string;
    quantidadedoses?: number;
    intervalodoses?: number;
  };
  onSave: (data: VaccineFormData) => Promise<void>;
}

export const VaccineForm: React.FC<VaccineFormProps> = ({
  open,
  onOpenChange,
  vaccine,
  onSave,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<VaccineFormData>({
    resolver: zodResolver(vaccineSchema),
    defaultValues: {
      quantidadedoses: 1,
      intervalodoses: 0,
    },
  });

  const categoria = watch('categoria');

  useEffect(() => {
    if (vaccine) {
      setValue('nome', vaccine.nome);
      setValue('fabricante', vaccine.fabricante);
      setValue('categoria', vaccine.categoria);
      setValue('descricao', vaccine.descricao || '');
      setValue('quantidadedoses', vaccine.quantidadedoses || 1);
      setValue('intervalodoses', vaccine.intervalodoses || 0);
    } else {
      reset({
        quantidadedoses: 1,
        intervalodoses: 0,
      });
    }
  }, [vaccine, setValue, reset]);

  const onSubmit = async (data: VaccineFormData) => {
    await onSave(data);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {vaccine ? 'Editar Vacina' : 'Nova Vacina'}
          </DialogTitle>
          <DialogDescription>
            {vaccine
              ? 'Atualize as informações da vacina'
              : 'Preencha os dados para cadastrar uma nova vacina'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Vacina *</Label>
              <Input
                id="nome"
                {...register('nome')}
                placeholder="Ex: Coronavac"
              />
              {errors.nome && (
                <p className="text-sm text-destructive">{errors.nome.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fabricante">Fabricante *</Label>
              <Input
                id="fabricante"
                {...register('fabricante')}
                placeholder="Ex: Sinovac"
              />
              {errors.fabricante && (
                <p className="text-sm text-destructive">{errors.fabricante.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria *</Label>
            <Select
              value={categoria}
              onValueChange={(value) => setValue('categoria', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VIRAL">Viral</SelectItem>
                <SelectItem value="BACTERIANA">Bacteriana</SelectItem>
                <SelectItem value="OUTRA">Outra</SelectItem>
              </SelectContent>
            </Select>
            {errors.categoria && (
              <p className="text-sm text-destructive">{errors.categoria.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              {...register('descricao')}
              placeholder="Informações adicionais sobre a vacina"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantidadedoses">Quantidade de Doses *</Label>
              <Input
                id="quantidadedoses"
                type="number"
                min="1"
                {...register('quantidadedoses', { valueAsNumber: true })}
              />
              {errors.quantidadedoses && (
                <p className="text-sm text-destructive">{errors.quantidadedoses.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="intervalodoses">Intervalo entre Doses (dias)</Label>
              <Input
                id="intervalodoses"
                type="number"
                min="0"
                {...register('intervalodoses', { valueAsNumber: true })}
                placeholder="Ex: 21"
              />
              {errors.intervalodoses && (
                <p className="text-sm text-destructive">{errors.intervalodoses.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="medical-gradient text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Salvando...' : vaccine ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
