# 🌐 API Endpoints - VixClinic

## 📋 Visão Geral

Este documento mapeia **TODOS** os endpoints da API VixClinic, incluindo requests, responses, validações, triggers e suas equivalências em C# (ASP.NET Core).

**Base URL** (Atual): `https://pqowthnotcvutqbiojzi.supabase.co/rest/v1/`  
**Autenticação**: Bearer Token JWT (Supabase Auth)

---

## 🔐 AUTENTICAÇÃO

### 1. Login (Sign In)

**TypeScript (Atual)**:
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: "usuario@example.com",
  password: "senha123"
});

// Depois busca perfil do funcionário
const { data: profile } = await supabase
  .from('funcionario')
  .select('*')
  .eq('email', email)
  .single();
```

**C# (Proposto)**:
```csharp
// POST /api/auth/login
[HttpPost("login")]
public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
{
    // 1. Buscar funcionário por email
    var funcionario = await _context.Funcionarios
        .FirstOrDefaultAsync(f => f.Email == loginDto.Email);
    
    if (funcionario == null)
        return Unauthorized(new { message = "Credenciais inválidas" });
    
    // 2. Verificar senha
    if (!PasswordHasher.VerifyPassword(loginDto.Password, funcionario.Senha))
        return Unauthorized(new { message = "Credenciais inválidas" });
    
    // 3. Verificar status
    if (funcionario.Status != FuncionarioStatus.ATIVO)
        return Unauthorized(new { message = "Usuário inativo" });
    
    // 4. Gerar JWT token
    var token = _jwtService.GenerateToken(funcionario);
    
    return Ok(new
    {
        token,
        user = new
        {
            id = funcionario.IdFuncionario,
            email = funcionario.Email,
            nome = funcionario.NomeCompleto,
            cargo = funcionario.Cargo
        }
    });
}
```

**Request**:
```json
POST /api/auth/login
Content-Type: application/json

{
  "email": "usuario@example.com",
  "password": "senha123"
}
```

**Response (Success)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "usuario@example.com",
    "nome": "João Silva",
    "cargo": "Vacinador"
  }
}
```

**Response (Error)**:
```json
{
  "message": "Credenciais inválidas"
}
```

---

### 2. Logout

**TypeScript (Atual)**:
```typescript
await supabase.auth.signOut();
```

**C# (Proposto)**:
```csharp
// POST /api/auth/logout
[HttpPost("logout")]
[Authorize]
public IActionResult Logout()
{
    // Com JWT, logout é feito no client (remover token)
    // Opcionalmente, adicionar token a blacklist
    return Ok(new { message = "Logout realizado com sucesso" });
}
```

---

### 3. Refresh Token

**TypeScript (Atual)**:
```typescript
const { data, error } = await supabase.auth.refreshSession();
```

**C# (Proposto)**:
```csharp
// POST /api/auth/refresh
[HttpPost("refresh")]
public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenDto dto)
{
    // Validar refresh token
    if (!_jwtService.ValidateRefreshToken(dto.RefreshToken))
        return Unauthorized(new { message = "Token inválido" });
    
    // Buscar usuário
    var userId = _jwtService.GetUserIdFromToken(dto.RefreshToken);
    var funcionario = await _context.Funcionarios.FindAsync(userId);
    
    if (funcionario == null || funcionario.Status != FuncionarioStatus.ATIVO)
        return Unauthorized(new { message = "Usuário não autorizado" });
    
    // Gerar novo token
    var newToken = _jwtService.GenerateToken(funcionario);
    
    return Ok(new { token = newToken });
}
```

---

## 👥 CLIENTES

### 1. Listar Todos os Clientes

**TypeScript (Atual)**:
```typescript
const { data, error } = await supabase
  .from('cliente')
  .select('*')
  .order('nomecompleto', { ascending: true });
```

**C# (Proposto)**:
```csharp
// GET /api/clientes
[HttpGet]
[Authorize]
public async Task<IActionResult> GetClientes(
    [FromQuery] string? status = null,
    [FromQuery] string? search = null)
{
    var query = _context.Clientes.AsQueryable();
    
    // Filtro por status
    if (!string.IsNullOrEmpty(status))
        query = query.Where(c => c.Status.ToString() == status);
    
    // Busca por nome, CPF, email, telefone
    if (!string.IsNullOrEmpty(search))
    {
        query = query.Where(c =>
            c.NomeCompleto.Contains(search) ||
            c.Cpf.Contains(search) ||
            (c.Email != null && c.Email.Contains(search)) ||
            (c.Telefone != null && c.Telefone.Contains(search))
        );
    }
    
    var clientes = await query
        .OrderBy(c => c.NomeCompleto)
        .ToListAsync();
    
    return Ok(clientes);
}
```

**Request**:
```
GET /api/clientes?status=ATIVO&search=silva
Authorization: Bearer {token}
```

**Response**:
```json
[
  {
    "cpf": "12345678901",
    "nomeCompleto": "João Silva",
    "dataNasc": "1990-05-15",
    "email": "joao@example.com",
    "telefone": "11987654321",
    "alergias": "Penicilina",
    "observacoes": "Cliente VIP",
    "status": "ATIVO"
  }
]
```

---

### 2. Buscar Cliente por CPF

**TypeScript (Atual)**:
```typescript
const { data, error } = await supabase
  .from('cliente')
  .select('*')
  .eq('cpf', cpf)
  .single();
```

**C# (Proposto)**:
```csharp
// GET /api/clientes/{cpf}
[HttpGet("{cpf}")]
[Authorize]
public async Task<IActionResult> GetCliente(string cpf)
{
    // Formatar CPF (remover formatação)
    cpf = CpfFormatter.Format(cpf);
    
    var cliente = await _context.Clientes.FindAsync(cpf);
    
    if (cliente == null)
        return NotFound(new { message = "Cliente não encontrado" });
    
    return Ok(cliente);
}
```

