# Daily Notes

Daily Notes e um aplicativo desktop local para registrar dailys de trabalho, organizar contexto por projeto/data/tags e acompanhar tasks que nascem dessas reunioes.

O foco do projeto e ser rapido, simples, offline-first e facil de evoluir com apoio do Codex.

## Funcionalidades

- Criacao, edicao, listagem e exclusao de dailys
- Busca textual simples
- Filtros por hoje, data, projeto e tag
- Projeto com autocomplete baseado em projetos ja usados
- Tags com autocomplete, multiplas selecoes e chips removiveis
- Data da daily editavel, separada da data tecnica de criacao
- Participantes por daily
- Secoes de anotacao: ontem, hoje, blockers, discussoes e observacoes
- Tasks vinculadas a uma daily
- Board de tasks de hoje com colunas `todo`, `doing` e `done`
- Drag and drop de tasks entre colunas, persistindo o status no SQLite
- Dark mode
- Layout padrao e layout vertical
- Painel de listagem recolhivel para liberar area de leitura/escrita

## Stack

- Electron
- React
- TypeScript
- Vite
- TailwindCSS
- Componentes locais no estilo ShadCN UI
- Zustand
- Zod
- SQLite
- better-sqlite3
- electron-builder

## Decisoes tomadas

### Offline-first

O app nao depende de backend remoto. Todos os dados ficam em SQLite local, salvo em:

```bash
~/Library/Application Support/DailyNotes/daily-notes.sqlite
```

Isso deixa o app rapido, utilizavel sem internet e simples de distribuir.

### SQLite no processo main

O renderer nunca acessa SQLite diretamente. O fluxo e:

```text
React Renderer -> Preload tipado -> IPC -> Electron Main -> SQLite
```

Essa separacao mantem `nodeIntegration=false` e `contextIsolation=true`.

### Sem ORM pesado

O projeto usa SQL direto com `better-sqlite3`. Para o tamanho atual do app, isso reduz complexidade e facilita migracoes simples.

### Daily date separada de createdAt

`createdAt` representa quando o registro foi criado. `dailyDate` representa a data da daily em si e pode ser editada pelo usuario.

Essa decisao permite registrar dailys atrasadas ou corrigir datas sem perder auditoria basica.

### Tasks como entidade

Tasks nao sao texto solto. Elas possuem:

- `id`
- `title`
- `status`
- vinculo com a daily

Isso permite mostrar checklist dentro da daily e board separado para acompanhamento.

### Layout vertical opcional

O layout padrao continua sendo sidebar, listagem e detalhe. O layout vertical reorganiza filtros/navegacao no topo, mantendo lista e conteudo lado a lado para monitores em retrato.

### Listagem recolhivel

A lista de dailys pode ser recolhida para aumentar a area util do conteudo. No board de tasks ela nao aparece, porque a lista nao agrega nessa visualizacao.

## Estrutura

```text
src/
  main/
    database/
    ipc/
    services/
    preload.ts
    index.ts

  renderer/
    components/
    features/
    lib/
    store/
    styles/

  shared/
    constants/
    schemas/
    types/
```

## Como rodar localmente

Requisitos:

- macOS
- Node.js 22 ou compativel
- npm
- Xcode Command Line Tools, por causa de dependencias nativas como `better-sqlite3`

Instale as dependencias:

```bash
npm install
```

Rode em modo desenvolvimento:

```bash
npm run dev
```

Valide tipos:

```bash
npm run typecheck
```

Gere build de producao:

```bash
npm run build
```

Gere os artefatos macOS:

```bash
npm run dist
```

Os arquivos sao criados em:

```text
dist-release/
  DailyNotes-arm64.dmg
  DailyNotes-arm64.zip
  DailyNotes-x64.dmg
  DailyNotes-x64.zip
  mac-arm64/DailyNotes.app
  mac/DailyNotes.app
```

## Distribuicao

Para uso manual:

1. Rode `npm run dist`
2. Abra o `.dmg` da arquitetura do seu Mac
3. Arraste `DailyNotes.app` para `Applications`

No GitHub Actions, a cada push/merge na `main`, o workflow cria uma nova release contendo:

- `DailyNotes-arm64.dmg` para Macs Apple Silicon
- `DailyNotes-x64.dmg` para Macs Intel
- `DailyNotes-arm64.zip`
- `DailyNotes-x64.zip`

Os `.zip` contem o `.app`, ja que GitHub Releases nao anexa diretorios diretamente.

## Notas sobre assinatura

O workflow desativa descoberta automatica de certificado com:

```bash
CSC_IDENTITY_AUTO_DISCOVERY=false
```

Assim o build funciona em CI sem certificado Apple Developer. Para distribuicao publica fora de ambiente local, ainda sera necessario configurar assinatura e notarizacao da Apple.

Sem notarizacao, macOS pode bloquear a primeira abertura de um app baixado da internet. Nesse caso, use clique direito > Open, ou aprove explicitamente em System Settings > Privacy & Security.
