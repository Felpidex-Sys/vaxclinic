-- Adicionar Foreign Keys para garantir integridade referencial

-- FK: aplicacao -> funcionario (RESTRICT - não pode deletar funcionário com aplicações)
ALTER TABLE aplicacao
ADD CONSTRAINT fk_aplicacao_funcionario
FOREIGN KEY (funcionario_idfuncionario)
REFERENCES funcionario(idfuncionario)
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- FK: aplicacao -> lote (RESTRICT - preservar histórico de lotes)
ALTER TABLE aplicacao
ADD CONSTRAINT fk_aplicacao_lote
FOREIGN KEY (lote_numlote)
REFERENCES lote(numlote)
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- FK: aplicacao -> cliente (RESTRICT - usa trigger para mover para histórico)
ALTER TABLE aplicacao
ADD CONSTRAINT fk_aplicacao_cliente
FOREIGN KEY (cliente_cpf)
REFERENCES cliente(cpf)
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- FK: aplicacao -> agendamento (SET NULL - agendamento é opcional)
ALTER TABLE aplicacao
ADD CONSTRAINT fk_aplicacao_agendamento
FOREIGN KEY (agendamento_idagendamento)
REFERENCES agendamento(idagendamento)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- FK: agendamento -> funcionario (SET NULL - funcionário é opcional)
ALTER TABLE agendamento
ADD CONSTRAINT fk_agendamento_funcionario
FOREIGN KEY (funcionario_idfuncionario)
REFERENCES funcionario(idfuncionario)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- FK: agendamento -> lote (RESTRICT - não pode deletar lote com agendamentos)
ALTER TABLE agendamento
ADD CONSTRAINT fk_agendamento_lote
FOREIGN KEY (lote_numlote)
REFERENCES lote(numlote)
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- FK: agendamento -> cliente (RESTRICT - não pode deletar cliente com agendamentos)
ALTER TABLE agendamento
ADD CONSTRAINT fk_agendamento_cliente
FOREIGN KEY (cliente_cpf)
REFERENCES cliente(cpf)
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- FK: lote -> vacina (RESTRICT - não pode deletar vacina com lotes)
ALTER TABLE lote
ADD CONSTRAINT fk_lote_vacina
FOREIGN KEY (vacina_idvacina)
REFERENCES vacina(idvacina)
ON DELETE RESTRICT
ON UPDATE CASCADE;