**Request**:
```
GET /api/clientes/12345678901
Authorization: Bearer {token}
```

**Response**:
```json
{
  "cpf": "12345678901",
  "nomeCompleto": "João Silva",
  "dataNasc": "1990-05-15",
  "email": "joao@example.com",
  "telefone": "11987654321",
  "alergias": "Penicilina",
  "observacoes": "Cliente VIP",
  "status": "ATIVO"
}
```

---

### 3. Criar Novo Cliente

**TypeScript (Atual)**:
```typescript
const { data, error } = await supabase
  .from('cliente')
  .insert([{
    CPF: formatCPF(cliente.CPF),
    nomeCompleto: cliente.nomeCompleto,
    dataNasc: cliente.dataNasc,
    email: cliente.email,
    telefone: formatTelefone(cliente.telefone),
    alergias: cliente.alergias,
    observacoes: cliente.observacoes,
    status: cliente.status || 'ATIVO'
  }]);
```

**C# (Proposto)**:
```csharp
// POST /api/clientes
[HttpPost]
[Authorize]
public async Task<IActionResult> CreateCliente([FromBody] ClienteDto clienteDto)
{
    // Validar DTO
    var validator = new ClienteValidator();
    var validationResult = await validator.ValidateAsync(clienteDto);
    
    if (!validationResult.IsValid)
        return BadRequest(validationResult.Errors);
    
    // Formatar dados
    clienteDto.Cpf = CpfFormatter.Format(clienteDto.Cpf);
    clienteDto.Telefone = TelefoneFormatter.Format(clienteDto.Telefone);
    
    // Verificar se CPF já existe
    if (await _context.Clientes.AnyAsync(c => c.Cpf == clienteDto.Cpf))
        return Conflict(new { message = "CPF já cadastrado" });
    
    // Criar cliente
    var cliente = _mapper.Map<Cliente>(clienteDto);
    _context.Clientes.Add(cliente);
    
    try
    {
        await _context.SaveChangesAsync();
    }
    catch (DbUpdateException ex)
    {
        // Trigger valida_cliente() pode lançar exceção
        if (ex.InnerException?.Message.Contains("data de nascimento") == true)
            return BadRequest(new { message = "Data de nascimento inválida" });
        
        throw;
    }
    
    return CreatedAtAction(nameof(GetCliente), new { cpf = cliente.Cpf }, cliente);
}
```

**Request**:
```json
POST /api/clientes
Authorization: Bearer {token}
Content-Type: application/json

{
  "cpf": "12345678901",
  "nomeCompleto": "Maria Santos",
  "dataNasc": "1985-08-20",
  "email": "maria@example.com",
  "telefone": "11987654321",
  "alergias": null,
  "observacoes": null,
  "status": "ATIVO"
}
```

**Response (Success)**:
```json
{
  "cpf": "12345678901",
  "nomeCompleto": "Maria Santos",
  "dataNasc": "1985-08-20",
  "email": "maria@example.com",
  "telefone": "11987654321",
  "alergias": null,
  "observacoes": null,
  "status": "ATIVO"
}
```

**Response (Error - Validação)**:
```json
{
  "errors": [
    {
      "propertyName": "Cpf",
      "errorMessage": "CPF deve conter exatamente 11 dígitos"
    }
  ]
}
```

**Response (Error - Trigger)**:
```json
{
  "message": "Data de nascimento inválida"
}
```

**Triggers Executados**:
- `valida_cliente()` - Valida que `dataNasc` não é no futuro

---

### 4. Atualizar Cliente

**TypeScript (Atual)**:
```typescript
const { data, error } = await supabase
  .from('cliente')
  .update({
    nomeCompleto: cliente.nomeCompleto,
    dataNasc: cliente.dataNasc,
    email: cliente.email,
    telefone: formatTelefone(cliente.telefone),
    alergias: cliente.alergias,
    observacoes: cliente.observacoes,
    status: cliente.status
  })
  .eq('cpf', cpf);
```

**C# (Proposto)**:
```csharp
// PUT /api/clientes/{cpf}
[HttpPut("{cpf}")]
[Authorize]
public async Task<IActionResult> UpdateCliente(string cpf, [FromBody] ClienteDto clienteDto)
{
    // Formatar CPF
    cpf = CpfFormatter.Format(cpf);
    
    // Buscar cliente existente
    var cliente = await _context.Clientes.FindAsync(cpf);
    if (cliente == null)
        return NotFound(new { message = "Cliente não encontrado" });
    
    // Validar DTO
    var validator = new ClienteValidator();
    var validationResult = await validator.ValidateAsync(clienteDto);
    
    if (!validationResult.IsValid)
        return BadRequest(validationResult.Errors);
    
    // Atualizar campos (exceto CPF)
    cliente.NomeCompleto = clienteDto.NomeCompleto;
    cliente.DataNasc = clienteDto.DataNasc;
    cliente.Email = clienteDto.Email;
    cliente.Telefone = TelefoneFormatter.Format(clienteDto.Telefone);
    cliente.Alergias = clienteDto.Alergias;
    cliente.Observacoes = clienteDto.Observacoes;
    cliente.Status = clienteDto.Status;
    
    try
    {
        await _context.SaveChangesAsync();
    }
    catch (DbUpdateException ex)
    {
        if (ex.InnerException?.Message.Contains("data de nascimento") == true)
            return BadRequest(new { message = "Data de nascimento inválida" });
        
        throw;
    }
    
    return Ok(cliente);
}
```

