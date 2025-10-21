# 📝 Personal Notes

> Aplicativo de apoio emocional disfarçado como app de notas pessoais, desenvolvido para ajudar pessoas em relacionamentos tóxicos.

---

## 🎯 Sobre o Projeto

Personal Notes é um aplicativo web que oferece suporte emocional através de uma IA (Claude) para pessoas em situações de relacionamento tóxico ou abusivo. O app é disfarçado como um simples bloco de notas para proteger a privacidade e segurança dos usuários.

### Funcionalidades Principais

- 🔐 **Autenticação segura** (Google OAuth + Email/Password)
- 💬 **Chat com IA empática** (Claude API)
- 🚨 **Detecção automática de emergências**
- 🎯 **Gerenciamento de objetivos pessoais**
- 🔒 **Criptografia end-to-end** (AES-256-GCM)
- 📱 **Interface responsiva** (mobile-first)
- 🌐 **Comunicação em tempo real** (Socket.IO)

---

## 🛠️ Tecnologias

### Frontend
- **React 19** - Framework UI
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Estilização
- **Zustand** - Gerenciamento de estado
- **Socket.IO Client** - WebSocket
- **Firebase Auth** - Autenticação
- **Axios** - HTTP requests
- **Lucide React** - Ícones

### Backend
- **Node.js** - Runtime
- **Express 5** - Framework web
- **Socket.IO** - WebSocket server
- **Firebase Admin SDK** - Verificação de tokens
- **PostgreSQL** (Supabase) - Database
- **Redis** - Cache e sessões
- **Anthropic Claude API** - Inteligência Artificial
- **Crypto** - Criptografia

---

## 📁 Estrutura do Projeto

```
Personalnotes/
├── personal-notes-frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Chat.jsx
│   │   │   └── Dashboard.jsx
│   │   ├── store/
│   │   │   ├── authStore.js
│   │   │   ├── chatStore.js
│   │   │   └── goalsStore.js
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   └── socket.js
│   │   ├── config/
│   │   │   └── firebase.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env
│   └── package.json
│
├── personal-notes-backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── user.js
│   │   │   ├── conversations.js
│   │   │   ├── goals.js
│   │   │   └── resources.js
│   │   ├── services/
│   │   │   ├── claude.js
│   │   │   ├── emergency.js
│   │   │   └── socket.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── errorHandler.js
│   │   ├── config/
│   │   │   ├── firebase.js
│   │   │   ├── database.js
│   │   │   └── redis.js
│   │   └── utils/
│   │       └── encryption.js
│   ├── schema.sql
│   ├── server.js
│   ├── generate-keys.js
│   ├── .env
│   └── package.json
│
├── PROJETO_CHATBOT_APOIO.md
├── SETUP_INSTRUCTIONS.md
├── CONFIGURACAO_RAPIDA.md
├── STATUS_SESSION_3.md
└── README.md (este arquivo)
```

---

## 🚀 Como Rodar

### Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn
- Conta Firebase criada
- Conta Supabase criada
- Conta Anthropic criada
- Redis instalado localmente

### Passo a Passo

**Siga o guia completo em:** [CONFIGURACAO_RAPIDA.md](./CONFIGURACAO_RAPIDA.md)

**Resumo:**

1. **Clone e instale dependências:**

```bash
# Frontend
cd personal-notes-frontend
npm install

# Backend
cd personal-notes-backend
npm install
```

2. **Configure as variáveis de ambiente:**

Siga as instruções em `CONFIGURACAO_RAPIDA.md` para obter:
- Firebase Admin SDK JSON
- Supabase Connection String
- Claude API Key

3. **Execute o schema do banco de dados:**

No Supabase SQL Editor, execute o arquivo `schema.sql`

4. **Inicie os servidores:**

```bash
# Terminal 1 - Frontend
cd personal-notes-frontend
npm run dev

# Terminal 2 - Backend
cd personal-notes-backend
npm run dev
```

5. **Acesse:**

- Frontend: http://localhost:5173
- Backend: http://localhost:3000

---

## 🔐 Segurança

### Criptografia

- **Algoritmo:** AES-256-GCM
- **Chave:** Derivada do UID do usuário + master key
- **IV:** Gerado aleatoriamente para cada mensagem
- **Auth Tag:** Verificação de integridade

### Dados Criptografados

- Conteúdo de mensagens
- Título e descrição de objetivos
- Dados de check-ins de humor
- Informações de incidentes

### Zero-Knowledge Architecture

O backend não pode descriptografar os dados sem a chave do usuário. Apenas metadados (timestamps, IDs) são visíveis.

---

