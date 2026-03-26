# Guia de Uso da Skill de Documentação Funcional

## Como Usar

1. **Ativar a skill**: Digite `/documentacao-funcional` or `/doc-funcional` no chat
2. **Especificar escopo**: Informe qual parte do sistema documentar
3. **Escolher templates**: A skill irá sugerir quais templates aplicar
4. **Revisar e ajustar**: Documentação gerada pode ser refinada

## Comandos Úteis

```
/documentacao-funcional arquitetura
- Gera documentação da arquitetura do sistema

/documentacao-funcional apis
- Documenta todas as APIs/endpoints

/documentacao-funcional fluxos [modulo]
- Documenta fluxos de usuário de um módulo específico

/documentacao-funcional completa
- Gera documentação funcional completa do projeto

/documentacao-funcional casos-de-uso [feature]
- Documenta casos de uso de uma funcionalidade específica
```

## Estrutura de Saída

A skill criará a seguinte estrutura:

```
docs/funcional/
├── README.md                 # Índice principal
├── arquitetura.md           # Visão geral do sistema
├── apis/
│   ├── endpoints.md         # Documentação de APIs
│   └── especificacoes.md    # Especificações técnicas  
├── fluxos/
│   ├── autenticacao.md      # Fluxos de login/logout
│   ├── principais.md        # Fluxos de CRUD
│   └── especializados.md    # Fluxos específicos do domínio
├── casos-de-uso/
│   └── casos-de-uso.md      # Casos de uso detalhados
└── modelo-dados/
    └── entidades.md         # Modelo de dados e relacionamentos
```

## Checklist de Qualidade

Após gerar a documentação, verificar:

### ✅ Completude
- [ ] Todas as APIs principais documentadas
- [ ] Fluxos críticos de usuário cobertos
- [ ] Regras de negócio explícitas
- [ ] Casos de uso com cenários alternativos
- [ ] Modelo de dados atualizado

### ✅ Clareza  
- [ ] Diagramas Mermaid válidos e informativos
- [ ] Linguagem clara e objetiva
- [ ] Exemplos de requests/responses
- [ ] Códigos de erro bem explicados
- [ ] Terminologia consistente

### ✅ Organização
- [ ] Índices e navegação clara
- [ ] Arquivos divididos logicamente
- [ ] Links internos funcionando
- [ ] Estrutura hierárquica coerente
- [ ] Tags e categorização adequada

### ✅ Atualização
- [ ] Data de última revisão
- [ ] Versão da aplicação documentada
- [ ] Responsible pela manutenção
- [ ] Processo de atualização definido

## Personalizações

### Adaptação para Domínios Específicos

A skill pode ser adaptada para diferentes domínios:

**E-commerce**:
- Fluxos de checkout e pagamento
- Gestão de produtos e estoque
- Sistema de cupons e promoções

**Financeiro**:
- Fluxos de transações
- Relatórios e dashboards
- Compliance e auditoria

**Saúde**:
- Fluxos de pacientes
- Prontuários eletrônicos
- Integração com exames

**Educação**:
- Fluxos de alunos/professores
- Sistema de notas e avaliações
- Plataforma de ensino

### Configuração de Templates

Para personalizar templates:

1. Edite os arquivos `template-*.md` na pasta da skill
2. Adicione seções específicas do seu domínio
3. Ajuste os diagramas Mermaid conforme necessário
4. Inclua exemplos relevantes ao seu contexto

## Integração com Outras Tools

A skill trabalha bem combinada com:

- **GitHub Pages/GitLab Pages**: Para hospedar documentação
- **Swagger/OpenAPI**: Para documentação de APIs
- **Draw.io**: Para diagramas mais complexos  
- **Confluence/Notion**: Para documentação colaborativa

## Troubleshooting

### Problemas Comuns

**Diagramas Mermaid não renderizam**:
- Verificar sintaxe do Mermaid
- Usar ferramenta de validação online
- Simplificar diagramas muito complexos

**Documentação muito genérica**:
- Fornecer mais contexto sobre o projeto
- Especificar tecnologias e frameworks
- Incluir exemplos reais de uso

**Informações desatualizadas**:
- Executar análise semântica do código atual
- Verificar branches e commits recentes
- Validar com desenvolvimento

**Falta de detalhes técnicos**:
- Analisar código-fonte mais profundamente
- Consultar documentação existente
- Entrevistar desenvolvedores

## Manutenção da Documentação

### Processo Recomendado

1. **Revisão quinzenal**: Verificar se functional specs estão atualizadas
2. **Atualização por feature**: Documentar novas funcionalidades imediatamente
3. **Review em releases**: Validar documentação antes de cada release
4. **Feedback contínuo**: Coletar feedback dos usuários da documentação

### Automação

Considere automatizar:
- Geração de documentação de APIs via annotations
- Validação de links e referências
- Notificações quando código muda sem documentação
- Sincronização com ferramentas de design/prototipação