**Request**:
```json
PUT /api/clientes/12345678901
Authorization: Bearer {token}
Content-Type: application/json

{
  "cpf": "12345678901",
  "nomeCompleto": "Maria Santos Silva",
  "dataNasc": "1985-08-20",
  "email": "maria.silva@example.com",
  "telefone": "11987654321",
  "alergias": "Dipirona",
  "observacoes": "Atualizado telefone",
  "status": "ATIVO"
}
```

**Triggers Executados**:
- `valida_cliente()` - Valida que `dataNasc` não é no futuro

---

### 5. Deletar Cliente

**TypeScript (Atual)**:
```typescript
const { error } = await supabase
  .from('cliente')
  .delete()
  .eq('cpf', cpf);
```

**C# (Proposto)**:
```csharp
// DELETE /api/clientes/{cpf}
[HttpDelete("{cpf}")]
[Authorize(Roles = "admin")] // Apenas admins
public async Task<IActionResult> DeleteCliente(string cpf)
{
    cpf = CpfFormatter.Format(cpf);
    
    var cliente = await _context.Clientes.FindAsync(cpf);
    if (cliente == null)
        return NotFound(new { message = "Cliente não encontrado" });
    
    _context.Clientes.Remove(cliente);
    
    try
    {
        await _context.SaveChangesAsync();
    }
    catch (DbUpdateException ex)
    {
        // Se houver restrições, informar
        if (ex.InnerException?.Message.Contains("constraint") == true)
            return BadRequest(new { message = "Cliente possui registros vinculados" });
        
        throw;
    }
    
    return NoContent();
}
```

**Request**:
```
DELETE /api/clientes/12345678901
Authorization: Bearer {token}
```

**Response (Success)**:
```
204 No Content
```

**Triggers Executados**:
- `log_aplicacoes_antes_deletar_cliente()` - Copia aplicações para histórico antes de deletar

**Efeitos Cascata**:
- Agendamentos do cliente são **DELETADOS** (CASCADE)
- Aplicações do cliente **NÃO PODEM SER DELETADAS** (RESTRICT) - usar o trigger para histórico

---

### 6. Estatísticas de Clientes

**TypeScript (Atual)**:
```typescript
// Calculado no frontend
const totalClientes = clientes.length;
const idosos = clientes.filter(c => calculateAge(c.dataNasc) >= 60).length;
const menores = clientes.filter(c => calculateAge(c.dataNasc) < 18).length;
const comEmail = clientes.filter(c => c.email).length;
```

**C# (Proposto)**:
```csharp
// GET /api/clientes/stats
[HttpGet("stats")]
[Authorize]
public async Task<IActionResult> GetClientesStats()
{
    var hoje = DateTime.Today;
    var dataIdosos = hoje.AddYears(-60);
    var dataMenores = hoje.AddYears(-18);
    
    var stats = new
    {
        totalClientes = await _context.Clientes.CountAsync(),
        idosos = await _context.Clientes
            .Where(c => c.DataNasc != null && c.DataNasc <= dataIdosos)
            .CountAsync(),
        menores = await _context.Clientes
            .Where(c => c.DataNasc != null && c.DataNasc > dataMenores)
            .CountAsync(),
        comEmail = await _context.Clientes
            .Where(c => c.Email != null && c.Email != "")
            .CountAsync()
    };
    
    return Ok(stats);
}
```

**Response**:
```json
{
  "totalClientes": 150,
  "idosos": 35,
  "menores": 20,
  "comEmail": 120
}
```

---

## 👔 FUNCIONÁRIOS

### 1. Listar Todos os Funcionários

**TypeScript (Atual)**:
```typescript
const { data, error } = await supabase
  .from('funcionario')
  .select('*')
  .order('nomecompleto', { ascending: true });
```

**C# (Proposto)**:
```csharp
// GET /api/funcionarios
[HttpGet]
[Authorize]
public async Task<IActionResult> GetFuncionarios(
    [FromQuery] string? status = null,
    [FromQuery] string? cargo = null)
{
    var query = _context.Funcionarios.AsQueryable();
    
    if (!string.IsNullOrEmpty(status))
        query = query.Where(f => f.Status.ToString() == status);
    
    if (!string.IsNullOrEmpty(cargo))
        query = query.Where(f => f.Cargo == cargo);
    
    var funcionarios = await query
        .OrderBy(f => f.NomeCompleto)
        .Select(f => new
        {
            f.IdFuncionario,
            f.NomeCompleto,
            f.Cpf,
            f.Email,
            f.Telefone,
            f.Cargo,
            f.Status,
            f.DataAdmissao
            // NÃO retornar senha
        })
        .ToListAsync();
    
    return Ok(funcionarios);
}
```

**Request**:
```
GET /api/funcionarios?status=ATIVO
Authorization: Bearer {token}
```

**Response**:
```json
[
  {
    "idFuncionario": 1,
    "nomeCompleto": "João Silva",
    "cpf": "12345678901",
    "email": "joao@clinic.com",
    "telefone": "11987654321",
    "cargo": "Vacinador",
    "status": "ATIVO",
    "dataAdmissao": "2024-01-15"
  }
]
```

---

### 2. Criar Novo Funcionário

**TypeScript (Atual)**:
```typescript
const hashedPassword = await hashPassword(funcionario.senha);

const { data, error } = await supabase
  .from('funcionario')
  .insert([{
    nomeCompleto: funcionario.nomeCompleto,
    CPF: formatCPF(funcionario.CPF),
    email: funcionario.email,
    telefone: formatTelefone(funcionario.telefone),
    cargo: funcionario.cargo,
    senha: hashedPassword,
    status: funcionario.status || 'ATIVO',
    dataAdmissao: funcionario.dataAdmissao
  }]);
```

