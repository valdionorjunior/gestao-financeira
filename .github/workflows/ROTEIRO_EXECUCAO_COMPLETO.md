# Roteiro de Execução Completa - Aplicação de Gestão Financeira

Este documento fornece o passo a passo completo para desenvolver a aplicação de gestão financeira do zero usando o agente especializado e os prompts criados.

## ⚠️ Pré-requisitos

- VS Code com GitHub Copilot
- Docker e Docker Compose instalados  
- Node.js 24+ e npm/yarn
- PostgreSQL 15+ (ou via Docker)
- Git configurado

## 🚀 Execução Completa

### **Fase 1: Fundação do Projeto**

#### Etapa 1.1 - Setup Inicial
```
/prompt-gestao-financeira
Execução atual: Setup inicial completo do projeto - criar estrutura de pastas, configurar Docker, package.json, tsconfig, eslint e variáveis de ambiente
```

**Validação:**
- [ ] Estrutura de pastas criada corretamente
- [ ] Docker-compose.yml funcional  
- [ ] Variáveis de ambiente configuradas
- [ ] `npm install` executa sem erros

#### Etapa 1.2 - Configuração do Banco
```
/prompt-banco-migracoes-gestao-financeira
Execução atual: Configuração inicial do PostgreSQL com Flyway - setup de conexão, configuração de migrations e estrutura básica
```

**Validação:**
- [ ] Conexão com banco estabelecida
- [ ] Flyway configurado corretamente
- [ ] Pasta migrations/ criada

---

### **Fase 2: Modelo de Dados e Migrações**

#### Etapa 2.1 - Entidades Base
```
/prompt-banco-migracoes-gestao-financeira
Execução atual: Criar migrações Flyway para entidades User, Family e FamilyMember com relacionamentos e constraints
```

#### Etapa 2.2 - Entidades Financeiras Core
```
/prompt-banco-migracoes-gestao-financeira
Execução atual: Criar migrações para Account, Category, Subcategory com tipos financeiros e validações
```

#### Etapa 2.3 - Entidades de Transações  
```
/prompt-banco-migracoes-gestao-financeira
Execução atual: Criar migração da tabela Transaction com campos monetários, relacionamentos e índices de performance
```

#### Etapa 2.4 - Entidades Complementares
```
/prompt-banco-migracoes-gestao-financeira
Execução atual: Criar migrações para Investment, Budget, Goal, AuditLog e BankStatement
```

#### Etapa 2.5 - Seeds Iniciais
```
/prompt-banco-migracoes-gestao-financeira
Execução atual: Criar repeatable migrations para categorias padrão e dados iniciais do sistema
```

**Validação da Fase 2:**
- [ ] Todas as migrações executam sem erro
- [ ] Schema do banco reflete o modelo esperado
- [ ] Categorias padrão foram inseridas
- [ ] Relacionamentos funcionam corretamente

---

### **Fase 3: Autenticação e Autorização**

#### Etapa 3.1 - Entidades de Domínio
```
/prompt-autenticacao-gestao-financeira
Execução atual: Criar entidades User, Family e FamilyMember seguindo DDD com validações de domínio
```

#### Etapa 3.2 - DTOs e Validações
```
/prompt-autenticacao-gestao-financeira
Execução atual: Criar DTOs para registro, login e atualização de usuário com validações robustas
```

#### Etapa 3.3 - Estratégias JWT
```
/prompt-autenticacao-gestao-financeira
Execução atual: Implementar JWT strategy, Passport configuration e refresh token rotation
```

#### Etapa 3.4 - Guards e Middlewares
```
/prompt-autenticacao-gestao-financeira
Execução atual: Criar guards de autenticação, RBAC e middlewares de autorização financeira
```

#### Etapa 3.5 - Controllers de Auth
```
/prompt-autenticacao-gestao-financeira
Execução atual: Implementar endpoints de registro, login, refresh, logout e recuperação de senha
```

**Validação da Fase 3:**
- [ ] Registro de usuário funciona
- [ ] Login retorna JWT válido
- [ ] Refresh token rotation implementado
- [ ] RBAC protege rotas adequadamente
- [ ] Logout invalida tokens

---

### **Fase 4: Módulos Financeiros Core**

#### Etapa 4.1 - Contas Bancárias
```
/prompt-transacoes-gestao-financeira
Execução atual: CRUD de contas bancárias com validações financeiras e controle de saldo
```

#### Etapa 4.2 - Categorias e Subcategorias
```
/prompt-transacoes-gestao-financeira
Execução atual: CRUD de categorias financeiras com hierarquia e validações de negócio
```

#### Etapa 4.3 - Transações Base
```
/prompt-transacoes-gestao-financeira
Execução atual: CRUD de transações com validações monetárias e atualização de saldo
```

#### Etapa 4.4 - Transferências
```
/prompt-transacoes-gestao-financeira
Execução atual: Implementar transferências entre contas com consistência transacional e validações
```

#### Etapa 4.5 - Filtros e Listagens
```
/prompt-transacoes-gestao-financeira
Execução atual: Endpoints de listagem com filtros avançados, paginação e ordenação
```

