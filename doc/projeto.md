# Agência de Emprego - Plano de Ação para Desenvolvimento

## 1. Objetivo
Desenvolver uma aplicação web completa para uma agência de emprego, utilizando **Node.js**, seguindo os princípios de **Clean Code**, arquitetura **MVC** e templates **EJS**. A aplicação contará com dois perfis de acesso: **usuário comum** (cadastro/login via Google) e **administrador** (gestão total do sistema). O site terá uma área pública institucional, painéis de vagas e cursos, além de recursos avançados de personalização visual (cores, fundo com transparência) controlados pelo administrador.

## 2. Tecnologias e Ferramentas
| Categoria          | Tecnologia                                                                 |
|--------------------|----------------------------------------------------------------------------|
| Backend            | Node.js, Express.js                                                        |
| Frontend           | HTML5, CSS3, JavaScript, EJS (templates), Bootstrap (opcional, para agilizar) |
| Banco de Dados     | MongoDB + Mongoose (OU PostgreSQL + Sequelize – optaremos por MongoDB pela flexibilidade) |
| Autenticação       | Passport.js (estratégia local para admin e Google OAuth para usuários)    |
| Upload de arquivos | Multer (para imagens de vagas/cursos e fundo do site)                      |
| Variáveis de ambiente | dotenv                                                                   |
| Segurança          | Helmet, CORS, express-session, bcrypt (para senha do admin)               |
| Versionamento      | Git                                                                        |

## 3. Estrutura do Projeto (MVC)
```
agencia-emprego/
├── public/
│   ├── css/
│   ├── js/
│   ├── images/
│   └── uploads/            (imagens enviadas: vagas, cursos, fundo)
├── views/
│   ├── partials/            (header, footer, navbar)
│   ├── admin/                (telas do painel admin)
│   ├── user/                 (telas do usuário comum)
│   └── site/                 (páginas públicas)
├── routes/
│   ├── index.js
│   ├── admin.js
│   ├── user.js
│   └── auth.js
├── controllers/
│   ├── siteController.js
│   ├── adminController.js
│   ├── userController.js
│   └── authController.js
├── models/
│   ├── User.js
│   ├── Job.js
│   ├── Course.js
│   └── Setting.js            (configurações de tema, redes sociais)
├── middlewares/
│   ├── auth.js               (verifica se é admin)
│   └── upload.js             (config do multer)
├── config/
│   ├── database.js
│   └── passport.js
├── .env
├── app.js
└── package.json
```

## 4. Funcionalidades Detalhadas

### 4.1. Site Público (Institucional)
- **Página inicial** com:
  - Listagem dos **cursos atuais** (os mais recentes, ordenados por data de criação).
  - Destaque para as **vagas de emprego** (opcional).
  - Rodapé com ícones/link para **Instagram, Facebook e Threads** (configuráveis pelo admin).
- **Páginas estáticas** (sobre, contato) – podem ser gerenciadas via HTML fixo ou futuramente via CMS.

### 4.2. Painel do Usuário
- **Cadastro/Login**:
  - Opção de login com Google (via OAuth).
  - Usuário pode visualizar/editar seu perfil (nome, e-mail, foto).
  - (Opcional) Candidatar-se a vagas – não especificado, mas podemos incluir como melhoria futura.

### 4.3. Painel do Administrador
- **Login exclusivo** (local, com e-mail e senha).
- **Dashboard** com resumo de vagas e cursos.
- **CRUD de Vagas**:
  - Campos: título, descrição, imagem (upload), link externo para mais informações, data de criação.
  - Listagem com opção de editar/excluir.
- **CRUD de Cursos**:
  - Campos: título, descrição, imagem (upload), link externo, data de criação.
  - Importante: manter sempre os cursos atuais (exibir por ordem decrescente de data).
- **Gerenciamento de Usuários** (opcional):
  - Listar usuários cadastrados via Google.
- **Configurações de Tema**:
  - Escolha de cor primária: branco, preto, azul, rosa.
  - Aplicação global da cor (via CSS variables).
  - **Fundo do site**: upload de imagem com opção de **transparência** (ajuste de opacidade via input range).
