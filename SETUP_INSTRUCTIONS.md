# Personal Notes - Instruções de Setup

## 📁 Estrutura do Projeto Criada

```
Personalnotes/
├── PROJETO_CHATBOT_APOIO.md          # Documentação técnica completa
├── SETUP_INSTRUCTIONS.md              # Este arquivo
├── personal-notes-frontend/           # React + Vite frontend
│   ├── src/
│   │   ├── components/                # Componentes React (a criar)
│   │   ├── pages/                     # Páginas (a criar)
│   │   ├── services/                  # Serviços API (a criar)
│   │   ├── hooks/                     # Custom hooks (a criar)
│   │   ├── utils/                     # Utilidades (a criar)
│   │   ├── store/                     # Zustand store (a criar)
│   │   ├── styles/                    # Estilos globais
│   │   └── index.css                  # ✅ Tailwind CSS configurado
│   ├── tailwind.config.js             # ✅ Configuração Tailwind
│   ├── postcss.config.js              # ✅ PostCSS configurado
│   ├── .env.example                   # ✅ Template de variáveis
│   └── package.json                   # ✅ Dependências instaladas
│
└── personal-notes-backend/            # Node.js + Express backend
    ├── src/
    │   ├── routes/                    # Rotas API (a criar)
    │   ├── controllers/               # Controllers (a criar)
    │   ├── services/                  # Serviços business logic (a criar)
    │   ├── middleware/
    │   │   ├── auth.js                # ✅ Autenticação Firebase
    │   │   └── errorHandler.js        # ✅ Error handling
    │   ├── utils/
    │   │   └── encryption.js          # ✅ Sistema de criptografia
    │   ├── config/
    │   │   ├── firebase.js            # ✅ Config Firebase Admin
    │   │   ├── database.js            # ✅ Config PostgreSQL
    │   │   └── redis.js               # ✅ Config Redis
    │   └── index.js                   # ✅ Server principal
    ├── schema.sql                     # ✅ Schema completo do banco
    ├── .env.example                   # ✅ Template de variáveis
    └── package.json                   # ✅ Dependências instaladas
```

## ✅ O Que Já Foi Feito

1. **Estrutura de Pastas**: Criada para frontend e backend
2. **Dependências**: Instaladas todas as bibliotecas necessárias
3. **Tailwind CSS**: Configurado com cores personalizadas
4. **Backend Core**:
   - Servidor Express com Socket.IO
   - Configuração Firebase Admin
   - Configuração PostgreSQL (Supabase)
   - Configuração Redis
   - Sistema de criptografia AES-256-GCM
   - Middleware de autenticação
   - Error handling
5. **Database Schema**: SQL completo com todas as tabelas

## 🔧 Próximos Passos para Continuar

### 1. Configurar Contas e Serviços (15-30 min)

#### Firebase (Autenticação)
1. Ir para https://console.firebase.google.com/
2. Criar novo projeto: "chatbot-apoio"
3. Ativar Authentication:
   - Email/Password
   - Google OAuth
   - (Opcional) Facebook OAuth
4. Baixar arquivo de configuração:
   - Para **frontend**: Web App Config (JSON)
   - Para **backend**: Service Account Key (JSON)

#### Supabase (Banco de Dados)
1. Ir para https://supabase.com/
2. Criar novo projeto
3. Copiar `DATABASE_URL` (encontrado em Settings > Database)
4. Executar o schema:
   - Ir para SQL Editor
   - Colar conteúdo de `schema.sql`
   - Executar

#### Claude API
1. Criar conta em https://console.anthropic.com/
2. Gerar API key
3. Copiar key (começa com `sk-ant-api03-...`)

#### Railway (Backend Hosting - Opcional por enquanto)
1. Criar conta em https://railway.app/
2. Vincular GitHub
3. Redis será configurado automaticamente

### 2. Configurar Variáveis de Ambiente

#### Frontend (.env)
Copiar `.env.example` para `.env`:
```bash
cd personal-notes-frontend
copy .env.example .env
```

Editar `.env` com suas credenciais Firebase:
```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=personal-notes.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=personal-notes
VITE_FIREBASE_STORAGE_BUCKET=personal-notes.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123

VITE_API_URL=http://localhost:3000
```

#### Backend (.env)
Copiar `.env.example` para `.env`:
```bash
cd personal-notes-backend
copy .env.example .env
```