**Validação da Fase 4:**
- [ ] Contas podem ser criadas e gerenciadas
- [ ] Transações atualizam saldos corretamente  
- [ ] Transferências são atomicamente consistentes
- [ ] Filtros e busca funcionam

---

### **Fase 5: Módulos Avançados**

#### Etapa 5.1 - Orçamentos
```
/prompt-gestao-financeira
Execução atual: CRUD de orçamentos com cálculos automáticos de progresso e alertas por categoria
```

#### Etapa 5.2 - Metas Financeiras
```
/prompt-gestao-financeira
Execução atual: CRUD de metas financeiras com tracking de progresso e notificações
```

#### Etapa 5.3 - Investimentos
```
/prompt-gestao-financeira
Execução atual: CRUD de investimentos com controle de aportes e cálculo de rentabilidade
```

**Validação da Fase 5:**
- [ ] Orçamentos calculam progresso automaticamente
- [ ] Metas trackam contribuições corretamente
- [ ] Investimentos gerenciam aportes

---

### **Fase 6: Relatórios e Analytics**

#### Etapa 6.1 - Resumos Mensais/Anuais
```
/prompt-relatorios-gestao-financeira
Execução atual: Endpoints de resumo mensal e anual com agregações de receita vs despesa
```

#### Etapa 6.2 - Gastos por Categoria
```
/prompt-relatorios-gestao-financeira
Execução atual: Relatório de gastos por categoria com percentuais e comparações temporais
```

#### Etapa 6.3 - KPIs Dashboard
```
/prompt-relatorios-gestao-financeira
Execução atual: Endpoints de KPIs para dashboard - saldo total, taxa de poupança, maiores gastos
```

#### Etapa 6.4 - Fluxo de Caixa
```
/prompt-relatorios-gestao-financeira
Execução atual: Relatório de fluxo de caixa com projeções e evolução temporal
```

**Validação da Fase 6:**
- [ ] Relatórios retornam dados corretos
- [ ] Agregações batem com transações
- [ ] KPIs calculam valores precisos

---

### **Fase 7: Frontend - Fundação**

#### Etapa 7.1 - Setup React + Tailwind
```
/prompt-gestao-financeira
Execução atual: Setup do frontend React com Tailwind CSS, roteamento e estrutura base seguindo Soft UI Dashboard
```

#### Etapa 7.2 - Componentes Base
```
/prompt-gestao-financeira
Execução atual: Criar componentes base financeiros - Money Input, KPI Card, Loading States seguindo Soft UI
```

#### Etapa 7.3 - Autenticação Frontend
```
/prompt-gestao-financeira
Execução atual: Telas de login e registro com validação, guards de rota e interceptors JWT
```

**Validação da Fase 7:**  
- [ ] React app roda sem erros
- [ ] Tailwind CSS configurado
- [ ] Login/registro funcionam
- [ ] Guards protegem rotas

---

### **Fase 8: Frontend - Dashboards e Módulos**

#### Etapa 8.1 - Dashboard Principal
```
/prompt-gestao-financeira
Execução atual: Dashboard principal com cards KPI, gráficos interativos e layout Soft UI Dashboard Tailwind
```

#### Etapa 8.2 - Tela de Transações
```
/prompt-gestao-financeira
Execução atual: Tela de transações com tabela, filtros, formulário de criação/edição e validação monetária
```

#### Etapa 8.3 - Tela de Contas
```
/prompt-gestao-financeira
Execução atual: Tela de contas com listagem, saldos, histórico e gerenciamento visual
```

#### Etapa 8.4 - Tela de Orçamentos  
```
/prompt-gestao-financeira
Execução atual: Tela de orçamentos com barras de progresso, alertas e comparações visuais
```

#### Etapa 8.5 - Tela de Relatórios
```
/prompt-gestao-financeira
Execução atual: Tela de relatórios com gráficos Chart.js, filtros dinâmicos e exportação
```

**Validação da Fase 8:**
- [ ] Dashboard exibe KPIs corretos
- [ ] Transações podem ser gerenciadas
- [ ] Gráficos renderizam dados reais
- [ ] Interface responsiva funciona

---

### **Fase 9: Funcionalidades Avançadas**

#### Etapa 9.1 - Conciliação Bancária
```
/prompt-gestao-financeira
Execução atual: Upload de extratos OFX/CSV com parser, pré-visualização e conciliação de transações
```

#### Etapa 9.2 - Módulo de IA - Categorização
```
/prompt-gestao-financeira
Execução atual: IA para categorização automática de transações usando OpenAI API ou NLP simples
```

#### Etapa 9.3 - Insights Financeiros
```
/prompt-gestao-financeira
Execução atual: Geração de insights financeiros automatizados com análise de padrões e sugestões
```

#### Etapa 9.4 - OCR de Recibos
```
/prompt-gestao-financeira
Execução atual: Upload e processamento de fotos de recibos com OCR e criação automática de transações
```

**Validação da Fase 9:**
- [ ] Upload funciona corretamente
- [ ] IA categoriza com precisão razoável
- [ ] Insights são relevantes
- [ ] OCR extrai dados básicos

