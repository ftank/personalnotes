# 🚂 Railway Deploy Fix - Configuração Correta

## ❌ Problema

Railway está tentando fazer deploy da pasta raiz, mas o código backend está em `personal-notes-backend/`.

## ✅ Solução Rápida

### Opção 1: Configurar Root Directory no Railway (Recomendado)

1. **Vá para Railway Dashboard**
2. **Selecione seu serviço backend**
3. **Settings → Root Directory**
4. **Configure:** `personal-notes-backend`
5. **Redeploy**

### Opção 2: Usar Railway CLI

```bash
# Na pasta do projeto
railway link

# Configurar root directory
railway up --rootDir personal-notes-backend
```

---

## 📝 Configuração Completa Passo a Passo

### 1. PostgreSQL

```
1. Railway → New → Database → PostgreSQL
2. Copiar DATABASE_URL das variáveis
```

### 2. Redis

```
1. Railway → Add Service → Redis
2. Copiar REDIS_URL
```

### 3. Backend Service

```
1. Railway → New Service → GitHub Repo
2. Selecionar: ftank/personalnotes
3. Settings → Configure:

   Root Directory: personal-notes-backend

4. Variables → Add:
   PORT = 3000
   NODE_ENV = production
   DATABASE_URL = (do PostgreSQL)
   REDIS_URL = (do Redis)
   FIREBASE_ADMIN_SDK = {"type":"service_account"...}
   CLAUDE_API_KEY = sk-ant-api03-xxx
   ENCRYPTION_MASTER_KEY = (gerar)
   ANALYTICS_SALT = (gerar)
   FRONTEND_URL = https://temporary.com
   RATE_LIMIT_WINDOW_MS = 900000
   RATE_LIMIT_MAX_REQUESTS = 100

5. Deploy
```

### 4. Executar Schema SQL

```
1. PostgreSQL → Data
2. Copiar schema de: personal-notes-backend/schema.sql
3. Executar
```

### 5. Gerar URL do Backend

```
1. Backend Service → Settings → Networking
2. Generate Domain
3. Copiar URL: https://xyz.railway.app
```

---

## 🔑 Gerar Keys de Encriptação

No seu terminal local:

```bash
# ENCRYPTION_MASTER_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# ANALYTICS_SALT
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

---

## 🌐 Deploy Frontend no Vercel

```bash
# Ou via dashboard:
1. vercel.com → Import Project
2. GitHub → ftank/personalnotes
3. Root Directory: personal-notes-frontend
4. Framework: Vite
5. Environment Variables:
   VITE_API_URL = (URL do Railway)
   VITE_FIREBASE_API_KEY = xxx
   VITE_FIREBASE_AUTH_DOMAIN = xxx.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID = xxx
   VITE_FIREBASE_STORAGE_BUCKET = xxx.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID = xxx
   VITE_FIREBASE_APP_ID = xxx

6. Deploy
```

---

## 🔄 Atualizar CORS

Depois do Vercel deploy:

```
1. Railway → Backend → Variables
2. FRONTEND_URL = (URL do Vercel)
3. Aguardar redeploy
```

---

## ✅ Verificar Deploy

### Backend
```
https://seu-backend.railway.app/
# Deve retornar: Cannot GET /
```

### Frontend
```
https://seu-frontend.vercel.app
# Deve abrir a tela de login
```

---

## 🐛 Troubleshooting

### "Nixpacks build failed"
→ **Solução:** Configurar Root Directory para `personal-notes-backend`

### "Module not found"
→ **Solução:** Verificar se buildCommand está correto: `npm install`

### "Cannot connect to database"
→ **Solução:** Verificar DATABASE_URL e schema executado

### "Redis connection failed"
→ **Solução:** Verificar REDIS_URL

---

## 📸 Screenshots de Configuração

### Root Directory
```
Settings → Root Directory → personal-notes-backend
```

### Environment Variables
```
Variables → New Variable → Adicionar todas listadas acima
```

### Networking
```
Settings → Networking → Generate Domain
```

---

## ✨ Depois que funcionar

Você terá:
- ✅ Backend rodando 24/7
- ✅ PostgreSQL configurado
- ✅ Redis configurado
- ✅ URL pública do backend
- ✅ Deploy automático em cada git push

---

**Se ainda assim não funcionar, me avise qual erro aparece! 🚀**