- **Redes Sociais**:
  - Campos para editar os links do Instagram, Facebook e Threads (exibidos no rodapé).
- **Edição do próprio perfil** (admin pode alterar nome/e-mail/senha).

## 5. Modelagem de Dados (MongoDB)

### 5.1. User (usuários comuns e admin)
```javascript
{
  name: String,
  email: { type: String, unique: true },
  password: String,          // apenas para admin (hash)
  googleId: String,          // para usuários OAuth
  avatar: String,
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  createdAt: Date
}
```

### 5.2. Job (vagas)
```javascript
{
  title: String,
  description: String,
  image: String,              // caminho da imagem
  link: String,                // URL externa
  createdAt: { type: Date, default: Date.now }
}
```

### 5.3. Course (cursos)
```javascript
{
  title: String,
  description: String,
  image: String,
  link: String,
  createdAt: { type: Date, default: Date.now }
}
```

### 5.4. Setting (configurações globais)
```javascript
{
  themeColor: { type: String, default: 'white' },  // white, black, blue, pink
  backgroundImage: String,                          // caminho da imagem de fundo
  backgroundOpacity: { type: Number, default: 1 },  // 0 a 1
  socialInstagram: String,
  socialFacebook: String,
  socialThreads: String
}
```

## 6. Fluxo de Usuário / Telas

### 6.1. Público
- `/` – Página inicial: exibe últimos cursos e vagas em destaque, rodapé com redes sociais.
- `/vagas` – Lista todas as vagas.
- `/cursos` – Lista todos os cursos.
- `/sobre` – Página institucional.
- `/contato` – Formulário de contato (opcional).

### 6.2. Usuário
- `/auth/google` – Inicia login com Google.
- `/auth/logout` – Faz logout.
- `/perfil` – Visualiza/edita dados pessoais.

### 6.3. Administrador
- `/admin/login` – Formulário de login.
- `/admin/dashboard` – Painel principal.
- `/admin/vagas` – CRUD de vagas.
- `/admin/cursos` – CRUD de cursos.
- `/admin/usuarios` – Lista de usuários (opcional).
- `/admin/configuracoes` – Página de configurações (tema, redes sociais, fundo).
- `/admin/perfil` – Edição de perfil do admin.

## 7. Passo a Passo do Desenvolvimento (para o agente IA)

### Fase 1: Configuração Inicial
1. Inicializar projeto Node.js (`npm init`).
2. Instalar dependências: express, ejs, mongoose, passport, passport-local, passport-google-oauth20, express-session, bcryptjs, multer, dotenv, helmet, cors.
3. Configurar estrutura de pastas conforme item 3.
4. Configurar conexão com MongoDB no `config/database.js`.
5. Criar arquivo `.env` com variáveis: `PORT`, `MONGO_URI`, `SESSION_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` (inicial).

### Fase 2: Autenticação
6. Criar modelo `User.js`.
7. Implementar estratégia local para admin no Passport.
8. Implementar estratégia Google OAuth para usuários.
9. Criar rotas de autenticação (`/auth`) e controllers correspondentes.
10. Middleware de autenticação para verificar se usuário é admin ou comum.

### Fase 3: Modelos e CRUDs Básicos
11. Criar modelos `Job`, `Course`, `Setting`.
12. Implementar controllers para CRUD de vagas e cursos (somente admin).
13. Criar views para listagem, criação e edição (com formulários e upload de imagem via Multer).

### Fase 4: Site Público
14. Criar controller `siteController` com métodos:
    - `home`: buscar últimos cursos e vagas, renderizar index.
    - `vagas`: listar todas as vagas.
    - `cursos`: listar todos os cursos.
    - `sobre`, `contato` (estáticos).
15. Configurar rotas públicas.
16. Incluir no rodapé os links de redes sociais vindos de `Setting`.

### Fase 5: Painel Administrativo
17. Criar rotas protegidas para admin.
18. Implementar dashboard com contagens.
19. Implementar CRUD de vagas/cursos com upload de imagens.
20. Implementar página de configurações:
    - Seleção de cor do tema (white, black, blue, pink) – ao salvar, altera uma variável CSS global.
    - Upload de imagem de fundo com campo de opacidade (range).
    - Campos para URLs das redes sociais.
