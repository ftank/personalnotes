# 🚀 Guia de Configuração Rápida - Personal Notes

Este guia vai te ajudar a configurar e rodar o aplicativo completo.

---

## ✅ O Que Já Está Pronto

- ✅ Frontend completo (Login, Chat, Dashboard)
- ✅ Backend completo (rotas, services, WebSocket)
- ✅ Firebase configurado no frontend
- ✅ Chaves de criptografia geradas
- ✅ Servidor de desenvolvimento frontend rodando em `http://localhost:5173`

---

## 📋 Checklist de Configuração

### 1. Firebase Admin SDK (Backend)

**O que fazer:**

1. Acesse o [Firebase Console](https://console.firebase.google.com)
2. Selecione seu projeto: `personalnotes-b82e9`
3. Clique no ícone de engrenagem ⚙️ → **Project Settings**
4. Vá na aba **Service Accounts**
5. Clique em **Generate new private key**
6. Um arquivo JSON será baixado

**Como usar:**

Abra o arquivo JSON baixado e copie TODO o conteúdo (é um objeto grande). Depois:

```bash
# Edite o arquivo .env do backend
cd personal-notes-backend
notepad .env  # ou use seu editor preferido
```

Cole o JSON em UMA LINHA SÓ (remova quebras de linha) no campo `FIREBASE_ADMIN_SDK`:

```env
FIREBASE_ADMIN_SDK={"type":"service_account","project_id":"personalnotes-b82e9",...}
```

---

### 2. Supabase Database (PostgreSQL)

**O que fazer:**

1. Acesse [supabase.com](https://supabase.com)
2. Crie uma conta (grátis)
3. Clique em **New Project**
4. Preencha:
   - Name: `personal-notes`
   - Database Password: (escolha uma senha forte)
   - Region: (escolha a mais próxima)
5. Aguarde ~2 minutos para criar

**Como obter a Connection String:**

1. No projeto criado, vá em **Settings** (ícone de engrenagem)
2. Clique em **Database**
3. Role até **Connection String**
4. Selecione **URI** e copie
5. A string será algo como:
   ```
   postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
   ```

**Cole no .env do backend:**

```env
DATABASE_URL=postgresql://postgres.[project-ref]:[SUA-SENHA]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

**Executar o schema:**

Ainda no Supabase:

1. Vá em **SQL Editor** (menu lateral)
2. Clique em **New Query**
3. Abra o arquivo `personal-notes-backend/schema.sql`
4. Copie TODO o conteúdo
5. Cole no editor do Supabase
6. Clique em **Run** (ou pressione Ctrl+Enter)
7. Você verá mensagens de sucesso para cada tabela criada

---

### 3. Claude API (Anthropic)

**O que fazer:**

1. Acesse [console.anthropic.com](https://console.anthropic.com)
2. Crie uma conta
3. Vá em **API Keys**
4. Clique em **Create Key**
5. Dê um nome: `personal-notes`
6. Copie a chave (começa com `sk-ant-`)

⚠️ **IMPORTANTE:** Você verá a chave apenas UMA VEZ. Guarde em local seguro!

**Cole no .env do backend:**

```env
CLAUDE_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Créditos:**

- Anthropic oferece $5 grátis para novos usuários
- Haiku custa ~$0.25 por 1M tokens (muito barato)
- Para testes, isso deve durar bastante

---

### 4. Redis (Cache Local)

**Windows:**

1. Baixe o Redis para Windows:
   - [Memurai](https://www.memurai.com/get-memurai) (recomendado, grátis)
   - Ou [MSOpenTech](https://github.com/microsoftarchive/redis/releases) (versão mais antiga)

2. Instale e execute
3. Redis rodará em `redis://localhost:6379` (padrão)

**Linux/macOS:**

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install redis-server
sudo systemctl start redis

# macOS
brew install redis
brew services start redis
```

**Testar se está funcionando:**

```bash
redis-cli ping
# Deve retornar: PONG
```

Não precisa alterar nada no `.env` se estiver rodando localmente na porta padrão.

---

## 🎯 Resumo do .env do Backend

Depois de seguir todos os passos acima, seu `.env` deve estar assim:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Firebase Admin SDK (JSON em uma linha)
FIREBASE_ADMIN_SDK={"type":"service_account","project_id":"personalnotes-b82e9",...}

# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres.xxxxx:senha@aws-0-us-east-1.pooler.supabase.com:5432/postgres

# Claude API
CLAUDE_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Encryption (já gerado)
ENCRYPTION_MASTER_KEY=93fc24d9bf0cb8992564a4d355efc553a08948530f4c4410919d63fed300aa85
ANALYTICS_SALT=f2b3129ff938997a58c96043c413bc5a

# Redis (local)
REDIS_URL=redis://localhost:6379

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 🏃 Como Rodar

### Frontend (já está rodando)

```bash
cd personal-notes-frontend
npm run dev
```

Acesse: `http://localhost:5173`

### Backend

```bash
cd personal-notes-backend
npm install
npm run dev
```

O servidor rodará em: `http://localhost:3000`

---

## 🧪 Como Testar

### 1. Teste de Autenticação

1. Abra `http://localhost:5173`
2. Você verá a tela de login
3. Clique em **Continuar com Google**
4. Faça login com sua conta Google
5. Você será redirecionado para `/chat`

### 2. Teste de Chat (requer backend rodando)

1. Após fazer login, clique em **Nova Nota**
2. Digite uma mensagem como: "Olá, como você está?"
3. Aguarde a resposta da IA (Claude)
4. Teste palavras-chave de emergência: "ele me bateu"
5. Você deve ver um alerta vermelho aparecer

### 3. Teste de Objetivos

1. No chat, clique em **Meus Objetivos**
2. Clique em **Novo Objetivo**
3. Preencha título, descrição e data
4. Clique em **Criar Objetivo**
5. Teste editar e marcar como concluído

---

## ⚠️ Problemas Comuns

### "Firebase Admin SDK error"

- Verifique se o JSON está em UMA LINHA só
- Certifique-se de que copiou TODO o conteúdo do arquivo
- Não pode ter aspas duplas dentro de aspas duplas (use escape se necessário)

### "Database connection error"

- Verifique a Connection String do Supabase
- Certifique-se de que substituiu `[YOUR-PASSWORD]` pela senha real
- Teste a conexão no Supabase SQL Editor

### "Claude API error"

- Verifique se a chave começa com `sk-ant-`
- Certifique-se de que tem créditos disponíveis
- Vá no console da Anthropic e verifique se a chave está ativa

### "Redis connection error"

- Verifique se o Redis está rodando: `redis-cli ping`
- Tente reiniciar o serviço
- No Windows, verifique se o Memurai está rodando

---

## 📊 Próximos Passos Após Configuração

1. ✅ Fazer login com Google
2. ✅ Criar primeira conversa
3. ✅ Enviar mensagem e receber resposta
4. ✅ Criar primeiro objetivo
5. ✅ Testar detecção de emergência
6. 🚀 Preparar para deploy (Vercel + Railway)

---

## 🆘 Precisa de Ajuda?

Se encontrar algum erro:

1. Verifique os logs do backend (terminal onde rodou `npm run dev`)
2. Verifique o console do navegador (F12)
3. Certifique-se de que TODAS as variáveis de ambiente estão preenchidas
4. Reinicie o backend após alterar o `.env`

---

**Boa sorte com a configuração! 🎉**