## 🆘 Detecção de Emergências

### Palavras-chave Monitoradas

O sistema detecta automaticamente situações de risco baseado em palavras-chave:

- Violência física: "me bateu", "me machucou", "vai me matar"
- Ameaças: "ameaçou", "vai fazer algo", "tenho medo"
- Violência psicológica: "me humilha", "me controla", "não posso sair"

### Níveis de Risco

- **Alto (High):** Violência física iminente ou recente
- **Médio (Medium):** Ameaças ou situação de perigo
- **Baixo (Low):** Sinais de abuso emocional

### Recursos Fornecidos

Quando detectado risco, o sistema automaticamente oferece:

- 📞 **190** - Polícia Militar
- 📞 **180** - Central de Atendimento à Mulher
- 📞 **188** - CVV (Centro de Valorização da Vida)
- 🏥 Centros de atendimento locais (se disponíveis)

---

## 📊 API Endpoints

### Autenticação
- `POST /api/auth/verify` - Verificar token Firebase
- `POST /api/auth/logout` - Fazer logout

### Usuário
- `GET /api/user/profile` - Obter perfil
- `DELETE /api/user/delete-account` - Excluir conta (LGPD)
- `GET /api/user/export-data` - Exportar dados (LGPD)
- `POST /api/user/consent` - Registrar consentimentos

### Conversas
- `GET /api/conversations` - Listar conversas
- `POST /api/conversations` - Criar conversa
- `GET /api/conversations/:id` - Obter conversa
- `PUT /api/conversations/:id` - Atualizar conversa
- `DELETE /api/conversations/:id` - Excluir conversa
- `GET /api/conversations/:id/messages` - Obter mensagens

### Objetivos
- `GET /api/goals` - Listar objetivos
- `POST /api/goals` - Criar objetivo
- `PUT /api/goals/:id` - Atualizar objetivo
- `DELETE /api/goals/:id` - Excluir objetivo
- `POST /api/goals/:id/checkin` - Registrar check-in

### Recursos
- `GET /api/resources` - Listar recursos de apoio
- `GET /api/resources/emergency` - Recursos de emergência

---

## 🧪 Testes

### Teste de Autenticação

1. Abra http://localhost:5173
2. Clique em "Continuar com Google"
3. Faça login
4. Verifique redirecionamento para `/chat`

### Teste de Chat

1. Clique em "Nova Nota"
2. Digite: "Olá, como você está?"
3. Aguarde resposta da IA
4. Digite: "ele me bateu ontem"
5. Verifique alerta de emergência

### Teste de Objetivos

1. Vá em "Meus Objetivos"
2. Crie um objetivo
3. Atualize progresso
4. Marque como concluído

---

## 🌐 Deploy

### Frontend (Vercel)

```bash
cd personal-notes-frontend
vercel --prod
```

### Backend (Railway)

1. Crie conta em railway.app
2. Conecte ao GitHub
3. Configure variáveis de ambiente
4. Deploy automático no push

---

## 📝 Conformidade LGPD/GDPR

- ✅ Direito ao esquecimento (`DELETE /api/user/delete-account`)
- ✅ Portabilidade de dados (`GET /api/user/export-data`)
- ✅ Consentimento explícito (`POST /api/user/consent`)
- ✅ Criptografia de dados sensíveis
- ✅ Logs de auditoria
- ✅ Política de privacidade clara

---

## 🤝 Contribuindo

Este é um projeto sensível com foco em segurança e privacidade. Contribuições são bem-vindas, mas devem:

1. Manter a segurança em primeiro lugar
2. Não comprometer a criptografia
3. Seguir boas práticas de privacidade
4. Ter testes adequados

---

## 📄 Licença

Este projeto é de código aberto sob licença MIT.

---

## ⚠️ Aviso Importante

Este aplicativo NÃO substitui ajuda profissional (psicólogos, assistentes sociais, polícia). Em situações de perigo imediato, ligue **190** ou **180**.

---

## 👥 Equipe

Desenvolvido com o objetivo de ajudar pessoas em situações vulneráveis.

---

## 📚 Documentação Adicional

- [PROJETO_CHATBOT_APOIO.md](./PROJETO_CHATBOT_APOIO.md) - Especificação técnica completa
- [SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md) - Instruções detalhadas de setup
- [CONFIGURACAO_RAPIDA.md](./CONFIGURACAO_RAPIDA.md) - Guia rápido de configuração
- [STATUS_SESSION_3.md](./STATUS_SESSION_3.md) - Status atual do desenvolvimento

---

**Personal Notes - Cuidando de você, discretamente. 💙**
