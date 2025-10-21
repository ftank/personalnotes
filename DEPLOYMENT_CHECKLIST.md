# ✅ Checklist de Deployment - Personal Notes Beta

## 📦 Pré-Deployment

### Código
- [ ] Todo código commitado e pushed
- [ ] Sem console.logs desnecessários
- [ ] Variáveis de desenvolvimento removidas
- [ ] Build de produção testado localmente (`npm run build`)
- [ ] Lint sem erros (`npm run lint`)

### Segurança
- [ ] Todas as secrets em variáveis de ambiente
- [ ] Nunca commitar .env para o Git
- [ ] Firebase security rules configuradas
- [ ] CORS configurado com domínios corretos
- [ ] Rate limiting ativado

---

## 🔐 Configuração de Serviços

### 1. Firebase (15 min)
- [ ] Criar projeto de produção
- [ ] Ativar Authentication → Email/Password
- [ ] Copiar Firebase Config (frontend)
- [ ] Gerar Service Account Key (backend)
- [ ] Configurar Security Rules

### 2. Supabase Database (10 min)
- [ ] Criar projeto
- [ ] Copiar connection string
- [ ] Executar schema SQL
- [ ] Testar conexão
- [ ] Configurar backup automático

### 3. Redis - Upstash (5 min)
- [ ] Criar conta
- [ ] Criar database
- [ ] Copiar Redis URL
- [ ] Testar conexão

### 4. Anthropic Claude API (5 min)
- [ ] Criar conta
- [ ] Gerar API Key
- [ ] Adicionar billing
- [ ] Testar API key

---

## 🚀 Deploy Backend (Render)

### Setup
- [ ] Criar conta no Render
- [ ] Conectar GitHub
- [ ] Criar novo Web Service
- [ ] Selecionar repositório
- [ ] Configurar:
  - Root Directory: `personal-notes-backend`
  - Build Command: `npm install`
  - Start Command: `npm start`
  - Instance Type: Free (beta) ou Starter ($7/mês)

### Variáveis de Ambiente
Adicionar no Render Dashboard:

```bash
PORT=3000
NODE_ENV=production
DATABASE_URL=<cole_aqui>
FIREBASE_ADMIN_SDK=<cole_json_completo>
CLAUDE_API_KEY=<cole_aqui>
ENCRYPTION_MASTER_KEY=<gerar_chave_32_bytes>
ANALYTICS_SALT=<gerar_salt_aleatorio>
REDIS_URL=<cole_upstash_url>
FRONTEND_URL=<sera_configurado_depois>
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Gerar keys seguras:**
```bash
# No terminal:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

