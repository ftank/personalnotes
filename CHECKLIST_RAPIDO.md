# ⚡ Checklist Deploy Rápido

## 🎯 Objetivo: App online em 20 minutos

---

## ☑️ ANTES DE COMEÇAR

- [ ] Código no GitHub (pushado e atualizado)
- [ ] Firebase configurado (tem as chaves)
- [ ] Anthropic API Key (tem a key)
- [ ] Cartão de crédito para Railway ($5 trial)

---

## 1️⃣ RAILWAY (10 min)

### PostgreSQL
- [ ] Criar conta em railway.app
- [ ] New Project
- [ ] Add PostgreSQL
- [ ] Copiar DATABASE_URL

### Redis
- [ ] Add Redis
- [ ] Copiar REDIS_URL

### Executar Schema
- [ ] Abrir PostgreSQL → Data
- [ ] Executar SQL do arquivo `database/schema.sql`
- [ ] Verificar tabelas criadas

### Backend
- [ ] Add Service → GitHub Repo
- [ ] Root Directory: `personal-notes-backend`
- [ ] Adicionar variáveis (ver abaixo)
- [ ] Aguardar deploy (2-3 min)
- [ ] Generate Domain
- [ ] Copiar URL: ________________

#### Variáveis do Backend
```
PORT = 3000
NODE_ENV = production
DATABASE_URL = (copiar do PostgreSQL)
REDIS_URL = (copiar do Redis)
FIREBASE_ADMIN_SDK = (colar JSON completo)
CLAUDE_API_KEY = sk-ant-api03-...
ENCRYPTION_MASTER_KEY = (gerar com node)
ANALYTICS_SALT = (gerar com node)
FRONTEND_URL = https://temporary.com
RATE_LIMIT_WINDOW_MS = 900000
RATE_LIMIT_MAX_REQUESTS = 100
```

**Gerar keys:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 2️⃣ VERCEL (5 min)

### Deploy Frontend
- [ ] Abrir vercel.com
- [ ] Import Git Repository
- [ ] Root Directory: `personal-notes-frontend`
- [ ] Framework: Vite
- [ ] Adicionar variáveis (ver abaixo)
- [ ] Deploy
- [ ] Copiar URL: ________________

#### Variáveis do Frontend
```
VITE_API_URL = (URL do Railway)
VITE_FIREBASE_API_KEY =
VITE_FIREBASE_AUTH_DOMAIN =
VITE_FIREBASE_PROJECT_ID =
VITE_FIREBASE_STORAGE_BUCKET =
VITE_FIREBASE_MESSAGING_SENDER_ID =
VITE_FIREBASE_APP_ID =
```

---

## 3️⃣ ATUALIZAR CORS (2 min)

- [ ] Voltar ao Railway
- [ ] Backend → Variables
- [ ] FRONTEND_URL = (URL do Vercel)
- [ ] Aguardar redeploy

---

## 4️⃣ TESTAR (3 min)

- [ ] Abrir URL do Vercel
- [ ] Criar nova conta
- [ ] Fazer login
- [ ] Enviar mensagem no chat
- [ ] IA responde?
- [ ] Criar objetivo
- [ ] Objetivo aparece?
- [ ] Dark mode funciona?

### ✅ Tudo funcionando!

---

## 5️⃣ COMPARTILHAR

**Sua URL:** ________________

**Copiar e colar:**
```
Oi! Teste meu app de notas com IA:
[SUA_URL_AQUI]

É só criar uma conta e começar a usar!
```

---

## 📊 Status

- [ ] Backend: Online ✅
- [ ] Frontend: Online ✅
- [ ] Database: Conectado ✅
- [ ] Redis: Conectado ✅
- [ ] IA: Respondendo ✅

---

## 🐛 Troubleshooting Rápido

### Erro ao criar conta
→ Verificar Firebase config no frontend

### Chat não responde
→ Ver logs do Railway backend
→ Verificar CLAUDE_API_KEY

### Objetivos não aparecem
→ Verificar se schema SQL foi executado
→ Ver logs do backend

### CORS error
→ FRONTEND_URL deve ser exatamente a URL do Vercel

---

## ⏱️ Tempo Total

- Railway setup: 10 min
- Vercel setup: 5 min
- CORS update: 2 min
- Testes: 3 min
**Total: ~20 minutos**

---

## 💡 Dica Pro

Salve as URLs em um lugar seguro:
- Backend: ________________
- Frontend: ________________
- Database: ________________

---

**Pronto para começar? Vamos lá! 🚀**
