import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Syringe, Calendar, FileText, AlertCircle } from 'lucide-react';
import { formatBrasiliaDateTime } from '@/lib/utils';

interface HistoricoAplicacao {
  idaplicacao: number;
  dataaplicacao: string;
  dose: number;
  cliente_nome: string;
  cliente_cpf: string;
  funcionario_nome: string;
  vacina_nome: string;
  fabricante: string;
  codigolote: string;
  reacoesadversas?: string;
  observacoes?: string;
  cliente_alergias?: string;
}

interface HistoricoDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: HistoricoAplicacao;
}

export const HistoricoDetailsDialog: React.FC<HistoricoDetailsDialogProps> = ({
  open,
  onOpenChange,
  record,
}) => {
  const formatDate = (dateString: string) => {
    return formatBrasiliaDateTime(dateString);
  };

  const getDoseBadgeColor = (dose: number) => {
    return 'bg-blue-100 text-blue-800 min-w-[70px] justify-center';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalhes da Aplicação #{record.idaplicacao}
          </DialogTitle>
          <DialogDescription>
            Informações completas sobre a vacinação realizada
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Seção Cliente */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <User className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-lg">Dados do Cliente</h3>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nome:</span>
                <span className="font-medium">{record.cliente_nome}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">CPF:</span>
                <span className="font-medium">{record.cliente_cpf}</span>
              </div>
              {record.cliente_alergias && (
                <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-destructive">Alergias Registradas</div>
                      <div className="text-sm text-muted-foreground">{record.cliente_alergias}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Seção Vacina */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Syringe className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-lg">Dados da Vacina</h3>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vacina:</span>
                <span className="font-medium">{record.vacina_nome}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fabricante:</span>
                <span className="font-medium">{record.fabricante}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lote:</span>
                <code className="text-xs bg-background px-2 py-1 rounded">{record.codigolote}</code>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Dose:</span>
                <Badge className={getDoseBadgeColor(record.dose)}>
                  {record.dose}ª dose
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Seção Aplicação */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-lg">Dados da Aplicação</h3>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data:</span>
                <span className="font-medium">{formatDate(record.dataaplicacao)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Aplicado por:</span>
                <span className="font-medium">{record.funcionario_nome}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Seção Observações */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Observações Clínicas</h3>
            
            {record.reacoesadversas && (
              <div className="mb-3">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Reações Adversas:
                </div>
                <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
                  <p className="text-sm">{record.reacoesadversas}</p>
                </div>
              </div>
            )}

            {record.observacoes && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Observações Gerais:
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm">{record.observacoes}</p>
                </div>
              </div>
            )}

            {!record.reacoesadversas && !record.observacoes && (
              <p className="text-muted-foreground text-sm italic">
                Nenhuma observação registrada para esta aplicação.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
