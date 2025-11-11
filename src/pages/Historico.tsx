import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { HistoricoFilters } from '@/components/HistoricoFilters';
import { HistoricoDetailsDialog } from '@/components/HistoricoDetailsDialog';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { AlertCircle, FileText, Calendar, Activity } from 'lucide-react';
import { formatBrasiliaDate } from '@/lib/utils';

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

interface Vacina {
  idvacina: number;
  nome: string;
}

interface Stats {
  total: number;
  mesAtual: number;
  vacinaMaisAplicada: string;
}

export const Historico: React.FC = () => {
  const { toast } = useToast();
  const [historico, setHistorico] = useState<HistoricoAplicacao[]>([]);
  const [filteredHistorico, setFilteredHistorico] = useState<HistoricoAplicacao[]>([]);
  const [vacinas, setVacinas] = useState<Vacina[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<HistoricoAplicacao | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [stats, setStats] = useState<Stats>({ total: 0, mesAtual: 0, vacinaMaisAplicada: '-' });

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [vacinaFilter, setVacinaFilter] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [doseFilter, setDoseFilter] = useState('');

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 15;

  useEffect(() => {
    fetchHistorico();
    fetchVacinas();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [historico, searchTerm, vacinaFilter, dataInicio, dataFim, doseFilter]);

  const fetchVacinas = async () => {
    try {
      const { data, error } = await supabase
        .from('vacina')
        .select('idvacina, nome')
        .eq('status', 'ATIVA')
        .order('nome');

      if (error) throw error;
      setVacinas(data || []);
    } catch (error) {
      console.error('Erro ao buscar vacinas:', error);
    }
  };

  const fetchHistorico = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('aplicacao')
        .select(`
          idaplicacao,
          dataaplicacao,
          dose,
          reacoesadversas,
          observacoes,
          cliente_cpf,
          funcionario_idfuncionario,
          agendamento_idagendamento,
          lote_numlote
        `)
        .order('dataaplicacao', { ascending: false });

      if (error) throw error;

      // Buscar informações adicionais
      const enrichedData = await Promise.all(
        (data || []).map(async (aplicacao) => {
          // Buscar cliente
          const { data: clienteData } = await supabase
            .from('cliente')
            .select('nomecompleto, cpf, alergias')
            .eq('cpf', aplicacao.cliente_cpf)
            .maybeSingle();

          // Buscar funcionário
          const { data: funcionarioData } = await supabase
            .from('funcionario')
            .select('nomecompleto')
            .eq('idfuncionario', aplicacao.funcionario_idfuncionario)
            .maybeSingle();

          // Buscar informações da vacina e lote
          let vacinaInfo = { nome: 'N/A', fabricante: 'N/A', codigolote: 'N/A' };
          
          // Tentar buscar lote diretamente da aplicação primeiro
          let loteNumero = aplicacao.lote_numlote;
          
          // Se não tiver lote direto, buscar através do agendamento
          if (!loteNumero && aplicacao.agendamento_idagendamento) {
            const { data: agendamentoData } = await supabase
              .from('agendamento')
              .select('lote_numlote')
              .eq('idagendamento', aplicacao.agendamento_idagendamento)
              .maybeSingle();
            
            if (agendamentoData) {
              loteNumero = agendamentoData.lote_numlote;
            }
          }
          
          // Buscar informações do lote e vacina
          if (loteNumero) {
            const { data: loteData } = await supabase
              .from('lote')
              .select('codigolote, vacina_idvacina')
              .eq('numlote', loteNumero)
              .maybeSingle();

            if (loteData) {
              const { data: vacinaData } = await supabase
                .from('vacina')
                .select('nome, fabricante')
                .eq('idvacina', loteData.vacina_idvacina)
                .maybeSingle();

              if (vacinaData) {
                vacinaInfo = {
                  nome: vacinaData.nome,
                  fabricante: vacinaData.fabricante || 'N/A',
                  codigolote: loteData.codigolote,
                };
              }
            }
          }

          return {
            idaplicacao: aplicacao.idaplicacao,
            dataaplicacao: aplicacao.dataaplicacao,
            dose: aplicacao.dose,
            cliente_nome: clienteData?.nomecompleto || 'N/A',
            cliente_cpf: aplicacao.cliente_cpf,
            funcionario_nome: funcionarioData?.nomecompleto || 'N/A',
            vacina_nome: vacinaInfo.nome,
            fabricante: vacinaInfo.fabricante,
            codigolote: vacinaInfo.codigolote,
            reacoesadversas: aplicacao.reacoesadversas,
            observacoes: aplicacao.observacoes,
            cliente_alergias: clienteData?.alergias,
          };
        })
      );

      setHistorico(enrichedData);
      calculateStats(enrichedData);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o histórico de vacinações.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: HistoricoAplicacao[]) => {
    const total = data.length;
    
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const mesAtual = data.filter(
      (item) => new Date(item.dataaplicacao) >= firstDayOfMonth
    ).length;

    const vacinaCount: { [key: string]: number } = {};
    data.forEach((item) => {
      vacinaCount[item.vacina_nome] = (vacinaCount[item.vacina_nome] || 0) + 1;
    });

    const vacinaMaisAplicada = Object.keys(vacinaCount).length > 0
      ? Object.keys(vacinaCount).reduce((a, b) => (vacinaCount[a] > vacinaCount[b] ? a : b))
      : '-';

    setStats({ total, mesAtual, vacinaMaisAplicada });
  };

  const applyFilters = () => {
    let filtered = [...historico];

    // Busca geral (nome cliente, CPF, funcionário, vacina)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((item) =>
        item.cliente_nome.toLowerCase().includes(term) ||
        item.cliente_cpf.includes(term) ||
        item.funcionario_nome.toLowerCase().includes(term) ||
        item.vacina_nome.toLowerCase().includes(term)
      );
    }

    if (vacinaFilter && vacinaFilter !== 'all') {
      filtered = filtered.filter((item) => item.vacina_nome === vacinaFilter);
    }

    if (dataInicio) {
      filtered = filtered.filter((item) => item.dataaplicacao >= dataInicio);
    }

    if (dataFim) {
      filtered = filtered.filter((item) => item.dataaplicacao <= dataFim);
    }

    if (doseFilter && doseFilter !== 'all') {
      filtered = filtered.filter((item) => item.dose === parseInt(doseFilter));
    }

    setFilteredHistorico(filtered);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setVacinaFilter('');
    setDataInicio('');
    setDataFim('');
    setDoseFilter('');
  };

  const handleViewDetails = (record: HistoricoAplicacao) => {
    setSelectedRecord(record);
    setShowDetailsDialog(true);
  };

  // Paginação
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredHistorico.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredHistorico.length / recordsPerPage);

  const formatDate = (dateString: string) => {
    return formatBrasiliaDate(dateString);
  };

  const getDoseBadgeColor = (dose: number) => {
    return 'bg-blue-100 text-blue-800 min-w-[70px] justify-center';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Histórico de Vacinações</h1>
          <p className="text-muted-foreground">Visualize e filtre todas as aplicações realizadas</p>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Aplicações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{stats.total}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aplicações no Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{stats.mesAtual}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vacina Mais Aplicada</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold truncate">{stats.vacinaMaisAplicada}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <HistoricoFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        vacinaFilter={vacinaFilter}
        setVacinaFilter={setVacinaFilter}
        dataInicio={dataInicio}
        setDataInicio={setDataInicio}
        dataFim={dataFim}
        setDataFim={setDataFim}
        doseFilter={doseFilter}
        setDoseFilter={setDoseFilter}
        vacinas={vacinas}
        onClearFilters={clearFilters}
      />

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Registros de Aplicações</CardTitle>
          <CardDescription>
            Mostrando {currentRecords.length} de {filteredHistorico.length} registros
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : currentRecords.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum registro encontrado com os filtros aplicados.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold text-muted-foreground">Data</th>
                    <th className="text-left p-3 font-semibold text-muted-foreground">Cliente</th>
                    <th className="text-left p-3 font-semibold text-muted-foreground">Vacina</th>
                    <th className="text-left p-3 font-semibold text-muted-foreground">Dose</th>
                    <th className="text-left p-3 font-semibold text-muted-foreground">Funcionário</th>
                    <th className="text-left p-3 font-semibold text-muted-foreground">Lote</th>
                    <th className="text-left p-3 font-semibold text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRecords.map((record) => (
                    <tr key={record.idaplicacao} className="border-b hover:bg-muted/50">
                      <td className="p-3">{formatDate(record.dataaplicacao)}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {record.cliente_alergias && (
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          )}
                          <div>
                            <div className="font-medium">{record.cliente_nome}</div>
                            <div className="text-xs text-muted-foreground">{record.cliente_cpf}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{record.vacina_nome}</div>
                          <div className="text-xs text-muted-foreground">{record.fabricante}</div>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge className={getDoseBadgeColor(record.dose)}>
                          {record.dose}ª dose
                        </Badge>
                      </td>
                      <td className="p-3">{record.funcionario_nome}</td>
                      <td className="p-3">
                        <code className="text-xs bg-muted px-2 py-1 rounded">{record.codigolote}</code>
                      </td>
                      <td className="p-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(record)}
                        >
                          Ver Detalhes
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Detalhes */}
      {selectedRecord && (
        <HistoricoDetailsDialog
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
          record={selectedRecord}
        />
      )}
    </div>
  );
};
