# SIGEA - Tela de Login

Tela de autenticação do **SIGEA** (Sistema Integrado de Gestão de Espaços Acadêmicos), desenvolvida em React + Vite.

## Estrutura do projeto

```
sigea-login/
├── public/                  # Arquivos estáticos servidos diretamente
├── src/
│   ├── assets/
│   │   └── images/          # Logos e imagens do projeto
│   ├── components/          # Componentes reutilizáveis (ex: botões, inputs)
│   ├── pages/
│   │   └── Login/
│   │       ├── LoginPage.jsx
│   │       └── LoginPage.css
│   ├── styles/
│   │   ├── global.css       # Reset e estilos globais
│   │   └── variables.css    # Tokens de cor e tipografia da marca
│   ├── App.jsx               # Componente raiz
│   └── main.jsx               # Ponto de entrada da aplicação
├── index.html
├── package.json
├── vite.config.js
├── .eslintrc.cjs
└── .gitignore
```

## Paleta de cores

| Cor            | Hex       |
|----------------|-----------|
| Azul           | `#004A8D` |
| Azul (hover)   | `#1A63A6` |
| Azul escuro    | `#00365F` |
| Laranja        | `#F7941D` |
| Laranja claro  | `#FDC180` |

## Como rodar o projeto

```bash
# instalar dependências
npm install

# iniciar em modo desenvolvimento
npm run dev

# gerar build de produção
npm run build

# pré-visualizar o build de produção
npm run preview
```

## Próximos passos sugeridos

- Integrar o formulário com a API de autenticação.
- Adicionar validação de e-mail/senha com feedback em tempo real.
- Adicionar testes (Vitest + React Testing Library).
