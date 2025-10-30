import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface InfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  content: string;
}

export const InfoDialog: React.FC<InfoDialogProps> = ({
  open,
  onOpenChange,
  title,
  content,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm whitespace-pre-wrap">{content || 'Nenhuma informação disponível.'}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
