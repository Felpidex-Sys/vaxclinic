import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Filter, X, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Vacina {
  idvacina: number;
  nome: string;
  fabricante?: string | null;
}

interface HistoricoFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  vacinaFilter: string;
  setVacinaFilter: (value: string) => void;
  dataInicio: string;
  setDataInicio: (value: string) => void;
  dataFim: string;
  setDataFim: (value: string) => void;
  doseFilter: string;
  setDoseFilter: (value: string) => void;
  vacinas: Vacina[];
  onClearFilters: () => void;
}

export const HistoricoFilters: React.FC<HistoricoFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  vacinaFilter,
  setVacinaFilter,
  dataInicio,
  setDataInicio,
  dataFim,
  setDataFim,
  doseFilter,
  setDoseFilter,
  vacinas,
  onClearFilters,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const advancedFiltersCount = 
    (vacinaFilter && vacinaFilter !== 'all' ? 1 : 0) + 
    (dataInicio ? 1 : 0) + 
    (dataFim ? 1 : 0) + 
    (doseFilter && doseFilter !== 'all' ? 1 : 0);

  return (
    <div className="flex gap-2">
      {/* Barra de Pesquisa Principal */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por cliente, CPF, funcionário ou vacina..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Botão de Filtros Avançados */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="relative">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
            {advancedFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                {advancedFiltersCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Filtros Avançados</SheetTitle>
            <SheetDescription>
              Refine sua busca com filtros específicos
            </SheetDescription>
          </SheetHeader>
          
          <div className="space-y-4 mt-6">
            {/* Filtro por Vacina */}
            <div>
              <Label htmlFor="vacinaFilter">Vacina</Label>
              <Select value={vacinaFilter} onValueChange={setVacinaFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as vacinas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as vacinas</SelectItem>
                  {vacinas.map((vacina) => (
                    <SelectItem key={vacina.idvacina} value={vacina.nome}>
                      {vacina.nome}{vacina.fabricante ? ` - ${vacina.fabricante}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Data Início */}
            <div>
              <Label htmlFor="dataInicio">Data Início</Label>
              <Input
                id="dataInicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>

            {/* Data Fim */}
            <div>
              <Label htmlFor="dataFim">Data Fim</Label>
              <Input
                id="dataFim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>

            {/* Filtro por Dose */}
            <div>
              <Label htmlFor="doseFilter">Dose</Label>
              <Select value={doseFilter} onValueChange={setDoseFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as doses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as doses</SelectItem>
                  <SelectItem value="1">1ª dose</SelectItem>
                  <SelectItem value="2">2ª dose</SelectItem>
                  <SelectItem value="3">3ª dose</SelectItem>
                  <SelectItem value="4">4ª dose</SelectItem>
                  <SelectItem value="5">5ª dose</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  onClearFilters();
                  setIsOpen(false);
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Limpar
              </Button>
              <Button 
                className="flex-1"
                onClick={() => setIsOpen(false)}
              >
                Aplicar
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
