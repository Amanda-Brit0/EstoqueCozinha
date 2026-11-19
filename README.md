# Estoque Cozinha — Controle Local

Aplicação desktop local para controle de estoque da cozinha, desenvolvida com **React**, **Vite** e **Electron**, com armazenamento local em arquivos JSON sem dependência de nuvem.

## Estrutura do projeto

- `electron/` — Processo principal e preload do Electron (`main.cjs`, `preload.cjs`)
- `dados/` — Arquivos JSON locais para catálogo, estoque, itens arquivados e histórico
- `assets/` — Ícones e recursos visuais da aplicação
- `index.html`, `vite.config.js`, `package.json` — Configuração da interface e build

## Requisitos

- **Node.js** 18 ou superior
- **npm**

## Instalação e execução

```bash
npm install
npm run dev