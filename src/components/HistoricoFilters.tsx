import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface Vacina {
  idvacina: number;
  nome: string;
}

interface HistoricoFiltersProps {
  searchClienteTerm: string;
  setSearchClienteTerm: (value: string) => void;
  searchFuncionarioTerm: string;
  setSearchFuncionarioTerm: (value: string) => void;
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
  searchClienteTerm,
  setSearchClienteTerm,
  searchFuncionarioTerm,
  setSearchFuncionarioTerm,
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
  const hasActiveFilters = 
    searchClienteTerm || 
    searchFuncionarioTerm || 
    vacinaFilter || 
    dataInicio || 
    dataFim || 
    doseFilter;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Filtros</CardTitle>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            <X className="h-4 w-4 mr-2" />
            Limpar Filtros
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Busca por Cliente */}
          <div>
            <Label htmlFor="searchCliente">Cliente</Label>
            <Input
              id="searchCliente"
              placeholder="Nome ou CPF do cliente"
              value={searchClienteTerm}
              onChange={(e) => setSearchClienteTerm(e.target.value)}
            />
          </div>

          {/* Busca por Funcionário */}
          <div>
            <Label htmlFor="searchFuncionario">Funcionário</Label>
            <Input
              id="searchFuncionario"
              placeholder="Nome do funcionário"
              value={searchFuncionarioTerm}
              onChange={(e) => setSearchFuncionarioTerm(e.target.value)}
            />
          </div>

          {/* Filtro por Vacina */}
          <div>
            <Label htmlFor="vacinaFilter">Vacina</Label>
            <Select value={vacinaFilter} onValueChange={setVacinaFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as vacinas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as vacinas</SelectItem>
                {vacinas.map((vacina) => (
                  <SelectItem key={vacina.idvacina} value={vacina.nome}>
                    {vacina.nome}
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
                <SelectItem value="">Todas as doses</SelectItem>
                <SelectItem value="1">1ª dose</SelectItem>
                <SelectItem value="2">2ª dose</SelectItem>
                <SelectItem value="3">3ª dose</SelectItem>
                <SelectItem value="4">4ª dose</SelectItem>
                <SelectItem value="5">5ª dose</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
