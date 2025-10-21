# ⚡ Quick Start - Deploy em 30 minutos

## 🎯 Objetivo
Colocar Personal Notes no ar rapidamente para beta test.

---

## 📝 Antes de Começar

### Você vai precisar de:
1. Conta GitHub (para conectar aos serviços)
2. Cartão de crédito (para alguns serviços, mas pode usar free tiers)
3. 30-45 minutos de tempo

---

## 🚀 Passo a Passo Rápido

### 1️⃣ Firebase (5 min)
```
1. Ir para: https://console.firebase.google.com
2. Criar novo projeto: "personal-notes-prod"
3. Authentication → Começar → Email/Password → Ativar
4. Project Settings → Service Accounts → Generate Key
5. Copiar as configurações do Firebase
```

### 2️⃣ Supabase (5 min)
```
1. Ir para: https://supabase.com
2. New Project → Nome: "personal-notes" → Senha forte
3. Esperar criar (2-3 min)
4. SQL Editor → New Query → Colar schema do arquivo database/schema.sql
5. Run
6. Settings → Database → Connection String → Copiar
```

### 3️⃣ Upstash Redis (2 min)
```
1. Ir para: https://upstash.com
2. Create Database → Nome: "personal-notes"
3. Copiar Redis URL
```

### 4️⃣ Anthropic API (3 min)
```
1. Ir para: https://console.anthropic.com
2. Get API Key
3. Add Billing (min $5)
4. Copiar key (começa com sk-ant...)
```

### 5️⃣ Deploy Backend - Render (10 min)
```
1. Ir para: https://render.com
2. New → Web Service
3. Connect GitHub repo
4. Configurar:
   - Name: personal-notes-backend
   - Root Directory: personal-notes-backend
   - Build: npm install
   - Start: npm start
   - Instance: Free (ou Starter $7/mês para produção)

5. Environment Variables (clicar Add):
   PORT = 3000
   NODE_ENV = production
   DATABASE_URL = [colar Supabase URL]
   REDIS_URL = [colar Upstash URL]
   CLAUDE_API_KEY = [colar Anthropic key]
   FIREBASE_ADMIN_SDK = [colar JSON do Firebase]
   ENCRYPTION_MASTER_KEY = [gerar com comando abaixo]
   ANALYTICS_SALT = [gerar com comando abaixo]
   FRONTEND_URL = https://temporary.com (vamos mudar depois)
   RATE_LIMIT_WINDOW_MS = 900000
   RATE_LIMIT_MAX_REQUESTS = 100

6. Create Web Service
7. COPIAR A URL quando deploy terminar (ex: https://xyz.onrender.com)
```

**Gerar keys seguras (rodar no terminal local):**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 6️⃣ Deploy Frontend - Vercel (5 min)
```
1. Ir para: https://vercel.com
2. New Project
3. Import Git Repository
4. Configurar:
   - Root Directory: personal-notes-frontend
   - Framework Preset: Vite

5. Environment Variables:
   VITE_API_URL = [colar URL do Render]
   VITE_FIREBASE_API_KEY = [do Firebase config]
   VITE_FIREBASE_AUTH_DOMAIN = [projeto].firebaseapp.com
   VITE_FIREBASE_PROJECT_ID = [projeto-id]
   VITE_FIREBASE_STORAGE_BUCKET = [projeto].appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID = [sender-id]
   VITE_FIREBASE_APP_ID = [app-id]

6. Deploy
7. COPIAR A URL (ex: https://xyz.vercel.app)
```

### 7️⃣ Atualizar CORS (2 min)
```
1. Voltar ao Render
2. Environment → FRONTEND_URL
3. Mudar para URL do Vercel
4. Save → Redeploy
```

### 8️⃣ Testar (5 min)
```
1. Abrir URL do Vercel
2. Criar conta
3. Enviar mensagem
4. ✅ Sucesso!
```

---

## 🔧 Comandos Úteis

### Gerar chaves seguras
```bash
# Encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Salt
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

### Testar backend local
```bash
cd personal-notes-backend
npm install
npm run dev
```

### Testar frontend local
```bash
cd personal-notes-frontend
npm install
npm run dev
```

### Build de produção (testar antes de deploy)
```bash
# Backend
cd personal-notes-backend
npm install
npm start

# Frontend
cd personal-notes-frontend
npm install
npm run build
npm run preview
```

---

## 📍 Links Importantes

### Serviços
- Firebase Console: https://console.firebase.google.com
- Supabase Dashboard: https://app.supabase.com
- Upstash Console: https://console.upstash.com
- Anthropic Console: https://console.anthropic.com
- Render Dashboard: https://dashboard.render.com
- Vercel Dashboard: https://vercel.com/dashboard

### Documentação
- Firebase Auth: https://firebase.google.com/docs/auth
- Supabase Docs: https://supabase.com/docs
- Claude API: https://docs.anthropic.com/claude/reference
- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs

---

## 🐛 Problemas Comuns

### "Cannot connect to database"
→ Verificar DATABASE_URL está correto
→ Checar se schema foi executado no Supabase

### "Firebase auth error"
→ Verificar todas VITE_FIREBASE_* estão corretas
→ Checar se Email/Password está ativado no Firebase

### "Claude API error"
→ Verificar CLAUDE_API_KEY
→ Checar billing na Anthropic

### "CORS error"
→ Verificar FRONTEND_URL no backend
→ Deve ser exatamente a URL do Vercel (sem / no final)

### Backend dormindo (Render free tier)
→ Primeira request pode demorar 30s
→ Upgrade para Starter ($7/mês) evita isso

---

## 💰 Custos Estimados

### Free Tier (Beta Test pequeno)
- Firebase: Grátis (até 10k autenticações/mês)
- Supabase: Grátis (500MB database)
- Upstash: Grátis (10k commands/dia)
- Anthropic: Pay-as-you-go (~$0.03 por conversa)
- Render: Grátis (com sleep)
- Vercel: Grátis

**Total: ~$5-15/mês** (só Claude API)

### Produção Recomendada
- Firebase: Grátis
- Supabase: Grátis ou $25/mês
- Upstash: Grátis ou $10/mês
- Anthropic: $20-100/mês (depende do uso)
- Render: $7/mês (Starter)
- Vercel: Grátis

**Total: ~$32-142/mês**

---

## ✅ Checklist Final

Antes de convidar beta testers:

- [ ] Site abre sem erros
- [ ] Consegue criar conta
- [ ] Consegue fazer login
- [ ] Chat funciona
- [ ] IA responde
- [ ] Objetivos funcionam
- [ ] Busca funciona
- [ ] Dark mode funciona
- [ ] Funciona no mobile
- [ ] HTTPS ativo (automático no Vercel/Render)

---

## 🎉 Pronto!

Sua aplicação está no ar!

**Próximo passo:** Convidar beta testers

**Template de mensagem:**
```
Oi! 👋

Estou testando uma nova plataforma de notas com IA que criei.

Link: [sua-url].vercel.app

Pode testar e me dar feedback?

Obrigado!
```

---

## 📞 Suporte

**Se travar em algum passo:**
1. Verificar logs (Render → Logs, Vercel → Deployments → Logs)
2. Verificar todas variáveis de ambiente
3. Testar localmente primeiro
4. Ver seção de troubleshooting acima

**Monitoramento diário:**
- Ver Render logs para erros
- Checar Anthropic usage
- Verificar Supabase storage
- Olhar Upstash commands

---

Boa sorte! 🚀