**C# (Proposto)**:
```csharp
// POST /api/funcionarios
[HttpPost]
[Authorize(Roles = "admin")]
public async Task<IActionResult> CreateFuncionario([FromBody] FuncionarioDto dto)
{
    // Validar DTO
    var validator = new FuncionarioValidator();
    var validationResult = await validator.ValidateAsync(dto);
    
    if (!validationResult.IsValid)
        return BadRequest(validationResult.Errors);
    
    // Formatar dados
    dto.Cpf = CpfFormatter.Format(dto.Cpf);
    dto.Telefone = TelefoneFormatter.Format(dto.Telefone);
    
    // Verificar se email ou CPF já existem
    if (await _context.Funcionarios.AnyAsync(f => f.Email == dto.Email))
        return Conflict(new { message = "Email já cadastrado" });
    
    if (await _context.Funcionarios.AnyAsync(f => f.Cpf == dto.Cpf))
        return Conflict(new { message = "CPF já cadastrado" });
    
    // Hash da senha
    var hashedPassword = PasswordHasher.HashPassword(dto.Senha);
    
    // Criar funcionário
    var funcionario = _mapper.Map<Funcionario>(dto);
    funcionario.Senha = hashedPassword;
    
    _context.Funcionarios.Add(funcionario);
    
    try
    {
        await _context.SaveChangesAsync();
    }
    catch (DbUpdateException ex)
    {
        if (ex.InnerException?.Message.Contains("data de admissão") == true)
            return BadRequest(new { message = "Data de admissão inválida" });
        
        throw;
    }
    
    // Retornar sem senha
    return CreatedAtAction(nameof(GetFuncionario), 
        new { id = funcionario.IdFuncionario }, 
        new
        {
            funcionario.IdFuncionario,
            funcionario.NomeCompleto,
            funcionario.Cpf,
            funcionario.Email,
            funcionario.Telefone,
            funcionario.Cargo,
            funcionario.Status,
            funcionario.DataAdmissao
        });
}
```

**Triggers Executados**:
- `valida_funcionario()` - Valida que `dataAdmissao` não é no futuro

---

### 3. Atualizar Funcionário

**TypeScript (Atual)**:
```typescript
const updateData: any = {
  nomeCompleto: funcionario.nomeCompleto,
  CPF: formatCPF(funcionario.CPF),
  email: funcionario.email,
  telefone: formatTelefone(funcionario.telefone),
  cargo: funcionario.cargo,
  status: funcionario.status,
  dataAdmissao: funcionario.dataAdmissao
};

// Se senha foi alterada
if (funcionario.senha) {
  updateData.senha = await hashPassword(funcionario.senha);
}

const { data, error } = await supabase
  .from('funcionario')
  .update(updateData)
  .eq('idfuncionario', id);
```

**C# (Proposto)**:
```csharp
// PUT /api/funcionarios/{id}
[HttpPut("{id}")]
[Authorize]
public async Task<IActionResult> UpdateFuncionario(int id, [FromBody] FuncionarioDto dto)
{
    var funcionario = await _context.Funcionarios.FindAsync(id);
    if (funcionario == null)
        return NotFound(new { message = "Funcionário não encontrado" });
    
    // Verificar se pode editar (admin ou próprio usuário)
    var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);
    if (currentUserId != id && !User.IsInRole("admin"))
        return Forbid();
    
    // Validar DTO
    var validator = new FuncionarioValidator();
    var validationResult = await validator.ValidateAsync(dto);
    
    if (!validationResult.IsValid)
        return BadRequest(validationResult.Errors);
    
    // Verificar email único (exceto próprio)
    if (await _context.Funcionarios.AnyAsync(f => f.Email == dto.Email && f.IdFuncionario != id))
        return Conflict(new { message = "Email já cadastrado" });
    
    // Atualizar campos
    funcionario.NomeCompleto = dto.NomeCompleto;
    funcionario.Email = dto.Email;
    funcionario.Telefone = TelefoneFormatter.Format(dto.Telefone);
    funcionario.Cargo = dto.Cargo;
    funcionario.Status = dto.Status;
    funcionario.DataAdmissao = dto.DataAdmissao;
    
    // Atualizar senha apenas se fornecida
    if (!string.IsNullOrEmpty(dto.Senha))
        funcionario.Senha = PasswordHasher.HashPassword(dto.Senha);
    
    try
    {
        await _context.SaveChangesAsync();
    }
    catch (DbUpdateException ex)
    {
        if (ex.InnerException?.Message.Contains("data de admissão") == true)
            return BadRequest(new { message = "Data de admissão inválida" });
        
        throw;
    }
    
    return Ok(new
    {
        funcionario.IdFuncionario,
        funcionario.NomeCompleto,
        funcionario.Cpf,
        funcionario.Email,
        funcionario.Telefone,
        funcionario.Cargo,
        funcionario.Status,
        funcionario.DataAdmissao
    });
}
```

**Triggers Executados**:
- `valida_funcionario()` - Valida que `dataAdmissao` não é no futuro

---

## 💉 VACINAS

### 1. Listar Todas as Vacinas

**TypeScript (Atual)**:
```typescript
const { data, error } = await supabase
  .from('vacina')
  .select('*')
  .order('nome', { ascending: true });
```

**C# (Proposto)**:
```csharp
// GET /api/vacinas
[HttpGet]
[Authorize]
public async Task<IActionResult> GetVacinas(
    [FromQuery] string? status = null,
    [FromQuery] string? categoria = null)
{
    var query = _context.Vacinas.AsQueryable();
    
    if (!string.IsNullOrEmpty(status))
        query = query.Where(v => v.Status.ToString() == status);
    
    if (!string.IsNullOrEmpty(categoria))
        query = query.Where(v => v.Categoria.ToString() == categoria);
    
    var vacinas = await query
        .OrderBy(v => v.Nome)
        .ToListAsync();
    
    return Ok(vacinas);
}
```

