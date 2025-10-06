import React from 'react';
import InputMask from 'react-input-mask';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface MaskedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  mask: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const MaskedInput = React.forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ mask, className, ...props }, ref) => {
    return (
      <InputMask mask={mask} {...props}>
        {(inputProps: any) => (
          <Input
            {...inputProps}
            ref={ref}
            className={cn(className)}
          />
        )}
      </InputMask>
    );
  }
);

MaskedInput.displayName = 'MaskedInput';
