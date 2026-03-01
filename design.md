# Design do Aplicativo de Controle de Estoque da Igreja

## Visão Geral

Aplicativo móvel para controle de estoque de insumos da igreja, permitindo que voluntários registrem entradas e saídas de produtos, com rastreamento por time e culto. O app seguirá as diretrizes do Apple Human Interface Guidelines (HIG) para uma experiência nativa iOS.

## Orientação e Uso

- **Orientação**: Portrait (9:16) exclusivamente
- **Uso**: Uma mão (one-handed usage)
- **Plataforma**: iOS/Android com design iOS-first

## Paleta de Cores

- **Primary (Azul Igreja)**: `#1E40AF` - Ações principais, botões primários
- **Success (Verde)**: `#22C55E` - Entrada de produtos, confirmações
- **Warning (Amarelo)**: `#F59E0B` - Alertas de estoque baixo
- **Error (Vermelho)**: `#EF4444` - Saída de produtos, exclusões
- **Background**: `#FFFFFF` (light) / `#151718` (dark)
- **Surface**: `#F5F5F5` (light) / `#1E2022` (dark)
- **Foreground**: `#11181C` (light) / `#ECEDEE` (dark)

## Lista de Telas

### 1. Login Screen
**Conteúdo**:
- Logo da igreja centralizado
- Título "Controle de Estoque"
- Subtítulo "Igreja [Nome]"
- Botão "Entrar com Manus"

**Funcionalidade**:
- Autenticação via Manus OAuth
- Redirecionamento automático se já autenticado

### 2. Home (Dashboard)
**Conteúdo**:
- Resumo de estatísticas em cards:
  - Total de produtos cadastrados
  - Produtos com estoque baixo (alerta)
  - Saídas do dia
  - Próximo culto
- Botões de ação rápida:
  - "Registrar Saída"
  - "Registrar Entrada"
  - "Ver Estoque"

**Funcionalidade**:
- Visão geral do sistema
- Acesso rápido às principais funcionalidades
- Alertas visuais para produtos com estoque baixo

### 3. Estoque (Inventory List)
**Conteúdo**:
- Barra de busca no topo
- Filtros por categoria (chips horizontais)
- Lista de produtos com:
  - Foto do produto (thumbnail)
  - Nome do produto
  - Categoria
  - Quantidade atual
  - Unidade de medida
  - Badge de alerta (se estoque baixo)
- Botão flutuante "+" para adicionar produto

**Funcionalidade**:
- Busca em tempo real
- Filtro por categoria
- Navegação para detalhes do produto
- Indicador visual de estoque baixo

### 4. Detalhes do Produto
**Conteúdo**:
- Foto grande do produto
- Nome e categoria
- Informações:
  - Quantidade atual
  - Unidade de medida
  - Estoque mínimo
  - Custo unitário
  - Última movimentação
- Botões de ação:
  - "Registrar Entrada"
  - "Registrar Saída"
  - "Editar"
  - "Excluir"
- Histórico de movimentações (últimas 10)

**Funcionalidade**:
- Visualização completa do produto
- Acesso rápido para entrada/saída
- Histórico de movimentações

### 5. Cadastro/Edição de Produto
**Conteúdo**:
- Formulário com campos:
  - Foto (câmera ou galeria)
  - Nome do produto *
  - Categoria (seleção) *
  - Quantidade inicial *
  - Unidade de medida (seleção) *
  - Estoque mínimo *
  - Custo unitário
  - Limite de saída por vez
- Botões: "Cancelar" e "Salvar"

**Funcionalidade**:
- Upload de foto
- Validação de campos obrigatórios
- Seleção de categoria existente
- Seleção de unidade de medida (un, kg, L, cx, etc.)

### 6. Registrar Entrada
**Conteúdo**:
- Seleção de produto (busca/lista)
- Quantidade a adicionar
- Data/hora (preenchida automaticamente)
- Observações (opcional)
- Botão "Confirmar Entrada"

**Funcionalidade**:
- Busca de produto
- Incremento de estoque
- Registro no histórico

### 7. Registrar Saída
**Conteúdo**:
- Seleção de produto (busca/lista)
- Quantidade a retirar
- Nome do voluntário (campo de texto) *
- Seleção de time (lista) *
- Seleção de culto (08:30, 11:00, 17:00, 19:30) *
- Data/hora (preenchida automaticamente)
- Observações (opcional)
- Botão "Confirmar Saída"

