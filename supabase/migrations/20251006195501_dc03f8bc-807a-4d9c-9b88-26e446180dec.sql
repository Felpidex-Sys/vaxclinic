-- =====================================================================
-- CRIAÇÃO DOS TIPOS ENUM
-- =====================================================================

CREATE TYPE public.cliente_status AS ENUM ('ATIVO', 'INATIVO');
CREATE TYPE public.funcionario_status AS ENUM ('ATIVO', 'INATIVO');
CREATE TYPE public.vacina_categoria AS ENUM ('VIRAL', 'BACTERIANA', 'OUTRA');
CREATE TYPE public.vacina_status AS ENUM ('ATIVA', 'INATIVA');
CREATE TYPE public.agendamento_status AS ENUM ('AGENDADO', 'REALIZADO');

-- =====================================================================
-- CRIAÇÃO DAS TABELAS
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.Cliente (
  CPF VARCHAR(11) NOT NULL,
  nomeCompleto VARCHAR(45) NOT NULL,
  dataNasc DATE NULL,
  email VARCHAR(45) NULL,
  telefone VARCHAR(11) NULL,
  alergias TEXT NULL,
  observacoes TEXT NULL,
  status cliente_status NOT NULL DEFAULT 'ATIVO',
  PRIMARY KEY (CPF),
  CONSTRAINT CHK_Cliente_Nome_Nao_Vazio CHECK (LENGTH(TRIM(nomeCompleto)) > 0),
  CONSTRAINT CHK_Cliente_CPF_Formato CHECK (CPF ~ '^[0-9]{11}$'),
  CONSTRAINT CHK_Cliente_Email_Formato CHECK (email IS NULL OR email ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'),
  CONSTRAINT CHK_Cliente_Telefone_Formato CHECK (telefone IS NULL OR telefone ~ '^[0-9]{10,11}$')
);

CREATE TABLE IF NOT EXISTS public.Funcionario (
  idFuncionario SERIAL NOT NULL,
  nomeCompleto VARCHAR(45) NOT NULL,
  CPF VARCHAR(11) NOT NULL UNIQUE,
  email VARCHAR(45) NOT NULL UNIQUE,
  telefone VARCHAR(11) NULL,
  cargo VARCHAR(45) NULL,
  senha VARCHAR(255) NOT NULL,
  status funcionario_status NOT NULL DEFAULT 'ATIVO',
  dataAdmissao DATE NULL,
  PRIMARY KEY (idFuncionario),
  CONSTRAINT CHK_Funcionario_Nome_Nao_Vazio CHECK (LENGTH(TRIM(nomeCompleto)) > 0),
  CONSTRAINT CHK_Funcionario_CPF_Formato CHECK (CPF ~ '^[0-9]{11}$'),
  CONSTRAINT CHK_Funcionario_Email_Formato CHECK (email ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'),
  CONSTRAINT CHK_Funcionario_Telefone_Formato CHECK (telefone IS NULL OR telefone ~ '^[0-9]{10,11}$'),
  CONSTRAINT CHK_Funcionario_Senha_Tamanho CHECK (LENGTH(senha) >= 8)
);

CREATE TABLE IF NOT EXISTS public.Vacina (
  idVacina SERIAL NOT NULL,
  nome VARCHAR(45) NOT NULL,
  fabricante VARCHAR(45) NULL,
  categoria vacina_categoria NULL,
  quantidadeDoses INT NULL,
  intervaloDoses INT NULL,
  descricao TEXT NULL,
  status vacina_status NOT NULL DEFAULT 'ATIVA',
  PRIMARY KEY (idVacina),
  CONSTRAINT CHK_Vacina_Nome_Nao_Vazio CHECK (LENGTH(TRIM(nome)) > 0),
  CONSTRAINT CHK_Vacina_QuantidadeDoses CHECK (quantidadeDoses IS NULL OR quantidadeDoses > 0),
  CONSTRAINT CHK_Vacina_IntervaloDoses CHECK (intervaloDoses IS NULL OR intervaloDoses >= 0)
);

COMMENT ON COLUMN public.Vacina.intervaloDoses IS 'Intervalo em dias entre as doses';

CREATE TABLE IF NOT EXISTS public.Lote (
  numLote SERIAL NOT NULL,
  codigoLote VARCHAR(50) NOT NULL,
  quantidadeInicial INT NOT NULL,
  quantidadeDisponivel INT NOT NULL,
  dataValidade DATE NOT NULL,
  Vacina_idVacina INT NOT NULL,
  PRIMARY KEY (numLote),
  FOREIGN KEY (Vacina_idVacina) REFERENCES public.Vacina (idVacina) ON DELETE RESTRICT,
  CONSTRAINT CHK_Lote_Codigo_Nao_Vazio CHECK (LENGTH(TRIM(codigoLote)) > 0),
  CONSTRAINT CHK_Lote_QuantidadeInicial CHECK (quantidadeInicial > 0),
  CONSTRAINT CHK_Lote_QuantidadeDisponivel CHECK (quantidadeDisponivel >= 0 AND quantidadeDisponivel <= quantidadeInicial)
);

CREATE TABLE IF NOT EXISTS public.Agendamento (
  idAgendamento SERIAL NOT NULL,
  dataAgendada TIMESTAMP NOT NULL,
  status agendamento_status NOT NULL DEFAULT 'AGENDADO',
  observacoes TEXT NULL,
  Cliente_CPF VARCHAR(11) NOT NULL,
  Funcionario_idFuncionario INT NOT NULL,
  Lote_numLote INT NOT NULL,
  PRIMARY KEY (idAgendamento),
  FOREIGN KEY (Cliente_CPF) REFERENCES public.Cliente (CPF),
  FOREIGN KEY (Funcionario_idFuncionario) REFERENCES public.Funcionario (idFuncionario),
  FOREIGN KEY (Lote_numLote) REFERENCES public.Lote (numLote)
);

CREATE TABLE IF NOT EXISTS public.Aplicacao (
  idAplicacao SERIAL NOT NULL,
  dataAplicacao DATE NOT NULL,
  dose INT NULL,
  reacoesAdversas TEXT NULL,
  observacoes TEXT NULL,
  Funcionario_idFuncionario INT NOT NULL,
  Cliente_CPF VARCHAR(11) NOT NULL,
  Agendamento_idAgendamento INT NOT NULL UNIQUE,
  PRIMARY KEY (idAplicacao),
  FOREIGN KEY (Funcionario_idFuncionario) REFERENCES public.Funcionario (idFuncionario),
  FOREIGN KEY (Cliente_CPF) REFERENCES public.Cliente (CPF),
  CONSTRAINT CHK_Aplicacao_Dose CHECK (dose IS NULL OR dose > 0)
);

CREATE TABLE IF NOT EXISTS public.Historico_Aplicacoes_Cliente (
  idHistorico SERIAL NOT NULL,
  cliente_CPF_deletado VARCHAR(11) NOT NULL,
  idAplicacao_hist INT NOT NULL,
  dataAplicacao_hist DATE,
  dose_hist INT,
  idAgendamento_hist INT,
  idFuncionario_hist INT,
  data_exclusao_cliente TIMESTAMP,
  PRIMARY KEY (idHistorico)
);

-- =====================================================================
-- TRIGGERS DE VALIDAÇÃO DE DADOS (DATAS, ETC.)
-- =====================================================================

-- Validação de Cliente
CREATE OR REPLACE FUNCTION public.valida_cliente()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.dataNasc IS NOT NULL AND NEW.dataNasc > CURRENT_DATE THEN
        RAISE EXCEPTION 'A data de nascimento não pode ser uma data futura.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER TRG_Valida_Cliente_BI 
BEFORE INSERT ON public.Cliente 
FOR EACH ROW EXECUTE FUNCTION public.valida_cliente();

CREATE TRIGGER TRG_Valida_Cliente_BU 
BEFORE UPDATE ON public.Cliente 
FOR EACH ROW EXECUTE FUNCTION public.valida_cliente();

-- Validação de Funcionário
CREATE OR REPLACE FUNCTION public.valida_funcionario()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.dataAdmissao IS NOT NULL AND NEW.dataAdmissao > CURRENT_DATE THEN
        RAISE EXCEPTION 'A data de admissão não pode ser uma data futura.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER TRG_Valida_Funcionario_BI 
BEFORE INSERT ON public.Funcionario 
FOR EACH ROW EXECUTE FUNCTION public.valida_funcionario();

CREATE TRIGGER TRG_Valida_Funcionario_BU 
BEFORE UPDATE ON public.Funcionario 
FOR EACH ROW EXECUTE FUNCTION public.valida_funcionario();

-- Validação de Lote
CREATE OR REPLACE FUNCTION public.valida_lote()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.dataValidade < CURRENT_DATE THEN
        RAISE EXCEPTION 'A data de validade não pode ser anterior à data atual. Lote vencido.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER TRG_Valida_Lote_BI 
BEFORE INSERT ON public.Lote 
FOR EACH ROW EXECUTE FUNCTION public.valida_lote();

CREATE TRIGGER TRG_Valida_Lote_BU 
BEFORE UPDATE ON public.Lote 
FOR EACH ROW EXECUTE FUNCTION public.valida_lote();

-- Validação de Agendamento
CREATE OR REPLACE FUNCTION public.valida_agendamento()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.dataAgendada <= NOW() THEN
        RAISE EXCEPTION 'A data do agendamento deve ser no futuro.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER TRG_Valida_Agendamento_BI 
BEFORE INSERT ON public.Agendamento 
FOR EACH ROW EXECUTE FUNCTION public.valida_agendamento();

CREATE TRIGGER TRG_Valida_Agendamento_BU 
BEFORE UPDATE ON public.Agendamento 
FOR EACH ROW EXECUTE FUNCTION public.valida_agendamento();

-- Validação de Aplicação
CREATE OR REPLACE FUNCTION public.valida_aplicacao()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.dataAplicacao > CURRENT_DATE THEN
        RAISE EXCEPTION 'A data da aplicação não pode ser uma data futura.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER TRG_Valida_Aplicacao_BI 
BEFORE INSERT ON public.Aplicacao 
FOR EACH ROW EXECUTE FUNCTION public.valida_aplicacao();

CREATE TRIGGER TRG_Valida_Aplicacao_BU 
BEFORE UPDATE ON public.Aplicacao 
FOR EACH ROW EXECUTE FUNCTION public.valida_aplicacao();

-- =====================================================================
-- TRIGGERS DE REGRA DE NEGÓCIO (ESTOQUE, ETC.)
-- =====================================================================

CREATE OR REPLACE FUNCTION public.reserva_estoque_ao_agendar()
RETURNS TRIGGER AS $$
DECLARE
    disponivel INT;
BEGIN
    SELECT quantidadeDisponivel INTO disponivel FROM public.Lote WHERE numLote = NEW.Lote_numLote;
    
    IF disponivel <= 0 THEN
        RAISE EXCEPTION 'Não há vacinas disponíveis neste lote para agendamento.';
    ELSE
        UPDATE public.Lote SET quantidadeDisponivel = quantidadeDisponivel - 1 WHERE numLote = NEW.Lote_numLote;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER TRG_Reserva_Estoque_Ao_Agendar
BEFORE INSERT ON public.Agendamento
FOR EACH ROW EXECUTE FUNCTION public.reserva_estoque_ao_agendar();

CREATE OR REPLACE FUNCTION public.retorna_estoque_ao_cancelar()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'AGENDADO' THEN
        UPDATE public.Lote SET quantidadeDisponivel = quantidadeDisponivel + 1 WHERE numLote = OLD.Lote_numLote;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER TRG_Retorna_Estoque_Ao_Cancelar
BEFORE DELETE ON public.Agendamento
FOR EACH ROW EXECUTE FUNCTION public.retorna_estoque_ao_cancelar();

CREATE OR REPLACE FUNCTION public.finaliza_agendamento_apos_aplicacao()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.Agendamento SET status = 'REALIZADO' WHERE idAgendamento = NEW.Agendamento_idAgendamento;
    DELETE FROM public.Agendamento WHERE idAgendamento = NEW.Agendamento_idAgendamento;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER TRG_Finaliza_Agendamento_Apos_Aplicacao
AFTER INSERT ON public.Aplicacao
FOR EACH ROW EXECUTE FUNCTION public.finaliza_agendamento_apos_aplicacao();

CREATE OR REPLACE FUNCTION public.log_aplicacoes_antes_deletar_cliente()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.Historico_Aplicacoes_Cliente 
        (cliente_CPF_deletado, idAplicacao_hist, dataAplicacao_hist, dose_hist, idAgendamento_hist, idFuncionario_hist, data_exclusao_cliente)
    SELECT 
        OLD.CPF, idAplicacao, dataAplicacao, dose, Agendamento_idAgendamento, Funcionario_idFuncionario, NOW()
    FROM public.Aplicacao
    WHERE Cliente_CPF = OLD.CPF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER TRG_LogAplicacoes_AntesDeletarCliente
BEFORE DELETE ON public.Cliente
FOR EACH ROW EXECUTE FUNCTION public.log_aplicacoes_antes_deletar_cliente();

-- Criar índices para melhorar performance
CREATE INDEX idx_cliente_status ON public.Cliente(status);
CREATE INDEX idx_funcionario_status ON public.Funcionario(status);
CREATE INDEX idx_vacina_status ON public.Vacina(status);
CREATE INDEX idx_agendamento_status ON public.Agendamento(status);
CREATE INDEX idx_agendamento_data ON public.Agendamento(dataAgendada);
CREATE INDEX idx_aplicacao_data ON public.Aplicacao(dataAplicacao);
CREATE INDEX idx_lote_validade ON public.Lote(dataValidade);