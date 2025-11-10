import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { VaccineBatch } from '@/types';
import { format, parseISO } from 'date-fns';

interface BatchManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vaccine: {
    id: string;
    name: string;
  };
  batches: VaccineBatch[];
  onAddBatch: () => void;
  onEditBatch: (batch: VaccineBatch) => void;
  onDeleteBatch: (batchId: string) => void;
}

export const BatchManagementDialog: React.FC<BatchManagementDialogProps> = ({
  open,
  onOpenChange,
  vaccine,
  batches,
  onAddBatch,
  onEditBatch,
  onDeleteBatch,
}) => {
  const isExpiringSoon = (expirationDate: string) => {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return new Date(expirationDate) <= thirtyDaysFromNow;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Lotes - {vaccine.name}</DialogTitle>
          <DialogDescription>
            Adicione, edite ou remova lotes desta vacina
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Button
            onClick={onAddBatch}
            className="medical-gradient text-white w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Novo Lote
          </Button>

          {batches.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Nenhum lote cadastrado para esta vacina
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {batches.map((batch) => {
                const usagePercentage = ((batch.quantity - batch.remainingQuantity) / batch.quantity) * 100;
                const expiring = isExpiringSoon(batch.expirationDate);
                
                return (
                  <div
                    key={batch.id}
                    className={`p-4 border rounded-lg ${expiring ? 'border-orange-300 bg-orange-50' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">Lote: {batch.batchNumber}</h4>
                          {expiring && (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Vencendo
                            </Badge>
                          )}
                        </div>
                        
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p>
                            Validade: {format(parseISO(batch.expirationDate), 'dd/MM/yyyy')}
                          </p>
                          <p>
                            Disponível: {batch.remainingQuantity} / {batch.quantity} doses
                          </p>
                        </div>

                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div 
                            className="bg-medical-blue h-2 rounded-full" 
                            style={{ width: `${usagePercentage}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditBatch(batch)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Tem certeza que deseja excluir o lote ${batch.batchNumber}?`)) {
                              onDeleteBatch(batch.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