---

### 2. Criar Nova Vacina

**TypeScript (Atual)**:
```typescript
const { data, error } = await supabase
  .from('vacina')
  .insert([{
    nome: vacina.nome,
    fabricante: vacina.fabricante,
    categoria: vacina.categoria,
    quantidadeDoses: vacina.quantidadeDoses,
    intervaloDoses: vacina.intervaloDoses,
    descricao: vacina.descricao,
    status: vacina.status || 'ATIVA'
  }]);
```

**C# (Proposto)**:
```csharp
// POST /api/vacinas
[HttpPost]
[Authorize]
public async Task<IActionResult> CreateVacina([FromBody] VacinaDto dto)
{
    var validator = new VacinaValidator();
    var validationResult = await validator.ValidateAsync(dto);
    
    if (!validationResult.IsValid)
        return BadRequest(validationResult.Errors);
    
    var vacina = _mapper.Map<Vacina>(dto);
    _context.Vacinas.Add(vacina);
    await _context.SaveChangesAsync();
    
    return CreatedAtAction(nameof(GetVacina), new { id = vacina.IdVacina }, vacina);
}
```

---

### 3. Estatísticas de Vacinas

**TypeScript (Atual)**:
```typescript
// Busca agendamentos
const { data: agendamentos } = await supabase
  .from('agendamento')
  .select('lote_numlote');

// Busca lotes
const { data: lotes } = await supabase
  .from('lote')
  .select('numlote, vacina_idvacina, quantidadedisponivel');

// Calcula estatísticas no frontend
vacinas.forEach(vacina => {
  const vacinaLotes = lotes.filter(l => l.vacina_idvacina === vacina.idvacina);
  
  vacina.totalDoses = vacinaLotes.reduce((sum, l) => sum + l.quantidadedisponivel, 0);
  
  vacina.agendadas = agendamentos.filter(a => 
    vacinaLotes.some(l => l.numlote === a.lote_numlote)
  ).length;
  
  vacina.disponiveis = vacina.totalDoses - vacina.agendadas;
});
```

**C# (Proposto)**:
```csharp
// GET /api/vacinas/stats
[HttpGet("stats")]
[Authorize]
public async Task<IActionResult> GetVacinasStats()
{
    var vacinas = await _context.Vacinas
        .Include(v => v.Lotes)
            .ThenInclude(l => l.Agendamentos)
        .Where(v => v.Status == VacinaStatus.ATIVA)
        .Select(v => new
        {
            v.IdVacina,
            v.Nome,
            v.Fabricante,
            TotalDoses = v.Lotes.Sum(l => l.QuantidadeDisponivel),
            Agendadas = v.Lotes.SelectMany(l => l.Agendamentos).Count(),
            Disponiveis = v.Lotes.Sum(l => l.QuantidadeDisponivel) - 
                         v.Lotes.SelectMany(l => l.Agendamentos).Count()
        })
        .ToListAsync();
    
    return Ok(vacinas);
}
```

**Response**:
```json
[
  {
    "idVacina": 1,
    "nome": "COVID-19 Pfizer",
    "fabricante": "Pfizer",
    "totalDoses": 500,
    "agendadas": 120,
    "disponiveis": 380
  }
]
```

---

## 📦 LOTES

### 1. Listar Todos os Lotes

**TypeScript (Atual)**:
```typescript
const { data, error } = await supabase
  .from('lote')
  .select('*, vacina(*)')
  .order('datavalidade', { ascending: true });
```

**C# (Proposto)**:
```csharp
// GET /api/lotes
[HttpGet]
[Authorize]
public async Task<IActionResult> GetLotes([FromQuery] int? vacinaId = null)
{
    var query = _context.Lotes
        .Include(l => l.Vacina)
        .AsQueryable();
    
    if (vacinaId.HasValue)
        query = query.Where(l => l.VacinaId == vacinaId.Value);
    
    var lotes = await query
        .OrderBy(l => l.DataValidade)
        .ToListAsync();
    
    return Ok(lotes);
}
```

**Response**:
```json
[
  {
    "numLote": 1,
    "codigoLote": "LOT2024001",
    "quantidadeInicial": 500,
    "quantidadeDisponivel": 380,
    "dataValidade": "2025-12-31",
    "precoCompra": 25.50,
    "precoVenda": 45.00,
    "vacinaId": 1,
    "vacina": {
      "idVacina": 1,
      "nome": "COVID-19 Pfizer",
      "fabricante": "Pfizer"
    }
  }
]
```

---

### 2. Criar Novo Lote

**TypeScript (Atual)**:
```typescript
const { data, error } = await supabase
  .from('lote')
  .insert([{
    codigoLote: lote.codigoLote,
    quantidadeInicial: lote.quantidadeInicial,
    quantidadeDisponivel: lote.quantidadeInicial,
    dataValidade: lote.dataValidade,
    precocompra: lote.precocompra,
    precovenda: lote.precovenda,
    Vacina_idVacina: lote.Vacina_idVacina
  }]);
```

