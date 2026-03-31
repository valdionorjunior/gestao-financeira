# 📚 Guia Prático - Como Usar Componentes Modernos

## 1. KPICard - Cards de Métricas

```tsx
import { KPICard } from '@components/ui/KPICard';
import { Wallet, TrendingUp } from 'lucide-react';

export default function Example() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <KPICard
        title="Saldo Total"
        value={12500}
        currency="BRL"
        variant="default"
        icon={<Wallet className="w-6 h-6" />}
        trend={{
          percentage: 5.2,
          direction: 'up',
          period: 'vs. mês passado',
        }}
      />

      <KPICard
        title="Receitas"
        value={8000}
        currency="BRL"
        variant="success"
        icon={<TrendingUp className="w-6 h-6" />}
      />
    </div>
  );
}
```

**Props:**
- `title`: Texto do card
- `value`: Número a exibir
- `currency`: 'BRL' | 'USD' (default: 'BRL')
- `variant`: 'default' | 'success' | 'warning' | 'danger' | 'info'
- `trend`: { percentage, direction: 'up' | 'down', period }
- `icon`: ReactNode (lucide icons funcionam bem)

---

## 2. Card - Container Modular

```tsx
import { Card, CardHeader, CardBody, CardFooter } from '@components/ui/Card';
import { Button } from '@components/ui/Button';

export default function Example() {
  return (
    <Card>
      <CardHeader title="Dados Importantes" subtitle="2026" />
      <CardBody>
        <p className="text-gray-600 dark:text-gray-400">
          Seu conteúdo aqui
        </p>
      </CardBody>
      <CardFooter>
        <Button variant="outline">Cancelar</Button>
        <Button>Salvar</Button>
      </CardFooter>
    </Card>
  );
}
```

**CardHeader Props:**
- `title`: string (opcional)
- `subtitle`: string (opcional)
- `children`: ReactNode (se quiser customizar)

---

## 3. Button - Botões Responsivos

```tsx
import { Button } from '@components/ui/Button';
import { Plus, Save } from 'lucide-react';

export default function Example() {
  return (
    <div className="space-y-2">
      {/* Primary */}
      <Button onClick={() => {}}>
        <Plus className="w-4 h-4 mr-2" />
        Novo Item
      </Button>

      {/* Secondary */}
      <Button variant="secondary">Secundário</Button>

      {/* Outline */}
      <Button variant="outline">Contorno</Button>

      {/* Ghost */}
      <Button variant="ghost">Invisível</Button>

      {/* Danger */}
      <Button variant="danger">Deletar</Button>

      {/* Loading State */}
      <Button isLoading>Carregando...</Button>

      {/* Full Width */}
      <Button fullWidth>Largura Total</Button>

      {/* Size */}
      <Button size="sm">Pequeno</Button>
      <Button size="md">Médio</Button>
      <Button size="lg">Grande</Button>
    </div>
  );
}
```

---

## 4. Inputs

### TextInput

```tsx
import { TextInput } from '@components/ui/TextInput';
import { Mail, Lock } from 'lucide-react';

export default function Example() {
  return (
    <form className="space-y-4">
      <TextInput
        label="Email"
        placeholder="seu@email.com"
        icon={<Mail className="w-5 h-5" />}
        error="Email inválido"
      />

      <TextInput
        label="Senha"
        type="password"
        placeholder="••••••••"
        icon={<Lock className="w-5 h-5" />}
      />
    </form>
  );
}
```

### MoneyInput

```tsx
import { MoneyInput } from '@components/ui/MoneyInput';

export default function Example() {
  const [value, setValue] = useState(0);

  return (
    <MoneyInput
      label="Valor da Transação"
      value={value}
      onChange={(e) => setValue(Number(e.target.value))}
      currency="BRL"
      placeholder="0,00"
      helperText="Valor em reais"
    />
  );
}
```

### Select

```tsx
import { Select } from '@components/ui/Select';
import { Tag } from 'lucide-react';

export default function Example() {
  return (
    <Select
      label="Categoria"
      icon={<Tag className="w-5 h-5" />}
      options={[
        { value: 'food', label: 'Alimentação' },
        { value: 'transport', label: 'Transporte' },
        { value: 'entertainment', label: 'Entretenimento' },
      ]}
      error="Campo obrigatório"
    />
  );
}
```

---

## 5. Table - Tabelas com Paginação

```tsx
import { Table } from '@components/ui/Table';

interface Row {
  id: string;
  name: string;
  amount: number;
  date: string;
}

export default function Example() {
  const [page, setPage] = useState(1);

  const columns = [
    { key: 'name' as const, label: 'Nome' },
    {
      key: 'amount' as const,
      label: 'Valor',
      align: 'right' as const,
      render: (value) => `R$ ${value.toFixed(2).replace('.', ',')}`,
    },
    { key: 'date' as const, label: 'Data' },
  ];

  const data: Row[] = [
    { id: '1', name: 'Item 1', amount: 100, date: '01/01/2026' },
    { id: '2', name: 'Item 2', amount: 200, date: '02/01/2026' },
  ];

  return (
    <Table
      columns={columns}
      data={data}
      loading={false}
      pagination={{
        page,
        pageSize: 20,
        total: 100,
        onPageChange: setPage,
      }}
      onRowClick={(row) => console.log(row)}
    />
  );
}
```

---

