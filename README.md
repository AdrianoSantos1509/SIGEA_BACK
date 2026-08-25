# SIGEA SENAC

Sistema Integrado de Gestão de Espaços Acadêmicos. A aplicação organiza unidades, salas, turmas e alocações recorrentes, com consulta diária de disponibilidade e bloqueio de conflitos de horário.

## Cadastros e permissões

- **Administrador:** gerencia usuários, professores, unidades, salas, turmas e alocações.
- **Coordenador:** gerencia professores e os cadastros acadêmicos, mas não administra usuários.
- **Consulta:** possui acesso somente para leitura.

Os professores encontrados nas turmas importadas são cadastrados automaticamente. As matrículas iniciadas por `IMP-` e os dados de contato devem ser revisados pelo administrador ou coordenador.

Nos cadastros de professores e usuários, o ícone de lápis permite editar os dados e o `×` realiza a exclusão definitiva após confirmação. O administrador conectado não pode apagar nem inativar a própria conta.

Salas e turmas também podem ser editadas pelo ícone de lápis. O formulário é aberto com os dados atuais, incluindo capacidades, recursos e status da sala, além de período, horários, professor, segmento, carga horária, dias e status da turma.

Na Visão geral, os cartões de salas cadastradas, ocupadas e disponíveis abrem listas pesquisáveis com acesso direto à edição. O cartão de taxa de ocupação abre um panorama das unidades, com totais e percentual de ocupação calculados para a data selecionada.

## Política de senhas

- Todo novo usuário recebe uma senha provisória e deve redefini-la no primeiro acesso.
- As senhas expiram após 60 dias; o acesso ao painel fica bloqueado até a renovação.
- A nova senha exige ao menos 8 caracteres, com maiúscula, minúscula, número e caractere especial.
- Quando um administrador redefine a senha de outro usuário, ela volta a ser provisória e as sessões existentes ficam bloqueadas imediatamente.
- Qualquer usuário pode usar o ícone de chave no rodapé do menu para alterar sua própria senha antes do vencimento.

## Dados carregados

A carga inicial foi normalizada a partir das três planilhas fornecidas e contém 9 unidades, 92 salas e 322 turmas. Quando o banco está vazio, o backend importa `Backend/data/seed.json` e cria as alocações que possuem sala, período, horário e dias reconhecíveis.

## Executar localmente

Pré-requisitos: Node.js e MySQL com o banco `sigea_senac` criado.

1. Configure `Backend/.env.local` a partir de `Backend/.env.example`.
2. Em um terminal, execute `cd Backend` e `npm start`.
3. Em outro terminal, execute `cd Frontend` e `npm run dev`.
4. Acesse `http://localhost:5173`.

O acesso local criado nesta instalação é `admin@sigea.local` com a senha temporária `Sigea@2026`. Altere a senha antes de disponibilizar o sistema em rede.

## Validação

- Backend: `npm run check`
- Frontend: `npm run build`

Para produção, use migrações do TypeORM e defina `DB_SYNC=false`; não use sincronização automática de schema em banco com dados reais.
