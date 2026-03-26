---
name: documentacao-funcional
description: "Cria documentação funcional abrangente da aplicação. Use when: documentar APIs, fluxos de usuário, regras de negócio, arquitetura de sistema, casos de uso, requisitos funcionais, especificações técnicas. Analisa o código e gera documentação estruturada em Markdown com diagramas Mermaid."
---

# Documentação Funcional

## Workflow

### 1. Análise e Descoberta
- Explorar a estrutura do projeto com semantic_search
- Identificar arquivos principais (controllers, services, models, routes)
- Mapear endpoints e APIs disponíveis
- Entender a arquitetura e tecnologias utilizadas
- Identificar padrões de negócio e regras implementadas

### 2. Estruturação da Documentação
Com base na análise, criar documentação organizada:

#### 2.1 Visão Geral do Sistema
```markdown
# Documentação Funcional - [Nome da Aplicação]

## Visão Geral
- Propósito e objetivos da aplicação
- Principais funcionalidades
- Tecnologias utilizadas
- Arquitetura geral

## Arquitetura do Sistema
[Diagrama Mermaid da arquitetura]
```

#### 2.2 Documentação de APIs
Para cada endpoint identificado:
```markdown
## API Endpoints

### [Método] /caminho/endpoint
**Descrição**: Funcionalidade do endpoint
**Parâmetros**:
- param1 (tipo): descrição
- param2 (tipo): descrição

**Request Example**:
\`\`\`json
{
  "exemplo": "dados"
}
\`\`\`

**Response Example**:
\`\`\`json
{
  "resposta": "exemplo"
}
\`\`\`

**Regras de Negócio**:
- Validação 1
- Regra 2
- Comportamento 3
```

#### 2.3 Fluxos de Usuário
```markdown
## Fluxos de Usuário

### Fluxo: [Nome do Fluxo]
\`\`\`mermaid
flowchart TD
    A[Início] --> B[Ação 1]
    B --> C{Decisão}
    C -->|Sim| D[Ação 2]
    C -->|Não| E[Ação Alternativa]
    D --> F[Fim]
    E --> F
\`\`\`

**Passos**:
1. Passo 1: Descrição
2. Passo 2: Descrição
3. Passo 3: Descrição

**Regras de Negócio**:
- Regra aplicada no passo X
- Validação no passo Y
```

#### 2.4 Casos de Uso
```markdown
## Casos de Uso

### UC001 - [Nome do Caso de Uso]
**Ator**: Usuário do sistema
**Pré-condições**: 
- Condição 1
- Condição 2

**Fluxo Principal**:
1. Usuário faz ação X
2. Sistema valida dados
3. Sistema executa operação
4. Sistema retorna resultado

**Fluxos Alternativos**:
- 2a. Dados inválidos: Sistema exibe mensagem de erro

**Pós-condições**:
- Estado final do sistema
```

#### 2.5 Modelo de Dados
```markdown
## Modelo de Dados

\`\`\`mermaid
erDiagram
    USUARIO ||--o{ TRANSACAO : possui
    USUARIO {
        id int PK
        nome string
        email string
        created_at timestamp
    }
    TRANSACAO {
        id int PK
        valor decimal
        descricao string
        data timestamp
        usuario_id int FK
    }
\`\`\`

### Entidade: [Nome]
- **Campo1** (tipo): Descrição e regras
- **Campo2** (tipo): Descrição e regras
```

### 3. Organização dos Arquivos
Criar estrutura de documentação organizada:

```
docs/
├── funcional/
│   ├── README.md (índice principal)
│   ├── arquitetura.md
│   ├── apis/
│   │   ├── endpoints.md
│   │   └── especificacoes.md
│   ├── fluxos/
│   │   ├── usuarios.md
│   │   └── processos.md
│   ├── casos-de-uso/
│   │   └── casos-de-uso.md
│   └── modelo-dados/
│       └── entidades.md
```

## Templates Incluídos

### Template: README Principal
```markdown
# Documentação Funcional

## Índice
- [Arquitetura do Sistema](arquitetura.md)
- [APIs e Endpoints](apis/endpoints.md)
- [Fluxos de Usuário](fluxos/usuarios.md)
- [Casos de Uso](casos-de-uso/casos-de-uso.md)
- [Modelo de Dados](modelo-dados/entidades.md)

## Como Usar Esta Documentação
Esta documentação descreve as funcionalidades do sistema do ponto de vista do usuário e dos requisitos de negócio.

### Para Desenvolvedores
- Consulte [Arquitetura](arquitetura.md) para entender a estrutura
- Veja [APIs](apis/endpoints.md) para integração

### Para Analistas e PMs
- Consulte [Casos de Uso](casos-de-uso/casos-de-uso.md)
- Veja [Fluxos de Usuário](fluxos/usuarios.md)

## Última Atualização
[Data da última atualização]
```

## Instruções de Execução

1. **Análise Inicial**: Use `semantic_search` para explorar o projeto inteiro
2. **Identificação de Patterns**: Procure por:
   - Controllers/Routes para APIs
   - Services para regras de negócio  
   - Models/Entities para estrutura de dados
   - Componentes frontend para fluxos de UI

3. **Geração Incremental**: Crie documentação por seções:
   - Primeiro: visão geral e arquitetura
   - Segundo: APIs mais importantes
   - Terceiro: fluxos críticos de usuário
   - Quarto: casos de uso detalhados

4. **Validação**: Para cada seção criada:
   - Verificar se informações estão corretas com o código
   - Confirmar se diagramas Mermaid estão válidos
   - Assegurar que regras de negócio estão completas

## Ferramentas

- `semantic_search`: Para encontrar código relevante
- `read_file`: Para analisar arquivos específicos  
- `renderMermaidDiagram`: Para validar diagramas
- `create_file`: Para gerar documentação
- `runSubagent`: Para análise profunda do código quando necessário

## Saída

Ao final, você terá:
- Documentação estruturada e organizada
- Diagramas visuais em Mermaid
- Especificações técnicas e funcionais
- Guias para diferentes tipos de usuários da documentação