Editar `.env`:
```
PORT=3000
NODE_ENV=development

# Supabase Database URL
DATABASE_URL=postgresql://postgres:[SUA-SENHA]@[SEU-PROJETO].supabase.co:5432/postgres

# Firebase Admin SDK (colar JSON em uma linha)
FIREBASE_ADMIN_SDK={"type":"service_account","project_id":"personal-notes",...}

# Claude API
CLAUDE_API_KEY=sk-ant-api03-...

# Gerar chaves aleatórias
ENCRYPTION_MASTER_KEY=[gerar_32_bytes_hex]
ANALYTICS_SALT=[gerar_string_aleatoria]

# Redis (local por enquanto)
REDIS_URL=redis://localhost:6379

# Frontend URL
FRONTEND_URL=http://localhost:5173

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Para gerar chaves aleatórias:**
```bash
# No Node.js REPL
node
> require('crypto').randomBytes(32).toString('hex')
```

### 3. Instalar Redis Localmente (Desenvolvimento)

**Windows:**
1. Baixar Redis para Windows: https://github.com/microsoftarchive/redis/releases
2. Ou usar Docker:
```bash
docker run -d -p 6379:6379 redis:alpine
```

**Linux/Mac:**
```bash
# Mac
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis
```

### 4. Arquivos que VOCÊ Precisa Criar Ainda

Vou criar apenas os principais para você começar. Os restantes você pode criar conforme necessidade.

#### Backend - Arquivos Essenciais Faltantes:

1. **Routes** (criar arquivos vazios):
   - `src/routes/auth.js`
   - `src/routes/user.js`
   - `src/routes/conversations.js`
   - `src/routes/goals.js`
   - `src/routes/resources.js`

2. **Services**:
   - `src/services/socket.js` (WebSocket handler)
   - `src/services/claude.js` (integração Claude API)
   - `src/services/emergency.js` (detecção de emergências)

3. **Controllers**:
   - Criar conforme necessidade nas rotas

#### Frontend - Arquivos Essenciais:

1. **Configurações**:
   - `src/config/firebase.js` (config Firebase client)

2. **Services**:
   - `src/services/api.js` (axios client)
   - `src/services/socket.js` (Socket.IO client)

3. **Store** (Zustand):
   - `src/store/authStore.js`
   - `src/store/chatStore.js`

4. **Pages**:
   - `src/pages/Login.jsx`
   - `src/pages/Chat.jsx`
   - `src/pages/Dashboard.jsx`

5. **Components**:
   - `src/components/ChatMessage.jsx`
   - `src/components/ChatInput.jsx`
   - `src/components/Sidebar.jsx`

## 🚀 Como Rodar o Projeto (Quando Completo)

### Backend
```bash
cd personal-notes-backend
npm install  # Já foi feito
npm start    # Ou: node src/index.js
```

### Frontend
```bash
cd personal-notes-frontend
npm install  # Já foi feito
npm run dev
```

Acesse: http://localhost:5173

## 📝 Ordem de Desenvolvimento Sugerida

### Fase 1: Backend API Básico (2-3 horas)
1. ✅ Configuração inicial
2. ✅ Sistema de criptografia
3. ✅ Middleware de autenticação
4. ⏳ Rotas básicas (auth, user)
5. ⏳ Integração Claude API
6. ⏳ WebSocket para chat

### Fase 2: Frontend Básico (2-3 horas)
1. ⏳ Configuração Firebase client
2. ⏳ Tela de Login
3. ⏳ Store de autenticação
4. ⏳ Interface de chat básica
5. ⏳ Conexão WebSocket

### Fase 3: Funcionalidades Core (3-4 horas)
1. ⏳ Persistência de mensagens
2. ⏳ Histórico de conversas
3. ⏳ Sistema de metas
4. ⏳ Detecção de emergências
5. ⏳ Recursos de emergência

### Fase 4: Refinamentos (2-3 horas)
1. ⏳ UI/UX melhorias
2. ⏳ Tratamento de erros
3. ⏳ Loading states
4. ⏳ Testes básicos

## 🐛 Troubleshooting Comum

### Firebase Admin SDK Error
- Certifique-se que o JSON está em uma linha só no .env
- Escape aspas duplas se necessário

### Database Connection Error
- Verifique se a DATABASE_URL está correta
- Certifique-se que o IP está autorizado no Supabase (Settings > Database > Connection Pooling)

### Redis Connection Error
- Se Redis não estiver disponível, o backend continuará funcionando (cache desabilitado)
- Para desenvolvimento, Redis é opcional

### CORS Error
- Verifique se FRONTEND_URL está correto no backend .env
- Certifique-se que o frontend está rodando em http://localhost:5173

## 📚 Recursos Adicionais

- **Documentação completa**: `PROJETO_CHATBOT_APOIO.md`
- **Firebase Docs**: https://firebase.google.com/docs
- **Claude API Docs**: https://docs.anthropic.com/
- **Supabase Docs**: https://supabase.com/docs
- **Socket.IO Docs**: https://socket.io/docs/v4/

## ✨ Próxima Sessão de Desenvolvimento

Quando estiver pronto para continuar, podemos:
1. Criar os arquivos de rotas do backend
2. Implementar a integração com Claude API
3. Criar o serviço de WebSocket
4. Desenvolver a interface de login no frontend
5. Criar componentes do chat

Basta me avisar qual parte você quer desenvolver primeiro!

---

**Status atual**: ✅ Setup inicial completo (40% do MVP)

**Tempo estimado restante**: 10-15 horas para MVP funcional