**C# (Proposto)**:
```csharp
// POST /api/lotes
[HttpPost]
[Authorize]
public async Task<IActionResult> CreateLote([FromBody] LoteDto dto)
{
    var validator = new LoteValidator(isUpdate: false);
    var validationResult = await validator.ValidateAsync(dto);
    
    if (!validationResult.IsValid)
        return BadRequest(validationResult.Errors);
    
    // Verificar se código do lote já existe
    if (await _context.Lotes.AnyAsync(l => l.CodigoLote == dto.CodigoLote))
        return Conflict(new { message = "Código do lote já cadastrado" });
    
    var lote = _mapper.Map<Lote>(dto);
    lote.QuantidadeDisponivel = lote.QuantidadeInicial;
    
    _context.Lotes.Add(lote);
    
    try
    {
        await _context.SaveChangesAsync();
    }
    catch (DbUpdateException ex)
    {
        if (ex.InnerException?.Message.Contains("validade") == true)
            return BadRequest(new { message = "Lote vencido não pode ser cadastrado" });
        
        throw;
    }
    
    return CreatedAtAction(nameof(GetLote), new { id = lote.NumLote }, lote);
}
```

**Triggers Executados**:
- `valida_lote()` - Valida que `dataValidade` não está vencida

---

### 3. Atualizar Lote

**TypeScript (Atual)**:
```typescript
const { data, error } = await supabase
  .from('lote')
  .update({
    codigoLote: lote.codigoLote,
    quantidadeInicial: lote.quantidadeInicial,
    quantidadeDisponivel: lote.quantidadeDisponivel,
    dataValidade: lote.dataValidade,
    // precocompra NÃO É ATUALIZADO (disabled no form)
    precovenda: lote.precovenda,
    Vacina_idVacina: lote.Vacina_idVacina
  })
  .eq('numlote', numLote);
```

**C# (Proposto)**:
```csharp
// PUT /api/lotes/{id}
[HttpPut("{id}")]
[Authorize]
public async Task<IActionResult> UpdateLote(int id, [FromBody] LoteDto dto)
{
    var lote = await _context.Lotes.FindAsync(id);
    if (lote == null)
        return NotFound(new { message = "Lote não encontrado" });
    
    var validator = new LoteValidator(isUpdate: true);
    var validationResult = await validator.ValidateAsync(dto);
    
    if (!validationResult.IsValid)
        return BadRequest(validationResult.Errors);
    
    // Verificar código único (exceto próprio)
    if (await _context.Lotes.AnyAsync(l => l.CodigoLote == dto.CodigoLote && l.NumLote != id))
        return Conflict(new { message = "Código do lote já existe" });
    
    // Atualizar campos (EXCETO precocompra - é imutável)
    lote.CodigoLote = dto.CodigoLote;
    lote.QuantidadeInicial = dto.QuantidadeInicial;
    lote.QuantidadeDisponivel = dto.QuantidadeDisponivel;
    lote.DataValidade = dto.DataValidade;
    // lote.PrecoCompra = IMUTÁVEL - NÃO atualizar
    lote.PrecoVenda = dto.PrecoVenda;
    lote.VacinaId = dto.VacinaId;
    
    try
    {
        await _context.SaveChangesAsync();
    }
    catch (DbUpdateException ex)
    {
        if (ex.InnerException?.Message.Contains("validade") == true)
            return BadRequest(new { message = "Data de validade inválida" });
        
        throw;
    }
    
    return Ok(lote);
}
```

**⚠️ REGRA CRÍTICA**: `precocompra` é **IMUTÁVEL** e **NÃO** deve ser atualizado.

**Triggers Executados**:
- `valida_lote()` - Valida que `dataValidade` não está vencida

---

## 📅 AGENDAMENTOS

### 1. Listar Todos os Agendamentos

**TypeScript (Atual)**:
```typescript
const { data, error } = await supabase
  .from('agendamento')
  .select(`
    *,
    cliente(*),
    funcionario(*),
    lote(*, vacina(*))
  `)
  .order('dataagendada', { ascending: true });
```

**C# (Proposto)**:
```csharp
// GET /api/agendamentos
[HttpGet]
[Authorize]
public async Task<IActionResult> GetAgendamentos(
    [FromQuery] string? status = null,
    [FromQuery] DateTime? dataInicio = null,
    [FromQuery] DateTime? dataFim = null)
{
    var query = _context.Agendamentos
        .Include(a => a.Cliente)
        .Include(a => a.Funcionario)
        .Include(a => a.Lote)
            .ThenInclude(l => l.Vacina)
        .AsQueryable();
    
    if (!string.IsNullOrEmpty(status))
        query = query.Where(a => a.Status.ToString() == status);
    
    if (dataInicio.HasValue)
        query = query.Where(a => a.DataAgendada >= dataInicio.Value);
    
    if (dataFim.HasValue)
        query = query.Where(a => a.DataAgendada <= dataFim.Value);
    
    var agendamentos = await query
        .OrderBy(a => a.DataAgendada)
        .ToListAsync();
    
    return Ok(agendamentos);
}
```

**Response**:
```json
[
  {
    "idAgendamento": 1,
    "dataAgendada": "2025-10-15T10:00:00",
    "status": "AGENDADO",
    "observacoes": null,
    "clienteCpf": "12345678901",
    "funcionarioId": null,
    "loteNumLote": 1,
    "cliente": {
      "cpf": "12345678901",
      "nomeCompleto": "João Silva"
    },
    "funcionario": null,
    "lote": {
      "numLote": 1,
      "codigoLote": "LOT2024001",
      "vacina": {
        "idVacina": 1,
        "nome": "COVID-19 Pfizer"
      }
    }
  }
]
```

---

### 2. Criar Novo Agendamento

**TypeScript (Atual)**:
```typescript
const { data, error } = await supabase
  .from('agendamento')
  .insert([{
    dataAgendada: agendamento.dataAgendada,
    observacoes: agendamento.observacoes,
    Cliente_CPF: agendamento.Cliente_CPF,
    Funcionario_idFuncionario: 0, // ou null
    Lote_numLote: agendamento.Lote_numLote
  }]);
```

