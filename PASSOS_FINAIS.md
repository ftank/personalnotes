# ✅ Passos Finais - Deploy Completo

## Status Atual
- [x] Backend deployed no Railway ✅
- [ ] Database schema executado
- [ ] Frontend deployed no Vercel
- [ ] CORS configurado
- [ ] App testado

---

## Passo 2: Executar Schema do Database (3 min) 📊

### No Railway:

1. **Clique no serviço PostgreSQL** (o banco de dados, NÃO o backend)
2. Vá em **"Data"** ou **"Query"**
3. Cole o SQL abaixo e execute:

```sql
-- Copiar TODO o conteúdo do arquivo schema.sql
-- Localização: personal-notes-backend/schema.sql
```

**Ou acesse o arquivo no GitHub:**
https://github.com/ftank/personalnotes/blob/main/personal-notes-backend/schema.sql

**Dica:** Copie TODO o conteúdo (258 linhas) e cole no Query Editor do Railway/PostgreSQL

### ✅ Como verificar se funcionou:

Depois de executar, você deve ver estas tabelas criadas:
- users
- conversations
- messages
- user_goals
- progress_checkins
- E mais...

---

## Passo 3: Deploy Frontend no Vercel (5 min) 🌐

### 3.1 Acesse Vercel

1. Ir para: https://vercel.com
2. **Import Project**
3. **GitHub** → Selecionar `ftank/personalnotes`

### 3.2 Configurar Projeto

```
Framework Preset: Vite
Root Directory: personal-notes-frontend
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### 3.3 Adicionar Environment Variables

**IMPORTANTE:** Antes de fazer deploy, adicionar TODAS estas variáveis:

```bash
# Backend URL (copiar do Railway)
VITE_API_URL=https://personalnotes-production.up.railway.app

# Firebase Config (copiar do Firebase Console)
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto-id
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### 3.4 Deploy

1. Clicar em **Deploy**
2. Aguardar 2-3 minutos
3. **Copiar a URL** do Vercel (ex: https://personalnotes-xyz.vercel.app)

---

## Passo 4: Atualizar CORS no Backend (1 min) 🔄

### No Railway:

1. **Backend Service → Variables**
2. Encontrar `FRONTEND_URL`
3. **Atualizar** para a URL do Vercel (sem / no final)
   ```
   FRONTEND_URL=https://personalnotes-xyz.vercel.app
   ```
4. **Aguardar redeploy automático** (~30 segundos)

---

## Passo 5: Testar a Aplicação! (5 min) 🧪

### Checklist de Testes:

1. **Abrir URL do Vercel**
   - [ ] Página de login carrega?

2. **Criar Conta**
   - [ ] Consegue criar conta com email?
   - [ ] Ou fazer login com Google?

3. **Testar Chat**
   - [ ] Consegue criar nova conversa?
   - [ ] Consegue enviar mensagem?
   - [ ] IA responde? (aguardar 5-10s)
   - [ ] Mensagem aparece formatada (Markdown)?

4. **Testar Objetivos**
   - [ ] Ir para "Meus Objetivos"
   - [ ] Criar novo objetivo
   - [ ] Objetivo aparece com título e descrição?

5. **Testar Busca**
   - [ ] Buscar conversa funciona?

6. **Testar Dark Mode**
   - [ ] Alternar tema funciona?

### ✅ Se TUDO funcionar:

**PARABÉNS! 🎉 Seu app está no ar!**

**URLs:**
- Frontend: `_____________________`
- Backend: `_____________________`

---

## 🐛 Troubleshooting

### Frontend não carrega
→ Verificar se todas variáveis VITE_* estão configuradas

### "Cannot connect to backend"
→ Verificar VITE_API_URL está correto
→ Verificar FRONTEND_URL no backend

### IA não responde
→ Verificar CLAUDE_API_KEY no Railway
→ Ver logs do backend: Railway → Backend → Deployments → Logs

### Erro ao criar objetivo
→ Verificar se schema SQL foi executado
→ Ver logs do backend

### CORS error
→ FRONTEND_URL deve ser EXATAMENTE a URL do Vercel

---

## 📊 Monitoramento

### Ver Logs do Backend:
```
Railway → Backend Service → Deployments → View Logs
```

### Ver Database:
```
Railway → PostgreSQL → Data
```

### Verificar Uso:
```
Railway → Project → Usage
```

---

## 💰 Custos Estimados

- Railway: $5-10/mês (PostgreSQL + Redis + Backend)
- Vercel: Grátis
- Anthropic: $5-20/mês (depende do uso)

**Total: ~$10-30/mês para beta test**

---

## 🎉 Compartilhar com Beta Testers

Quando tudo funcionar, envie:

```
Olá! 👋

Teste meu app de notas com IA:
https://seu-app.vercel.app

É só criar uma conta e começar a usar!
Qualquer problema, me avise.

Obrigado! 🚀
```

---

## 📞 Precisa de Ajuda?

Se algo não funcionar:

1. **Ver os logs** (Railway backend)
2. **Verificar variáveis de ambiente**
3. **Me avisar qual erro aparece**

**Links Úteis:**
- Railway Dashboard: https://railway.app/dashboard
- Vercel Dashboard: https://vercel.com/dashboard
- GitHub Repo: https://github.com/ftank/personalnotes

---

**Próximo passo:** Execute o schema SQL no PostgreSQL! 🚀