## 6. Alert & Badge

### Alert

```tsx
import { Alert } from '@components/ui/Alert';

export default function Example() {
  const [showAlert, setShowAlert] = useState(true);

  return (
    <div className="space-y-2">
      {showAlert && (
        <Alert
          variant="success"
          title="Sucesso!"
          closable
          onClose={() => setShowAlert(false)}
        >
          Sua operação foi realizada com sucesso
        </Alert>
      )}

      <Alert variant="error" title="Erro">
        Algo deu errado. Tente novamente.
      </Alert>

      <Alert variant="warning">
        Aviso: Este é um aviso importante
      </Alert>

      <Alert variant="info">
        Informação: Aqui vai uma informação útil
      </Alert>
    </div>
  );
}
```

### Badge

```tsx
import { Badge } from '@components/ui/Badge';

export default function Example() {
  return (
    <div className="space-y-2">
      <Badge>Padrão</Badge>
      <Badge variant="success">Aprovado</Badge>
      <Badge variant="warning">Pendente</Badge>
      <Badge variant="danger">Bloqueado</Badge>
      <Badge variant="info">Info</Badge>

      {/* Sizes */}
      <Badge size="sm">Pequeno</Badge>
      <Badge size="md">Médio</Badge>
      <Badge size="lg">Grande</Badge>
    </div>
  );
}
```

---

## 7. Layout Completo de Página

```tsx
import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardBody } from '@components/ui/Card';
import { Table } from '@components/ui/Table';
import { Button } from '@components/ui/Button';
import { TextInput } from '@components/ui/TextInput';

export default function TransactionsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);

  const columns = [
    { key: 'date' as const, label: 'Data' },
    { key: 'description' as const, label: 'Descrição' },
    {
      key: 'amount' as const,
      label: 'Valor',
      align: 'right' as const,
    },
    { key: 'status' as const, label: 'Status' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Transações
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Gerencie suas transações financeiras
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <TextInput
          placeholder="Buscar..."
          icon={<Search className="w-5 h-5" />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 min-w-[250px]"
        />
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Transação
        </Button>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={[]}
        loading={false}
        pagination={{
          page,
          pageSize: 20,
          total: 100,
          onPageChange: setPage,
        }}
      />

      {/* Modal Example */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md">
            <CardHeader title="Nova Transação" />
            <CardBody className="space-y-4">
              <TextInput label="Descrição" placeholder="Digite..." />
              <TextInput label="Valor" placeholder="0,00" />
            </CardBody>
            <div className="pt-4 border-t border-gray-200 dark:border-slate-700 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button>Criar</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
```

---

## 8. Dark Mode - Como Funciona

```tsx
// A classe 'dark:' é aplicada automaticamente em elementos
// O ThemeProvider cuida de tudo

import { useThemeStore } from '@stores/themeStore';

export function ThemeToggle() {
  const { isDark, toggleTheme } = useThemeStore();

  return (
    <button onClick={toggleTheme}>
      {isDark ? '☀️ Modo Claro' : '🌙 Modo Escuro'}
    </button>
  );
}
```

**Aplicando dark mode em componentes:**
```jsx
<div className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">
  Conteúdo que muda com Dark Mode
</div>
```

---

## 9. Formatadores de Valores

```tsx
import {
  formatCurrency,
  formatPercentage,
  formatNumber,
  parseCurrencyInput,
  getCurrencySymbol,
  abbreviateNumber,
} from '@utils/formatters';

// Formatação de Moeda
formatCurrency(1500.99, 'BRL'); // R$ 1.500,99
formatCurrency(100, 'USD');     // US$ 100.00

// Percentuais
formatPercentage(45.678); // 45.7%

// Números
formatNumber(1000.5); // 1.000,50

// Parse de input monetário
parseCurrencyInput('R$ 1.500,99'); // 1500.99

// Símbolo de moeda
getCurrencySymbol('BRL'); // R$

// Abreviar números
abbreviateNumber(1500000); // 1.5M
abbreviateNumber(5000);    // 5k
```

---

## 10. Utility - cn() para Merge de Classes

```tsx
import { cn } from '@utils/cn';

// Merge limpo de classes Tailwind
<div className={cn(
  'base-classes',
  condition && 'conditional-class',
  variant === 'dark' && 'dark:bg-slate-900',
)}>
  Conteúdo
</div>

// Útil para componentes dinâmicos
const buttonClass = cn(
  'p-4 rounded-lg',
  isActive && 'bg-blue-600 text-white',
  isActive || 'bg-gray-100 text-gray-900'
);
```

---

## 🎯 Dicas Finais

1. **Sempre use `space-y-` e `gap-` para espaçamento**
   ```tsx
   <div className="space-y-6"> → espaçamento vertical
   <div className="flex gap-4"> → gap horizontal
   ```

2. **Grid responsivo padrão**
   ```tsx
   className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
   ```

3. **Sempre incluir descrição com dark mode**
   ```tsx
   className="text-gray-600 dark:text-gray-400"
   ```

4. **Lucide icons funcionam em toda parte**
   ```tsx
   import { Plus, Trash2, Edit, ChevronDown } from 'lucide-react';
   ```

5. **Use Card para tudo**
   ```tsx
   <Card> → Preferred approach
   <div className="bg-white"> → ❌ Não recomendado
   ```

---

**Pronto para modernizar suas páginas! 🚀**