**Funcionalidade**:
- Busca de produto
- Validação de quantidade disponível
- Validação de limite de saída
- Decremento de estoque
- Registro no histórico com rastreamento

### 8. Times
**Conteúdo**:
- Lista de times cadastrados:
  - Nome do time
  - Número de saídas recentes
- Botão flutuante "+" para adicionar time

**Funcionalidade**:
- Listagem de times
- Cadastro de novos times
- Edição/exclusão de times

### 9. Categorias
**Conteúdo**:
- Lista de categorias:
  - Nome da categoria
  - Número de produtos
- Botão flutuante "+" para adicionar categoria

**Funcionalidade**:
- Listagem de categorias
- Cadastro de novas categorias
- Edição/exclusão de categorias

### 10. Relatórios
**Conteúdo**:
- Seleção de tipo de relatório:
  - Por Culto
  - Por Período
  - Por Time
- Filtros específicos para cada tipo
- Visualização de dados:
  - Tabela de movimentações
  - Resumo quantitativo
- Botão "Exportar" (opcional)

**Funcionalidade**:
- Filtros dinâmicos
- Visualização de dados históricos
- Agrupamento por critério selecionado

### 11. Perfil/Configurações
**Conteúdo**:
- Informações do usuário
- Botão "Sair"
- Configurações gerais (tema, notificações)

**Funcionalidade**:
- Logout
- Alternância de tema claro/escuro

## Fluxos Principais

### Fluxo 1: Cadastrar Produto
1. Usuário acessa tab "Estoque"
2. Toca no botão "+"
3. Preenche formulário de cadastro
4. Tira foto ou seleciona da galeria
5. Seleciona categoria
6. Define quantidade inicial e estoque mínimo
7. Toca em "Salvar"
8. Produto aparece na lista de estoque

### Fluxo 2: Registrar Saída
1. Usuário acessa Home ou tab "Estoque"
2. Toca em "Registrar Saída"
3. Busca e seleciona o produto
4. Informa quantidade a retirar
5. Digita nome do voluntário
6. Seleciona o time
7. Seleciona o culto (08:30, 11:00, 17:00, 19:30)
8. Adiciona observações (opcional)
9. Toca em "Confirmar Saída"
10. Sistema valida quantidade disponível e limite
11. Estoque é atualizado
12. Confirmação visual (toast/haptic)

### Fluxo 3: Ver Relatório por Culto
1. Usuário acessa tab "Relatórios"
2. Seleciona "Por Culto"
3. Seleciona data e horário do culto
4. Sistema exibe todas as saídas daquele culto
5. Mostra: produto, quantidade, voluntário, time
6. Usuário pode exportar ou voltar

### Fluxo 4: Alerta de Estoque Baixo
1. Sistema verifica estoque automaticamente
2. Quando produto atinge estoque mínimo
3. Badge de alerta aparece no produto
4. Notificação visual no Dashboard
5. Produto destacado na lista de estoque

## Componentes Reutilizáveis

- **ProductCard**: Card de produto com foto, nome, quantidade
- **StockBadge**: Badge de status de estoque (normal, baixo, crítico)
- **MovementCard**: Card de movimentação no histórico
- **CategoryChip**: Chip de categoria para filtros
- **StatCard**: Card de estatística no dashboard
- **FormField**: Campo de formulário padronizado
- **ActionButton**: Botão de ação primário/secundário
- **SearchBar**: Barra de busca padrão

## Navegação

### Tab Bar (Bottom)
- **Home**: Ícone de casa
- **Estoque**: Ícone de caixa/pacote
- **Saída**: Ícone de seta para fora (destaque)
- **Relatórios**: Ícone de gráfico
- **Mais**: Ícone de três pontos (Times, Categorias, Perfil)

## Interações e Feedback

- **Tap em produto**: Navega para detalhes
- **Swipe em produto**: Ações rápidas (editar/excluir)
- **Pull-to-refresh**: Atualiza lista de produtos
- **Haptic feedback**: Confirmação de ações importantes
- **Toast messages**: Feedback de sucesso/erro
- **Loading states**: Indicadores durante operações assíncronas

## Considerações de Design

1. **Acessibilidade**: Tamanhos de fonte ajustáveis, contraste adequado
2. **Performance**: Lazy loading de imagens, paginação de listas
3. **Offline-first**: Sincronização quando online, operação local quando offline
4. **Validações**: Feedback imediato em formulários
5. **Confirmações**: Diálogos para ações destrutivas (excluir)
