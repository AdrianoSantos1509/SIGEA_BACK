# Sistema de Turmas — Backend 

API em Node.js + TypeScript + TypeORM + MySQL, para substituir a planilha de
gestão de turmas.

## Stack

- Node.js + TypeScript
- Express
- TypeORM
- MySQL

## Setup

1. Instalar dependências:
   ```
   npm install
   ```

2. Copiar o arquivo de variáveis de ambiente e preencher com os dados do seu
   MySQL:
   ```
   cp .env.example .env
   ```

3. Criar o banco de dados (o TypeORM cria as tabelas sozinho via
   `synchronize: true`, mas o banco em si precisa existir antes):
   ```sql
   CREATE DATABASE sistema_turmas_cep;
   ```

4. Rodar em modo desenvolvimento:
   ```
   npm run dev
   ```

   O servidor sobe em `http://localhost:3333` (ou na porta definida em `.env`).

## Estrutura

```
src/
├── entities/       # As 10 tabelas normalizadas (1FN/2FN/3FN)
├── controllers/     # Lógica de cada rota
├── routes/          # Definição dos endpoints
├── data-source.ts   # Configuração da conexão TypeORM/MySQL
└── server.ts         # Ponto de entrada (Express)
```

## Endpoints disponíveis

| Método | Rota | Descrição |
|---|---|---|
| GET | /turmas | Lista turmas (filtros: `?status=`, `?turno=`, `?segmento=`) |
| GET | /turmas/:id | Detalhe de uma turma (com dias, UCs, substituições, pendências) |
| POST | /turmas | Cria turma |
| PUT | /turmas/:id | Atualiza turma |
| DELETE | /turmas/:id | Remove turma |
| GET/POST/PUT/DELETE | /unidades | CRUD de unidades |
| GET/POST/PUT/DELETE | /segmentos | CRUD de segmentos |
| GET/POST/PUT/DELETE | /salas | CRUD de salas |
| GET/POST/PUT/DELETE | /instrutores | CRUD de instrutores |
| GET/POST/PUT/DELETE | /coordenadores | CRUD de coordenadores |

## Ainda não implementado (próximos passos)

- Rotas de `ucs`, `substituicoes` e `turma_dias` (hoje só existem como
  relações dentro de `turmas` — dá pra criar controllers dedicados se for
  necessário editar isso separadamente)
- Rotas de `pendencias_alocacao`
- Autenticação (login de coordenador/instrutor)
- Validação de conflito de sala/horário ao criar ou editar uma turma
- Migrations (hoje o schema é criado via `synchronize: true`, ok para
  desenvolvimento, mas recomendado trocar por migrations antes de produção)

## Import de dados da planilha

Ainda não criei o script de importação do Excel para o MySQL — se quiser,
posso montar um script Node que lê o `.xlsx` e popula as tabelas
automaticamente (usando o `codigo` da turma como chave de ligação, como
identificamos na análise da planilha).