- [ ] Todas variáveis configuradas
- [ ] Deploy iniciado
- [ ] Aguardar build (5-10 min)
- [ ] Copiar URL do backend (ex: https://personal-notes-api.onrender.com)
- [ ] Testar endpoint: `https://seu-backend.onrender.com/health`

---

## 🌐 Deploy Frontend (Vercel)

### Setup
- [ ] Criar conta no Vercel
- [ ] Conectar GitHub
- [ ] Import repositório
- [ ] Configurar:
  - Root Directory: `personal-notes-frontend`
  - Framework: Vite
  - Build Command: `npm run build`
  - Output Directory: `dist`

### Variáveis de Ambiente
Adicionar no Vercel Dashboard:

```bash
VITE_FIREBASE_API_KEY=<firebase_api_key>
VITE_FIREBASE_AUTH_DOMAIN=<projeto>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<projeto_id>
VITE_FIREBASE_STORAGE_BUCKET=<projeto>.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=<sender_id>
VITE_FIREBASE_APP_ID=<app_id>
VITE_API_URL=<backend_url_do_render>
```

- [ ] Todas variáveis configuradas
- [ ] Deploy iniciado
- [ ] Aguardar build (2-3 min)
- [ ] Copiar URL do frontend (ex: https://personal-notes.vercel.app)

---

## 🔄 Configuração Final

### Atualizar CORS no Backend
- [ ] Voltar ao Render
- [ ] Atualizar `FRONTEND_URL` com a URL do Vercel
- [ ] Redeploy backend

### Testar Integração
- [ ] Abrir frontend em navegador
- [ ] Registrar novo usuário
- [ ] Fazer login
- [ ] Criar conversa
- [ ] Enviar mensagem
- [ ] Verificar resposta da IA
- [ ] Criar objetivo
- [ ] Testar busca
- [ ] Testar dark mode
- [ ] Testar em mobile

---

## 📊 Monitoramento

### Configurar Logs
- [ ] Habilitar logs no Render
- [ ] Verificar Supabase Dashboard
- [ ] Monitorar Upstash usage

### Métricas Iniciais
- [ ] Backend respondendo (200 OK)
- [ ] Frontend carregando
- [ ] Autenticação funcionando
- [ ] IA respondendo
- [ ] Database salvando dados

---

## 🧪 Testes Pós-Deploy

### Funcionalidades Core
- [ ] ✅ Registro
- [ ] ✅ Login
- [ ] ✅ Criar conversa
- [ ] ✅ Chat com IA
- [ ] ✅ Criar objetivo
- [ ] ✅ Editar objetivo
- [ ] ✅ Deletar conversa
- [ ] ✅ Buscar conversas
- [ ] ✅ Dark mode
- [ ] ✅ Título automático

### Performance
- [ ] ⚡ Load time < 3s
- [ ] ⚡ IA response < 10s
- [ ] ⚡ UI fluida

### Segurança
- [ ] 🔒 HTTPS ativo
- [ ] 🔒 Autenticação funciona
- [ ] 🔒 Rate limiting ativo

---

## 👥 Preparar Beta Test

### Documentação
- [ ] Criar README para beta testers
- [ ] Preparar email de convite
- [ ] Criar formulário de feedback (Google Forms)
- [ ] Preparar canal de suporte (Discord/Email)

### Comunicação
- [ ] Definir grupo inicial (5-10 pessoas)
- [ ] Enviar convites
- [ ] Explicar que é beta
- [ ] Compartilhar link + instruções

---

## 🎯 Template de Email para Beta Testers

```
Assunto: Convite para Beta Test - Personal Notes 🚀

Olá [Nome],

Você está convidado(a) para testar o Personal Notes, uma plataforma de notas pessoais com assistente de IA!

🔗 Link: [seu-link.vercel.app]

📋 O que testar:
- Criar conta e fazer login
- Conversar com a assistente de IA
- Criar e gerenciar objetivos
- Explorar a interface

🐛 Encontrou um bug?
Reporte aqui: [link-do-formulário]

💬 Feedback:
Adoraria ouvir sua opinião! [link-do-formulário]

⏰ Período de teste: 2 semanas

Obrigado por participar!

[Seu Nome]
```

---

## 🆘 Troubleshooting Rápido

### Backend não responde
1. Verificar logs no Render
2. Checar variáveis de ambiente
3. Testar conexão com database
4. Verificar Redis URL

### Frontend erro 500
1. Verificar URL do backend no VITE_API_URL
2. Checar CORS no backend
3. Verificar Firebase config
4. Ver logs do browser (F12)

### IA não responde
1. Verificar Claude API key
2. Checar billing na Anthropic
3. Ver logs do backend
4. Testar API diretamente

### Database erro
1. Verificar connection string
2. Checar se schema foi executado
3. Ver logs do Supabase
4. Testar conexão manual

---

## ✨ Você está pronto!

Após completar este checklist, sua aplicação estará live e pronta para beta testing!

**Próximos passos:**
1. ✅ Convidar beta testers
2. 📊 Monitorar uso diário
3. 🐛 Corrigir bugs reportados
4. 💬 Coletar feedback
5. 🚀 Iterar e melhorar

**Boa sorte! 🎉**