---

### **Fase 10: Documentação e Qualidade**

#### Etapa 10.1 - Swagger/OpenAPI
```
/prompt-gestao-financeira
Execução atual: Documentação completa Swagger para todos os endpoints com exemplos e schemas
```

#### Etapa 10.2 - Testes Unitários Backend
```
/prompt-gestao-financeira
Execução atual: Testes unitários para domínio, aplicação e infraestrutura com cobertura mínima 80%
```

#### Etapa 10.3 - Testes Unitários Frontend  
```
/prompt-gestao-financeira
Execução atual: Testes Vitest para componentes React, hooks e services com cobertura adequada
```

#### Etapa 10.4 - Testes de Integração
```
/prompt-gestao-financeira
Execução atual: Testes de integração para endpoints críticos financeiros e fluxos completos
```

**Validação da Fase 10:**
- [ ] Swagger acessível e completo
- [ ] Cobertura de testes ≥ 80%
- [ ] Testes passam em CI
- [ ] Fluxos críticos testados

---

### **Fase 11: Segurança e Conformidade**

#### Etapa 11.1 - Hardening de Segurança
```
/prompt-gestao-financeira
Execução atual: Rate limiting, validação robusta, headers de segurança e proteção contra ataques
```

#### Etapa 11.2 - LGPD/Conformidade
```
/prompt-gestao-financeira
Execução atual: Endpoints LGPD para exportação, exclusão de dados e gestão de consentimento
```

#### Etapa 11.3 - Auditoria Completa
```
/prompt-gestao-financeira
Execução atual: Sistema de auditoria completo para todas as operações financeiras críticas
```

#### Etapa 11.4 - Criptografia de Dados
```
/prompt-gestao-financeira
Execução atual: Criptografia AES-256 para campos sensíveis e gestão segura de chaves
```

**Validação da Fase 11:**
- [ ] Pentest básico não encontra vulnerabilidades óbvias
- [ ] LGPD implementado corretamente  
- [ ] Auditoria registra operações críticas
- [ ] Dados sensíveis criptografados

---

### **Fase 12: Deploy e Finalização**

#### Etapa 12.1 - Containerização
```
/prompt-gestao-financeira
Execução atual: Dockerfiles otimizados para produção e docker-compose para diferentes ambientes
```

#### Etapa 12.2 - CI/CD Pipeline
```
/prompt-gestao-financeira
Execução atual: GitHub Actions com build, testes, security scan e deploy automatizado
```

#### Etapa 12.3 - Monitoramento
```
/prompt-gestao-financeira
Execução atual: Logs estruturados, health checks e métricas básicas de aplicação
```

#### Etapa 12.4 - Documentação Final
```
/prompt-gestao-financeira
Execução atual: README completo, guia de instalação, guia de contribuição e documentação de usuário
```

**Validação Final:**
- [ ] Aplicação roda em containers
- [ ] CI/CD funciona end-to-end
- [ ] Health checks respondem
- [ ] Documentação está completa

---

## 🎯 Checklist Final da Aplicação

### Backend
- [ ] API RESTful completa e documentada
- [ ] Autenticação JWT robusta com RBAC
- [ ] Todas as entidades financeiras implementadas
- [ ] Relatórios e analytics funcionais
- [ ] Segurança e conformidade LGPD
- [ ] Testes com cobertura adequada
- [ ] Auditoria de operações críticas

### Frontend  
- [ ] Interface responsiva e acessível
- [ ] Dashboard com KPIs em tempo real
- [ ] Formulários com validação robusta
- [ ] Gráficos e visualizações interativas
- [ ] Integração completa com API
- [ ] Estados de loading e erro tratados
- [ ] Design seguindo Soft UI Dashboard

### DevOps
- [ ] Containerização com Docker
- [ ] CI/CD funcional
- [ ] Monitoramento básico  
- [ ] Deploy automatizado
- [ ] Backups de banco configurados

### Qualidade
- [ ] Código segue padrões definidos
- [ ] Performance adequada
- [ ] Tratamento de erros robusto
- [ ] Logs estruturados
- [ ] Documentação completa

---

## 💡 Dicas de Execução

1. **Execute uma etapa por vez** - Nunca pule validações
2. **Teste frequentemente** - Valide cada fase antes de avançar
3. **Use os prompts específicos** - Eles têm validações especializadas  
4. **Monitore erros** - Corrija problemas imediatamente
5. **Documente mudanças** - Mantenha registro das customizações

## 🆘 Troubleshooting

- **Erro de migração**: `/prompt-banco-migracoes-gestao-financeira` para correções específicas
- **Problema de autenticação**: `/prompt-autenticacao-gestao-financeira` para debugging  
- **Bug financeiro**: `/prompt-transacoes-gestao-financeira` para consistência de dados
- **Questão de UI**: Use skills `frontend-financeiro` automaticamente ativadas

---

**Tempo estimado total: 40-60 horas de desenvolvimento**  
**Complexidade: Alta (sistema financeiro completo)**  
**Skills necessárias: Full-stack, segurança, compliance**