# Project TODO

## Banco de Dados
- [x] Criar tabela de categorias
- [x] Criar tabela de times
- [x] Criar tabela de produtos
- [x] Criar tabela de movimentações (entradas e saídas)
- [x] Criar tabela de unidades de medida
- [x] Executar migrations

## Backend (tRPC)
- [x] Criar rotas de categorias (CRUD)
- [x] Criar rotas de times (CRUD)
- [x] Criar rotas de produtos (CRUD)
- [x] Criar rotas de movimentações (entrada/saída)
- [x] Criar rotas de relatórios (por culto, período, time)
- [x] Criar rota de dashboard (estatísticas)
- [x] Implementar upload de fotos de produtos

## Autenticação
- [x] Implementar tela de login
- [x] Configurar fluxo de OAuth
- [x] Implementar proteção de rotas
- [x] Implementar logout

## Navegação
- [x] Configurar tab bar com 5 tabs
- [x] Adicionar ícones no icon-symbol.tsx
- [x] Configurar navegação entre telas

## Tela Home (Dashboard)
- [x] Criar layout do dashboard
- [x] Implementar cards de estatísticas
- [x] Implementar botões de ação rápida
- [x] Implementar alertas de estoque baixo

## Tela de Estoque
- [x] Criar lista de produtos
- [x] Implementar busca de produtos
- [x] Implementar filtros por categoria
- [x] Implementar indicador de estoque baixo
- [x] Adicionar botão flutuante para novo produto

## Tela de Detalhes do Produto
- [ ] Criar layout de detalhes
- [ ] Exibir foto grande do produto
- [ ] Exibir informações completas
- [ ] Implementar botões de ação
- [ ] Exibir histórico de movimentações

## Tela de Cadastro/Edição de Produto
- [ ] Criar formulário de produto
- [ ] Implementar upload de foto
- [ ] Implementar seleção de categoria
- [ ] Implementar seleção de unidade de medida
- [ ] Implementar validações
- [ ] Implementar salvamento

## Tela de Registrar Entrada
- [ ] Criar formulário de entrada
- [ ] Implementar busca de produto
- [ ] Implementar validações
- [ ] Implementar confirmação de entrada

## Tela de Registrar Saída
- [x] Criar formulário de saída
- [x] Implementar busca de produto
- [x] Implementar campo de nome do voluntário
- [x] Implementar seleção de time
- [x] Implementar seleção de culto (08:30, 11:00, 17:00, 19:30)
- [x] Implementar validação de quantidade disponível
- [x] Implementar validação de limite de saída
- [x] Implementar confirmação de saída

## Tela de Times
- [ ] Criar lista de times
- [ ] Implementar cadastro de time
- [ ] Implementar edição de time
- [ ] Implementar exclusão de time

## Tela de Categorias
- [ ] Criar lista de categorias
- [ ] Implementar cadastro de categoria
- [ ] Implementar edição de categoria
- [ ] Implementar exclusão de categoria

## Tela de Relatórios
- [x] Criar seleção de tipo de relatório
- [x] Implementar relatório por culto
- [ ] Implementar relatório por período
- [x] Implementar relatório por time
- [x] Implementar visualização de dados

## Tela de Perfil/Configurações
- [ ] Criar tela de perfil
- [ ] Implementar botão de logout
- [ ] Implementar alternância de tema

## Sistema de Alertas
- [ ] Implementar verificação de estoque mínimo
- [ ] Implementar badges de alerta
- [ ] Implementar notificações visuais

## Componentes Reutilizáveis
- [ ] Criar ProductCard
- [ ] Criar StockBadge
- [ ] Criar MovementCard
- [ ] Criar CategoryChip
- [ ] Criar StatCard
- [ ] Criar FormField
- [ ] Criar ActionButton
- [ ] Criar SearchBar

## Branding
- [x] Gerar logo personalizado
- [x] Atualizar app.config.ts com nome e logo
- [x] Copiar logo para todas as localizações necessárias

## Testes e Finalização
- [ ] Testar fluxo completo de cadastro de produto
- [ ] Testar fluxo completo de entrada
- [ ] Testar fluxo completo de saída
- [ ] Testar relatórios
- [ ] Testar alertas de estoque
- [ ] Criar checkpoint final

## Correções
- [x] Corrigir fluxo de OAuth para funcionar no Expo Go
- [x] Implementar modo de login de desenvolvimento
- [x] Popular banco de dados com dados de teste
- [ ] Testar autenticação em dispositivo móvel real

## Telas de Cadastro (Urgente)
- [x] Implementar tela de cadastro de produtos
- [x] Implementar tela de cadastro de categorias
- [x] Implementar tela de cadastro de times
- [x] Conectar botões de cadastro às telas correspondentes

## Novas Funcionalidades Solicitadas
- [x] Criar tela de entrada de produtos (aumentar estoque)
- [x] Implementar edição de produtos existentes
- [x] Adicionar histórico detalhado de movimentações por produto
- [x] Corrigir cadastro de times (adicionar listagem)
- [x] Corrigir cadastro de categorias (adicionar listagem)
- [x] Adicionar campo para criar novas unidades de medida

