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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const batchSchema = z.object({
  vacina_idvacina: z.number().min(1, 'Selecione uma vacina'),
  codigolote: z.string().min(1, 'Código do lote é obrigatório'),
  quantidadeinicial: z.number().min(1, 'Quantidade deve ser no mínimo 1'),
  datavalidade: z.string().min(1, 'Data de validade é obrigatória'),
  precocompra: z.number().min(0, 'Preço de compra deve ser maior ou igual a 0'),
  precovenda: z.number().min(0, 'Preço de venda deve ser maior ou igual a 0'),
});

type BatchFormData = z.infer<typeof batchSchema>;

interface BatchFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vaccines: Array<{ id: string; name: string; manufacturer?: string }>;
  preselectedVaccineId?: string;
  batch?: {
    numlote: number;
    vacina_idvacina: number;
    codigolote: string;
    quantidadeinicial: number;
    quantidadedisponivel: number;
    datavalidade: string;
    precocompra?: number;
    precovenda?: number;
  };
  onSave: (data: BatchFormData) => Promise<void>;
}

export const BatchForm: React.FC<BatchFormProps> = ({
  open,
  onOpenChange,
  vaccines,
  preselectedVaccineId,
  batch,
  onSave,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BatchFormData>({
    resolver: zodResolver(batchSchema),
  });

  const vaccineId = watch('vacina_idvacina');

  useEffect(() => {
    if (batch) {
      setValue('vacina_idvacina', batch.vacina_idvacina);
      setValue('codigolote', batch.codigolote);
      setValue('quantidadeinicial', batch.quantidadeinicial);
      setValue('datavalidade', batch.datavalidade);
      setValue('precocompra', batch.precocompra || 0);
      setValue('precovenda', batch.precovenda || 0);
    } else {
      reset();
      // Se tiver vacina pré-selecionada, preencher
      if (preselectedVaccineId) {
        setValue('vacina_idvacina', parseInt(preselectedVaccineId));
      }
    }
  }, [batch, preselectedVaccineId, setValue, reset]);

  const onSubmit = async (data: BatchFormData) => {
    await onSave(data);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {batch ? 'Editar Lote' : 'Novo Lote'}
          </DialogTitle>
          <DialogDescription>
            {batch
              ? 'Atualize as informações do lote'
              : 'Preencha os dados para cadastrar um novo lote de vacina'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vacina">Vacina *</Label>
            <Select
              value={vaccineId?.toString()}
              onValueChange={(value) => setValue('vacina_idvacina', parseInt(value))}
              disabled={!!batch || !!preselectedVaccineId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a vacina" />
              </SelectTrigger>
              <SelectContent>
                {vaccines.map((vaccine) => (
                  <SelectItem key={vaccine.id} value={vaccine.id}>
                    {vaccine.name}{vaccine.manufacturer ? ` - ${vaccine.manufacturer}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.vacina_idvacina && (
              <p className="text-sm text-destructive">{errors.vacina_idvacina.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="codigolote">Código do Lote *</Label>
            <Input
              id="codigolote"
              {...register('codigolote')}
              placeholder="Ex: LOT2024001"
            />
            {errors.codigolote && (
              <p className="text-sm text-destructive">{errors.codigolote.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantidadeinicial">Quantidade Inicial *</Label>
            <Input
              id="quantidadeinicial"
              type="number"
              min="1"
              {...register('quantidadeinicial', { valueAsNumber: true })}
              placeholder="Ex: 100"
              disabled={!!batch}
            />
            {errors.quantidadeinicial && (
              <p className="text-sm text-destructive">{errors.quantidadeinicial.message}</p>
            )}
            {batch && (
              <p className="text-sm text-muted-foreground">
                Quantidade disponível: {batch.quantidadedisponivel}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="datavalidade">Data de Validade *</Label>
            <Input
              id="datavalidade"
              type="date"
              {...register('datavalidade')}
            />
            {errors.datavalidade && (
              <p className="text-sm text-destructive">{errors.datavalidade.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="precocompra">Preço de Compra (R$) *</Label>
            <Input
              id="precocompra"
              type="number"
              step="0.01"
              min="0"
              {...register('precocompra', { valueAsNumber: true })}
              placeholder="Ex: 15.50"
              disabled={!!batch}
            />
            {errors.precocompra && (
              <p className="text-sm text-destructive">{errors.precocompra.message}</p>
            )}
            {batch && (
              <p className="text-sm text-muted-foreground">
                O preço de compra não pode ser alterado após o cadastro
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="precovenda">Preço de Venda (R$) *</Label>
            <Input
              id="precovenda"
              type="number"
              step="0.01"
              min="0"
              {...register('precovenda', { valueAsNumber: true })}
              placeholder="Ex: 25.00"
            />
            {errors.precovenda && (
              <p className="text-sm text-destructive">{errors.precovenda.message}</p>
            )}
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
              {isSubmitting ? 'Salvando...' : batch ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
