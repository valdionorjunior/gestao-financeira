# Template: Fluxos de Usuário

## Índice de Fluxos

1. [Fluxo de Autenticação](#fluxo-de-autenticação)
2. [Fluxo de Cadastro](#fluxo-de-cadastro)
3. [Fluxo Principal (CRUD)](#fluxo-principal-crud)
4. [Fluxo de Recuperação de Senha](#fluxo-de-recuperação-de-senha)

---

## Fluxo de Autenticação

### Visão Geral
Processo pelo qual o usuário acessa o sistema fornecendo credenciais válidas.

### Diagrama do Fluxo
```mermaid
flowchart TD
    A[Usuário acessa login] --> B[Insere email e senha]
    B --> C{Credenciais válidas?}
    C -->|Sim| D[Sistema gera JWT token]
    D --> E[Redireciona para dashboard]
    C -->|Não| F[Mostra erro de autenticação]
    F --> G{Tentativas < 3?}
    G -->|Sim| H[Permite nova tentativa]
    H --> B
    G -->|Não| I[Bloqueia conta temporariamente]
    I --> J[Envia email de notificação]
    E --> K[Usuário logado com sucesso]
```

### Detalhamento dos Passos

#### 1. Usuário acessa tela de login
- **Input**: URL da aplicação
- **Output**: Formulário de login
- **Validações**: Verificar se usuário já está logado

#### 2. Inserção de credenciais
- **Input**: Email e senha
- **Validações client-side**:
  - Email em formato válido
  - Senha não vazia
  - Campos obrigatórios preenchidos

#### 3. Validação server-side
- **Processo**: 
  - Verificar se email existe no banco
  - Comparar hash da senha
  - Verificar se conta não está bloqueada
- **Output**: Token JWT ou mensagem de erro

#### 4. Sucesso - Geração de token
- **Processo**:
  - Criar JWT com dados do usuário
  - Definir tempo de expiração (2h)
  - Registrar log de acesso
- **Output**: Token + dados básicos do usuário

#### 5. Erro - Tratamento de falhas
- **Tipos de erro**:
  - Credenciais inválidas
  - Conta bloqueada
  - Conta inexistente
- **Processo**: Incrementar contador de tentativas

### Regras de Negócio
- **Bloqueio**: Após 3 tentativas incorretas, bloquear por 15 minutos
- **Token**: Expire em 2 horas de inatividade
- **Logs**: Registrar todas as tentativas de login
- **Notificação**: Email em caso de bloqueio de conta

### Casos de Uso Relacionados
- UC001 - Fazer Login
- UC002 - Bloquear Conta por Tentativas
- UC003 - Desbloquear Conta

---

## Fluxo de Cadastro

### Visão Geral
Processo de registro de novo usuário no sistema.

### Diagrama do Fluxo
```mermaid
flowchart TD
    A[Usuário clica 'Cadastrar'] --> B[Preenche formulário]
    B --> C{Dados válidos?}
    C -->|Não| D[Mostra erros de validação]
    D --> B
    C -->|Sim| E{Email já existe?}
    E -->|Sim| F[Erro: Email já cadastrado]
    F --> B
    E -->|Não| G[Cria conta]
    G --> H[Envia email de confirmação]
    H --> I[Mostra tela de confirmação]
    I --> J[Usuário clica no link do email]
    J --> K{Token válido?}
    K -->|Não| L[Erro: Link inválido]
    K -->|Sim| M[Ativa conta]
    M --> N[Redireciona para login]
```

### Campos do Formulário
- **Nome completo** (obrigatório, 2-100 chars)
- **Email** (obrigatório, formato válido, único)
- **Senha** (obrigatório, min 8 chars, 1 maiúscula, 1 número)
- **Confirmação da senha** (deve ser igual à senha)
- **Aceitar termos** (obrigatório, checkbox)

### Validações
#### Client-side:
- Formato do email
- Força da senha
- Confirmação de senha
- Campos obrigatórios

#### Server-side:
- Email único no sistema
- Senha atende critérios de segurança
- Rate limiting (máximo 5 tentativas/minuto)

### Email de Confirmação
```
Assunto: Confirme seu cadastro

Olá [Nome],

Para completar seu cadastro, clique no link abaixo:
[Link de confirmação]

Este link expira em 24 horas.

Se você não se cadastrou, ignore este email.
```

### Regras de Negócio
- **Confirmação**: Conta criada como inativa até confirmar email
- **Expiração**: Link de confirmação válido por 24 horas
- **Rate Limiting**: Máximo 5 cadastros por IP por hora
- **Dados**: Nome e email ficam em minúsculas

---

## Fluxo Principal (CRUD)

### Visão Geral
Operações básicas de Create, Read, Update, Delete para a entidade principal.

### Diagrama de CRUD
```mermaid
flowchart TD
    A[Dashboard] --> B{Ação escolhida}
    B -->|Criar| C[Formulário de criação]
    B -->|Listar| D[Lista com filtros]
    B -->|Editar| E[Formulário de edição]
    B -->|Excluir| F[Confirmação de exclusão]
    
    C --> G[Valida dados]
    G -->|Válido| H[Salva no banco]
    G -->|Inválido| I[Mostra erros]
    H --> J[Sucesso + volta lista]
    I --> C
    
    D --> K[Carrega dados]
    K --> L[Exibe lista paginada]
    L --> M{Ação na lista}
    M -->|Ver| N[Tela de detalhes]
    M -->|Editar| E
    M -->|Excluir| F
    
    E --> O[Carrega dados existentes]
    O --> P[Valida alterações]
    P -->|Válido| Q[Atualiza registro]
    P -->|Inválido| R[Mostra erros]
    Q --> S[Sucesso + volta lista]
    R --> E
    
    F --> T{Confirma exclusão?}
    T -->|Sim| U[Remove do banco]
    T -->|Não| L
    U --> V[Sucesso + volta lista]
```

### Operações Detalhadas

#### CREATE (Criação)
1. **Acesso**: Botão "Novo" na lista
2. **Formulário**: Campos obrigatórios/opcionais
3. **Validação**: Client + server-side
4. **Persistência**: Salvar no banco com audit trail
5. **Feedback**: Mensagem de sucesso + redirecionamento

#### READ (Leitura)
1. **Lista**: Paginada com filtros e busca
2. **Detalhes**: Visualização completa do item
3. **Filtros**: Por status, data, categoria
4. **Busca**: Texto livre em campos principais
5. **Ordenação**: Por diferentes colunas

#### UPDATE (Atualização)
1. **Acesso**: Botão "Editar" na lista/detalhe
2. **Carregamento**: Pré-preencher formulário
3. **Validação**: Verificar mudanças e validar
4. **Persistência**: Atualizar com controle de versão
5. **Feedback**: Mensagem de sucesso

#### DELETE (Exclusão)
1. **Acesso**: Botão "Excluir" na lista/detalhe
2. **Confirmação**: Modal de confirmação
3. **Validação**: Verificar dependências
4. **Exclusão**: Soft delete ou hard delete
5. **Feedback**: Mensagem de confirmação

### Estados dos Registros
```mermaid
stateDiagram-v2
    [*] --> Rascunho
    Rascunho --> Ativo : publicar
    Ativo --> Inativo : desativar
    Inativo --> Ativo : reativar
    Ativo --> Arquivado : arquivar
    Inativo --> Arquivado : arquivar
    Arquivado --> [*] : excluir_permanente
```

### Regras de Negócio
- **Permissões**: Apenas owner ou admin pode editar/excluir
- **Validação**: Campos obrigatórios conforme regra de negócio
- **Auditoria**: Log de todas as operações
- **Soft Delete**: Registros não são removidos fisicamente
- **Versionamento**: Manter histórico de alterações

---

## Mensagens e Feedback

### Tipos de Mensagem
- **Sucesso** (verde): "Operação realizada com sucesso"
- **Erro** (vermelho): "Ocorreu um erro. Tente novamente"
- **Aviso** (amarelo): "Atenção: verifique os dados"
- **Info** (azul): "Informação importante"

### Localização
- **Toast**: Mensagens temporárias (3-5 segundos)
- **Inline**: Erros de validação nos campos
- **Modal**: Confirmações importantes
- **Banner**: Avisos persistentes

### Textos Padrão
```javascript
const MENSAGENS = {
  sucesso: {
    criar: "Registro criado com sucesso",
    atualizar: "Registro atualizado com sucesso", 
    excluir: "Registro excluído com sucesso"
  },
  erro: {
    validacao: "Verifique os campos destacados",
    permissao: "Você não tem permissão para esta ação",
    servidor: "Erro interno. Tente novamente em alguns minutos"
  }
}
```