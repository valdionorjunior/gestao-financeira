# Template: Documentação de APIs

## Índice de Endpoints

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| GET    | /api/usuarios | Lista usuários | JWT |
| POST   | /api/usuarios | Cria usuário | Não |
| PUT    | /api/usuarios/{id} | Atualiza usuário | JWT |
| DELETE | /api/usuarios/{id} | Remove usuário | JWT |

## Endpoints Detalhados

### GET /api/exemplo

**Descrição**: Busca uma lista de exemplos com filtros opcionais

**Autenticação**: Bearer Token JWT

**Parâmetros de Query**:
- `page` (integer, opcional): Página para paginação (default: 1)
- `limit` (integer, opcional): Itens por página (default: 10, max: 100)
- `status` (string, opcional): Filtro por status (`ativo`, `inativo`)
- `search` (string, opcional): Busca de texto nos campos nome/descrição

**Headers obrigatórios**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Example**:
```http
GET /api/exemplo?page=1&limit=20&status=ativo
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response Success (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nome": "Exemplo 1",
      "status": "ativo",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 87,
    "itemsPerPage": 20
  }
}
```

**Response Error (400)**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "O parâmetro 'limit' deve ser entre 1 e 100",
    "field": "limit"
  }
}
```

**Response Error (401)**:
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Token inválido ou expirado"
  }
}
```

**Regras de Negócio**:
- Apenas usuários autenticados podem acessar
- Máximo de 100 itens por página
- Busca de texto ignora acentos e case
- Status padrão: todos os registros

---

### POST /api/exemplo

**Descrição**: Cria um novo exemplo no sistema

**Autenticação**: Bearer Token JWT

**Headers obrigatórios**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body**:
```json
{
  "nome": "string (obrigatório, 3-100 caracteres)",
  "descricao": "string (opcional, max 500 caracteres)",
  "categoria": "string (obrigatório, valores: A, B, C)",
  "valor": "number (obrigatório, > 0)",
  "tags": ["string"] // opcional, array de strings
}
```

**Request Example**:
```json
{
  "nome": "Novo Exemplo",
  "descricao": "Descrição detalhada do exemplo",
  "categoria": "A",
  "valor": 299.99,
  "tags": ["importante", "novo"]
}
```

**Response Success (201)**:
```json
{
  "success": true,
  "data": {
    "id": 123,
    "nome": "Novo Exemplo",
    "descricao": "Descrição detalhada do exemplo",
    "categoria": "A",
    "valor": 299.99,
    "tags": ["importante", "novo"],
    "status": "ativo",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Response Error (422)**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados inválidos",
    "details": [
      {
        "field": "nome",
        "message": "Nome é obrigatório"
      },
      {
        "field": "valor",
        "message": "Valor deve ser maior que zero"
      }
    ]
  }
}
```

**Regras de Negócio**:
- Nome deve ser único no sistema
- Valor não pode ser negativo
- Categoria deve existir no sistema
- Tags são opcionais mas devem ser válidas
- Status inicia sempre como "ativo"
- Usuário que cria fica como "owner"

---

## Códigos de Status HTTP

| Código | Significado | Quando usar |
|--------|-------------|-------------|
| 200 | OK | Sucesso em GET, PUT |
| 201 | Created | Sucesso em POST (criação) |
| 204 | No Content | Sucesso em DELETE |
| 400 | Bad Request | Dados mal formatados |
| 401 | Unauthorized | Token inválido/ausente |
| 403 | Forbidden | Usuário sem permissão |
| 404 | Not Found | Recurso não encontrado |
| 422 | Unprocessable Entity | Dados inválidos/validação |
| 500 | Internal Server Error | Erro interno do servidor |

## Estrutura Padrão de Response

### Sucesso:
```json
{
  "success": true,
  "data": {}, // ou [] para arrays
  "pagination": {}, // apenas em listagens
  "meta": {} // informações adicionais opcionais
}
```

### Erro:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Mensagem de erro",
    "field": "campo", // opcional, para erros de validação
    "details": [] // opcional, array de erros detalhados
  }
}
```

## Autenticação e Autorização

### JWT Token
- **Expiração**: 2 horas
- **Refresh**: Endpoint dedicado para renovar
- **Header**: `Authorization: Bearer {token}`

### Permissões
- **admin**: Acesso total ao sistema
- **user**: Acesso aos próprios recursos
- **readonly**: Apenas leitura

## Rate Limiting

- **Limite**: 100 requests por minuto por usuário
- **Headers de resposta**:
  - `X-Rate-Limit-Limit`: Limite máximo
  - `X-Rate-Limit-Remaining`: Requests restantes
  - `X-Rate-Limit-Reset`: Timestamp do reset

**Response ao atingir limite (429)**:
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Muitas requests. Tente novamente em alguns minutos."
  }
}
```