## Correção de Bugs
- [x] Corrigir erro de autenticação "Please login (10001)" nas telas de cadastro
- [x] Garantir que sessão do login de teste seja persistida corretamente

## Ajustes de UI
- [x] Corrigir texto do botão de entrada de produtos (estava em branco, deve ser "Registrar Entrada")

## Atualização de Branding
- [x] Substituir ícone do app pela logo MINC STOCK
- [x] Ajustar paleta de cores para laranja (#FF6B00) como cor primária
- [x] Atualizar theme.config.js com novas cores
- [x] Copiar nova logo para todas as localizações necessárias
- [x] Atualizar nome do app para MINC STOCK

## Melhorias de UX
- [x] Criar tela de carregamento inicial com animação da logo MINC STOCK
- [x] Implementar animação de fade-in e escala
- [x] Configurar transição suave para tela de login

## Ajustes Solicitados
- [x] Remover tela de carregamento inicial (splash screen)
- [x] Restaurar comportamento anterior de abertura direta

## Novas Funcionalidades - Backup e Relatórios
- [x] Implementar sistema de backup automático (sincronização em nuvem)
- [x] Criar funcionalidade de exportar backup manual
- [x] Criar rotas de API para backup e relatórios filtrados
- [x] Adicionar tela de backup na aba Mais
- [ ] Implementar restauração de backup (em desenvolvimento)
- [ ] Adicionar exportação de relatórios em PDF (requer biblioteca adicional)
- [ ] Criar filtros avançados nos relatórios (data, culto, time, tipo)
- [ ] Implementar seletor de período personalizado

## Correção Urgente - OAuth
- [x] Corrigir fluxo de autenticação OAuth da Manus para funcionar no Expo Go
- [ ] Testar login OAuth em dispositivo real
- [ ] Remover ou ocultar botão "Login de Teste" após correção do OAuth

## Sistema de Autenticação Simplificado
- [x] Implementar autenticação com código de acesso
- [x] Criar tela de login com campo de código
- [x] Remover dependência de OAuth da Manus
- [ ] Testar login com código em dispositivo real
- [ ] Permitir administrador alterar código de acesso

## Correção de Bug - Token de Acesso
- [x] Ajustar backend para aceitar tokens access-token-*
- [ ] Testar cadastro de times após correção

## Sistema de Permissões
- [x] Criar código de acesso para voluntários (VOLUNTARIO2024)
- [x] Implementar verificação de permissões (admin vs voluntário)
- [x] Ocultar opções de gerenciamento para voluntários
- [x] Alterar nome do usuário admin para "Administrador"
- [x] Remover email da tela Mais

## Bug Reportado
- [x] Corrigir erro "unable to transform response from server" ao cadastrar novo time

## Novas Funcionalidades - Relatórios Avançados
- [x] Implementar filtros de período personalizado (data inicial/final) nos relatórios
- [x] Adicionar seletor de data na interface de relatórios
- [x] Criar função de geração de PDF para relatórios
- [x] Adicionar botão de exportação PDF na tela de relatórios
- [x] Testar filtros de período com diferentes intervalos de datas
- [x] Testar exportação de PDF com diferentes tipos de relatórios

## Bug Crítico - Parse JSON
- [x] Corrigir erro "JSON Parse error: Unexpected character: <" ao cadastrar novo time

## Bugs Urgentes - Relatórios
- [x] Corrigir loop infinito de carregamento na tela de relatórios
- [x] Garantir que filtros avançados de período estejam visíveis
- [x] Garantir que botão de exportação PDF esteja visível

## Novas Funcionalidades - Edição
- [x] Implementar tela de edição de times
- [x] Implementar tela de edição de categorias
- [x] Implementar tela de edição de unidades de medida
- [x] Adicionar botões de edição nas listagens

## Bug Crítico - Servidor
- [ ] Corrigir erro HTTP 500 persistente ao tentar acessar o aplicativo

## Bugs Críticos - Relatórios e Criação
- [x] Corrigir loop eterno de carregamento nos relatórios (staleTime + refetch config)
- [x] Restaurar botões de criação de novos times, categorias e unidades
- [x] Garantir que criação e edição funcionem juntas

## Melhorias Urgentes - Relatórios
- [x] Corrigir visualização das abas "Por Culto" e "Por Time" nos relatórios
- [x] Adicionar nova aba "Estoque" com relatório de produtos em estoque
- [x] Implementar exportação em PDF real usando expo-print

## Ajustes Urgentes - Relatórios
- [x] Habilitar exportação PDF para relatório de estoque
- [x] Renomear aba "Por Período" para "Geral"
- [x] Reorganizar ordem das abas (Geral como primeira)
- [x] Corrigir loop infinito no relatório por culto

## Bug Crítico - Exportação
- [x] Corrigir exportação PDF do relatório de estoque (resumo condicional adicionado)

## Bug Crítico - Botão Exportar
- [x] Habilitar botão de exportação para relatório de estoque (condição corrigida)