**C# (Proposto)**:
```csharp
// POST /api/agendamentos
[HttpPost]
[Authorize]
public async Task<IActionResult> CreateAgendamento([FromBody] AgendamentoDto dto)
{
    var validator = new AgendamentoValidator();
    var validationResult = await validator.ValidateAsync(dto);
    
    if (!validationResult.IsValid)
        return BadRequest(validationResult.Errors);
    
    // Verificar se lote tem estoque
    var lote = await _context.Lotes.FindAsync(dto.LoteNumLote);
    if (lote == null)
        return NotFound(new { message = "Lote não encontrado" });
    
    if (lote.QuantidadeDisponivel <= 0)
        return BadRequest(new { message = "Lote sem estoque disponível" });
    
    // Verificar se cliente existe
    var cliente = await _context.Clientes.FindAsync(dto.ClienteCpf);
    if (cliente == null)
        return NotFound(new { message = "Cliente não encontrado" });
    
    var agendamento = _mapper.Map<Agendamento>(dto);
    _context.Agendamentos.Add(agendamento);
    
    try
    {
        await _context.SaveChangesAsync();
    }
    catch (DbUpdateException ex)
    {
        if (ex.InnerException?.Message.Contains("data do agendamento") == true)
            return BadRequest(new { message = "Data deve ser no futuro" });
        
        if (ex.InnerException?.Message.Contains("estoque") == true)
            return BadRequest(new { message = "Sem estoque disponível" });
        
        throw;
    }
    
    return CreatedAtAction(nameof(GetAgendamento), 
        new { id = agendamento.IdAgendamento }, 
        agendamento);
}
```

**Triggers Executados**:
- `valida_agendamento()` - Valida que `dataAgendada` é no futuro
- `reserva_estoque_ao_agendar()` - Decrementa `lote.quantidadeDisponivel`

---

### 3. Deletar Agendamento (Cancelar)

**TypeScript (Atual)**:
```typescript
const { error } = await supabase
  .from('agendamento')
  .delete()
  .eq('idagendamento', id);
```

**C# (Proposto)**:
```csharp
// DELETE /api/agendamentos/{id}
[HttpDelete("{id}")]
[Authorize]
public async Task<IActionResult> DeleteAgendamento(int id)
{
    var agendamento = await _context.Agendamentos.FindAsync(id);
    if (agendamento == null)
        return NotFound(new { message = "Agendamento não encontrado" });
    
    _context.Agendamentos.Remove(agendamento);
    
    try
    {
        await _context.SaveChangesAsync();
    }
    catch (DbUpdateException ex)
    {
        return BadRequest(new { message = "Erro ao cancelar agendamento" });
    }
    
    return NoContent();
}
```

**Triggers Executados**:
- `retorna_estoque_ao_cancelar()` - Se `status = 'AGENDADO'`, incrementa `lote.quantidadeDisponivel`

---

## 💊 APLICAÇÕES

### 1. Listar Todas as Aplicações

**TypeScript (Atual)**:
```typescript
const { data, error } = await supabase
  .from('aplicacao')
  .select(`
    *,
    cliente(*),
    funcionario(*),
    agendamento(*, lote(*, vacina(*)))
  `)
  .order('dataaplicacao', { ascending: false });
```

**C# (Proposto)**:
```csharp
// GET /api/aplicacoes
[HttpGet]
[Authorize]
public async Task<IActionResult> GetAplicacoes(
    [FromQuery] DateTime? dataInicio = null,
    [FromQuery] DateTime? dataFim = null,
    [FromQuery] string? clienteCpf = null)
{
    var query = _context.Aplicacoes
        .Include(a => a.Cliente)
        .Include(a => a.Funcionario)
        .Include(a => a.Agendamento)
            .ThenInclude(ag => ag.Lote)
                .ThenInclude(l => l.Vacina)
        .AsQueryable();
    
    if (dataInicio.HasValue)
        query = query.Where(a => a.DataAplicacao >= dataInicio.Value);
    
    if (dataFim.HasValue)
        query = query.Where(a => a.DataAplicacao <= dataFim.Value);
    
    if (!string.IsNullOrEmpty(clienteCpf))
        query = query.Where(a => a.ClienteCpf == clienteCpf);
    
    var aplicacoes = await query
        .OrderByDescending(a => a.DataAplicacao)
        .ToListAsync();
    
    return Ok(aplicacoes);
}
```

---

### 2. Criar Nova Aplicação

**TypeScript (Atual)**:
```typescript
const { data, error } = await supabase
  .from('aplicacao')
  .insert([{
    dataAplicacao: aplicacao.dataAplicacao,
    dose: aplicacao.dose,
    reacoesAdversas: aplicacao.reacoesAdversas,
    observacoes: aplicacao.observacoes,
    Funcionario_idFuncionario: aplicacao.Funcionario_idFuncionario,
    Cliente_CPF: aplicacao.Cliente_CPF,
    Agendamento_idAgendamento: aplicacao.Agendamento_idAgendamento
  }]);
```