21. Implementar edição de perfil do admin (nome, e-mail, senha).

### Fase 6: Personalização Visual
22. No arquivo de layout principal (`views/partials/header.ejs`), incluir variáveis CSS dinâmicas:
    ```ejs
    <style>
      :root {
        --primary-color: <%= setting.themeColor === 'white' ? '#fff' : (setting.themeColor === 'black' ? '#000' : (setting.themeColor === 'blue' ? '#007bff' : '#e83e8c')) %>;
        --bg-image: url('<%= setting.backgroundImage ? '/uploads/' + setting.backgroundImage : '' %>');
        --bg-opacity: <%= setting.backgroundOpacity %>;
      }
      body {
        background-image: var(--bg-image);
        background-size: cover;
        background-attachment: fixed;
        background-color: rgba(255,255,255,var(--bg-opacity)); /* efeito de transparência */
      }
    </style>
    ```
23. Garantir que a cor primária seja aplicada em botões, links, etc.

### Fase 7: Testes e Ajustes
24. Testar todas as rotas e permissões.
25. Verificar upload de imagens e exibição correta.
26. Validar a funcionalidade de transparência do fundo.
27. Criar um script para popular banco com dados iniciais (opcional).

### Fase 8: Deploy e Credenciais
28. Preparar ambiente de produção (ex: Heroku, Railway, ou VPS).
29. Definir credenciais iniciais do admin:
    - **E-mail:** admin@agencia.com
    - **Senha:** Admin123! (será alterada no primeiro acesso)
    - (Essas credenciais serão informadas no chat, não no código)

## 8. Configurações e Personalização (Detalhamento)

### 8.1. Temas de Cor
O administrador poderá escolher entre quatro opções:
- **Branco** (#ffffff) – padrão.
- **Preto** (#000000).
- **Azul** (#007bff).
- **Rosa** (#e83e8c).

A cor escolhida será aplicada a elementos como:
- Botões primários.
- Links de navegação ativos.
- Bordas de cards.

### 8.2. Fundo com Transparência
- O administrador pode enviar uma imagem (JPEG, PNG).
- Um controle deslizante (0 a 1) define a opacidade da imagem.
- No CSS, usamos `background-image` e sobrepomos uma camada com `rgba` para dar efeito de transparência (ou usamos `opacity` na imagem, mas isso afetaria o conteúdo – a melhor prática é usar um pseudo-elemento ou a propriedade `background-blend-mode`). Sugestão: aplicar a imagem no `body` e usar um overlay com `background-color: rgba(255,255,255, var(--bg-opacity))` para simular transparência.

### 8.3. Redes Sociais
- Três campos de texto para URLs completas (Instagram, Facebook, Threads).
- Exibidas no rodapé como ícones (podemos usar Font Awesome).

## 9. Considerações de Segurança
- Senha do admin armazenada com bcrypt.
- Proteção contra CSRF (usar middleware csurf).
- Validação de sessão e cookies seguros.
- Restrição de acesso às rotas administrativas via middleware `isAdmin`.
- Upload de imagens: validar tipo de arquivo (somente imagens) e tamanho.
- Variáveis de ambiente para chaves secretas.

## 10. Credenciais Padrão do Administrador
Para fins de teste e primeiro acesso, o sistema será inicializado com:
```
E-mail: admin@agencia.com
Senha: Admin123!
```
**Importante:** solicitar ao usuário que altere a senha imediatamente após o primeiro login. Essas credenciais serão fornecidas no chat, não devem ser commitadas no repositório.

## 11. Próximos Passos e Melhorias Futuras
- Implementar sistema de candidatura a vagas.
- Envio de e-mail de confirmação para usuários.
- Módulo de notícias ou blog.
- Internacionalização (português/inglês).

---

Este plano de ação fornece todas as diretrizes necessárias para o agente IA desenvolver a aplicação de forma organizada, seguindo boas práticas e garantindo a entrega de todas as funcionalidades solicitadas.