**C# (Proposto)**:
```csharp
// POST /api/aplicacoes
[HttpPost]
[Authorize]
public async Task<IActionResult> CreateAplicacao([FromBody] AplicacaoDto dto)
{
    var validator = new AplicacaoValidator();
    var validationResult = await validator.ValidateAsync(dto);
    
    if (!validationResult.IsValid)
        return BadRequest(validationResult.Errors);
    
    // Verificar se cliente existe
    var cliente = await _context.Clientes.FindAsync(dto.ClienteCpf);
    if (cliente == null)
        return NotFound(new { message = "Cliente não encontrado" });
    
    // Verificar se funcionário existe
    var funcionario = await _context.Funcionarios.FindAsync(dto.FuncionarioId);
    if (funcionario == null)
        return NotFound(new { message = "Funcionário não encontrado" });
    
    // Se tem agendamento, verificar se existe
    if (dto.AgendamentoId.HasValue)
    {
        var agendamento = await _context.Agendamentos.FindAsync(dto.AgendamentoId.Value);
        if (agendamento == null)
            return NotFound(new { message = "Agendamento não encontrado" });
    }
    
    var aplicacao = _mapper.Map<Aplicacao>(dto);
    _context.Aplicacoes.Add(aplicacao);
    
    try
    {
        await _context.SaveChangesAsync();
    }
    catch (DbUpdateException ex)
    {
        if (ex.InnerException?.Message.Contains("data da aplicação") == true)
            return BadRequest(new { message = "Data não pode ser no futuro" });
        
        throw;
    }
    
    return CreatedAtAction(nameof(GetAplicacao), 
        new { id = aplicacao.IdAplicacao }, 
        aplicacao);
}
```

**Triggers Executados**:
- `valida_aplicacao()` - Valida que `dataAplicacao` não é no futuro
- `finaliza_agendamento_apos_aplicacao()` - Se `agendamento_idagendamento` fornecido:
  1. Atualiza `agendamento.status` para 'REALIZADO'
  2. Deleta o agendamento

---

## 📊 DASHBOARD

### Estatísticas Gerais

**TypeScript (Atual)**:
```typescript
// Múltiplas queries
const { data: clientes } = await supabase.from('cliente').select('cpf');
const { data: funcionarios } = await supabase.from('funcionario').select('idfuncionario');
const { data: vacinas } = await supabase.from('vacina').select('idvacina');
const { data: aplicacoesHoje } = await supabase
  .from('aplicacao')
  .select('idaplicacao')
  .eq('dataaplicacao', today);
const { data: agendamentosHoje } = await supabase
  .from('agendamento')
  .select('idagendamento')
  .gte('dataagendada', todayStart)
  .lt('dataagendada', tomorrowStart);
```

**C# (Proposto)**:
```csharp
// GET /api/dashboard/stats
[HttpGet("stats")]
[Authorize]
public async Task<IActionResult> GetDashboardStats()
{
    var hoje = DateTime.Today;
    var amanha = hoje.AddDays(1);
    
    var stats = new
    {
        totalClientes = await _context.Clientes.CountAsync(),
        totalFuncionarios = await _context.Funcionarios.CountAsync(),
        totalVacinas = await _context.Vacinas.CountAsync(),
        vacinacoesHoje = await _context.Aplicacoes
            .Where(a => a.DataAplicacao == hoje)
            .CountAsync(),
        agendamentosHoje = await _context.Agendamentos
            .Where(a => a.DataAgendada >= hoje && a.DataAgendada < amanha)
            .CountAsync()
    };
    
    return Ok(stats);
}
```

**Response**:
```json
{
  "totalClientes": 150,
  "totalFuncionarios": 10,
  "totalVacinas": 8,
  "vacinacoesHoje": 5,
  "agendamentosHoje": 12
}
```

---

### Lotes Vencendo

**C# (Proposto)**:
```csharp
// GET /api/dashboard/lotes-vencendo
[HttpGet("lotes-vencendo")]
[Authorize]
public async Task<IActionResult> GetLotesVencendo([FromQuery] int dias = 30)
{
    var dataLimite = DateTime.Today.AddDays(dias);
    
    var lotes = await _context.Lotes
        .Include(l => l.Vacina)
        .Where(l => l.DataValidade <= dataLimite && l.DataValidade >= DateTime.Today)
        .Where(l => l.QuantidadeDisponivel > 0)
        .OrderBy(l => l.DataValidade)
        .ToListAsync();
    
    return Ok(lotes);
}
```

---

## 📝 Resumo de Endpoints

### Total: **42 endpoints**

#### AUTENTICAÇÃO (3)
- POST /api/auth/login
- POST /api/auth/logout
- POST /api/auth/refresh

#### CLIENTES (6)
- GET /api/clientes
- GET /api/clientes/{cpf}
- POST /api/clientes
- PUT /api/clientes/{cpf}
- DELETE /api/clientes/{cpf}
- GET /api/clientes/stats

#### FUNCIONÁRIOS (5)
- GET /api/funcionarios
- GET /api/funcionarios/{id}
- POST /api/funcionarios
- PUT /api/funcionarios/{id}
- GET /api/funcionarios/stats

#### VACINAS (6)
- GET /api/vacinas
- GET /api/vacinas/{id}
- POST /api/vacinas
- PUT /api/vacinas/{id}
- DELETE /api/vacinas/{id}
- GET /api/vacinas/stats

#### LOTES (6)
- GET /api/lotes
- GET /api/lotes/{id}
- POST /api/lotes
- PUT /api/lotes/{id}
- DELETE /api/lotes/{id}
- GET /api/lotes/vencendo

#### AGENDAMENTOS (6)
- GET /api/agendamentos
- GET /api/agendamentos/{id}
- POST /api/agendamentos
- PUT /api/agendamentos/{id}
- DELETE /api/agendamentos/{id}
- GET /api/agendamentos/proximos

#### APLICAÇÕES (5)
- GET /api/aplicacoes
- GET /api/aplicacoes/{id}
- POST /api/aplicacoes
- GET /api/aplicacoes/cliente/{cpf}
- GET /api/aplicacoes/recentes

#### DASHBOARD (3)
- GET /api/dashboard/stats
- GET /api/dashboard/lotes-vencendo
- GET /api/dashboard/aplicacoes-recentes

#### HISTÓRICO (2)
- GET /api/historico
- GET /api/historico/cliente/{cpf}

---

**Documento gerado em**: 2025-10-14  
**Versão do Sistema**: 1.0.0
