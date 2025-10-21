# Personal Notes - Aplicativo de Suporte com Camada de Disfarce

## 🎯 CONTEXTO DO PROJETO

**Nome do Projeto:** Personal Notes (Notas Pessoais)

**Propósito Real:** Aplicativo web/mobile que funciona como um chatbot de apoio emocional e prático para pessoas em relacionamentos tóxicos ou abusivos, disfarçado como um aplicativo de notas pessoais.

**Objetivo:** Fornecer suporte 24/7, orientação prática, e ajudar a pessoa a traçar metas para sair dessa situação, mantendo privacidade e segurança através do disfarce.

**Por que "Personal Notes"?**
- Aparência de aplicativo comum de notas
- Não levanta suspeitas se alguém ver instalado
- Funcionalidade real de notas pode ser usada como capa
- Nome neutro e discreto

### Inspiração

O projeto nasceu da minha própria experiência em um relacionamento tóxico com uma pessoa com possíveis transtornos de personalidade (bipolaridade/borderline), que incluiu:

- Reações desproporcionais
- Extorsão emocional e financeira
- Ameaças após o término
- Dificuldade de me abrir com amigos por medo de julgamento
- Necessidade de suporte imediato e privado

---

## 💻 STACK TECNOLÓGICA

### Frontend

- **Framework:** React (com experiência prévia)
- **Build Tool:** Vite
- **Estilização:** Tailwind CSS
- **Deploy:** Vercel (gratuito)

### Backend

- **Runtime:** Node.js
- **Framework:** Express
- **WebSocket:** Socket.io (para chat em tempo real)
- **Cache:** Redis (Railway tier gratuito)
- **Fila:** BullMQ (para processamento assíncrono)
- **Deploy:** Railway ou Render (tier gratuito)

### Banco de Dados

- **Database:** PostgreSQL
- **Hosting:** Supabase (500MB gratuito)

### Autenticação

- **Serviço:** Firebase Authentication
- **Métodos:** Google OAuth, Facebook OAuth, Email/Senha
- **Tier gratuito:** 50k usuários/mês

### IA/LLM

- **Opções:** Claude API (preferencial) ou OpenAI API
- **Modelos:** Claude Haiku (classificação) + Claude Sonnet (respostas complexas)
- **Experiência prévia:** Já trabalhei com OpenAI API
- **Objetivo:** Respostas empáticas, contextuais, e orientadas a ação

---

## 🏗️ ARQUITETURA DO SISTEMA

```
┌─────────────────────────────────┐
│       React Frontend            │
│   (Vercel - vercel.com)         │
│   - Interface do chat           │
│   - Dashboard de metas          │
│   - Histórico de conversas      │
│   - WebSocket client            │
└───────────┬─────────────────────┘
            │ HTTPS/WSS
            ↓
┌─────────────────────────────────┐
│    Node.js API (Express)        │
│   (Railway/Render)              │
│   - Rotas autenticadas          │
│   - Socket.io server            │
│   - Integração com LLM          │
│   - Criptografia de dados       │
│   - Rate limiting               │
│   - Security logs               │
└─────┬───────┬───────┬───────────┘
      │       │       │
      ↓       ↓       ↓
┌──────────┐ ┌─────┐ ┌──────────┐
│ Firebase │ │Redis│ │PostgreSQL│
│   Auth   │ │Cache│ │(Supabase)│
└──────────┘ └─────┘ └────┬─────┘
                           │
                           ↓
                      ┌──────────┐
                      │Claude API│
                      │  Haiku   │
                      │  Sonnet  │
                      └──────────┘
```

---

## 🗄️ ESTRUTURA DO BANCO DE DADOS

```sql
-- Tabela de usuários
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  firebase_uid VARCHAR(128) UNIQUE NOT NULL,
  email_encrypted TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  encryption_key_hash TEXT NOT NULL,
  risk_level VARCHAR(20) DEFAULT 'low' -- 'low', 'medium', 'high'
);

-- Tabela de conversas
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de mensagens (criptografadas)
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
  content_encrypted TEXT NOT NULL,
  role VARCHAR(20) NOT NULL, -- 'user' ou 'assistant'
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Tabela de metas/objetivos
CREATE TABLE user_goals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  goal_encrypted TEXT NOT NULL,
  description_encrypted TEXT,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'abandoned'
  progress INTEGER DEFAULT 0, -- 0-100
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Tabela de check-ins de progresso
CREATE TABLE progress_checkins (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  goal_id INTEGER REFERENCES user_goals(id) ON DELETE CASCADE,
  notes_encrypted TEXT,
  mood_score INTEGER, -- 1-10
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela para documentação de incidentes (futura fase)
CREATE TABLE incidents (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  description_encrypted TEXT NOT NULL,
  incident_date TIMESTAMP,
  evidence_urls_encrypted TEXT[], -- URLs de fotos/prints
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de logs de segurança
CREATE TABLE security_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  event_type VARCHAR(50), -- 'login', 'failed_login', 'password_change', 'data_export'
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de analytics (dados agregados e não-identificáveis)
CREATE TABLE analytics_events (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(50), -- 'message_sent', 'goal_created', 'login'
  user_id_hashed VARCHAR(64), -- Hash do user_id (não identificável)
  metadata JSONB, -- dados agregados, não-sensíveis
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de padrões identificados
CREATE TABLE identified_patterns (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  pattern_type VARCHAR(50), -- 'gaslighting', 'manipulation', 'threats', etc
  identified_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_conversations_user ON conversations(user_id);
CREATE INDEX idx_goals_user ON user_goals(user_id);
CREATE INDEX idx_security_logs_user ON security_logs(user_id);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
```

---

## 🔐 SEGURANÇA E CRIPTOGRAFIA

### Requisitos de Segurança

1. **Autenticação forte:** OAuth2 via Firebase
2. **Criptografia em trânsito:** HTTPS/WSS obrigatório
3. **Criptografia em repouso:** Conteúdo sensível criptografado no banco
4. **Zero-knowledge:** Backend não consegue ler mensagens sem chave do usuário
5. **Proteção contra abusadores:** 2FA opcional, PIN adicional
6. **Rate limiting:** Proteção contra ataques de força bruta
7. **Security logs:** Monitoramento de atividades suspeitas
8. **Modo disfarce:** Aparência de app diferente para segurança

### Implementação de Criptografia

**Biblioteca:** `crypto` (nativo Node.js) + `bcrypt`

**Fluxo Híbrido (Melhorado):**

1. Usuário faz login → Firebase retorna UID
2. Backend gera chave mestre do UID + salt (para recuperação)
3. Usuário pode opcionalmente definir PIN (chave secundária)
4. Dados críticos usam chave mestre + chave secundária quando disponível
5. Todas mensagens são criptografadas antes de salvar
6. Descriptografia acontece apenas no momento de exibir

**Exemplo de implementação:**

```javascript
const crypto = require('crypto');
const bcrypt = require('bcrypt');

const ALGORITHM = 'aes-256-gcm';

// Derivar chave segura do UID + salt
const deriveKey = async (password, salt, iterations = 100000) => {
  return crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256');
};

// Gerar salt único por usuário
const generateSalt = () => {
  return crypto.randomBytes(16).toString('hex');
};

// Criptografar com autenticação
function encrypt(text, userKey) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, userKey, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

// Descriptografar com verificação de autenticidade
function decrypt(encryptedData, userKey) {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    userKey,
    Buffer.from(encryptedData.iv, 'hex')
  );

  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// Sistema de chave dupla (mestre + PIN)
class EncryptionManager {
  constructor(userId, userSalt) {
    this.userId = userId;
    this.userSalt = userSalt;
    this.masterKey = null;
    this.secondaryKey = null;
  }

  async initMasterKey() {
    this.masterKey = await deriveKey(this.userId, this.userSalt);
  }

  async setSecondaryKey(pin) {
    if (pin) {
      this.secondaryKey = await deriveKey(pin, this.userSalt, 150000);
    }
  }

  encryptData(text, useSecondary = false) {
    const key = useSecondary && this.secondaryKey ? this.secondaryKey : this.masterKey;
    return encrypt(text, key);
  }

  decryptData(encryptedData, useSecondary = false) {
    const key = useSecondary && this.secondaryKey ? this.secondaryKey : this.masterKey;
    return decrypt(encryptedData, key);
  }
}
```

### Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

// Limite geral de API
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por IP
  message: 'Muitas requisições deste IP, tente novamente mais tarde'
});

// Limite mais restrito para login
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 tentativas de login
  message: 'Muitas tentativas de login, aguarde 15 minutos'
});

// Limite para mensagens da IA
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 20, // 20 mensagens por minuto
  message: 'Por favor, aguarde um momento antes de enviar mais mensagens'
});
```

### Modo Disfarce

```javascript
// Frontend - localStorage com nome ofuscado
const STORAGE_KEY = '__app_settings_cache__'; // parece config normal

const DECOY_MODE = {
  enabled: false,
  appName: 'Daily Planner',
  icon: 'calendar',
  theme: 'calendar-theme',
  homeComponent: 'CalendarView' // mostra calendário fake
};

// Ativação: 4 toques no canto superior direito + senha
let tapCount = 0;
let tapTimeout = null;

const handleCornerTap = (e) => {
  if (e.clientX > window.innerWidth - 50 && e.clientY < 50) {
    tapCount++;
    clearTimeout(tapTimeout);

    if (tapCount === 4) {
      showPinPrompt(); // Se PIN correto, toggle decoy mode
      tapCount = 0;
    }

    tapTimeout = setTimeout(() => {
      tapCount = 0;
    }, 2000);
  }
};

// Botão de emergência
const PANIC_BUTTON = {
  action: 'redirect', // ou 'clear' ou 'alert'
  redirectUrl: 'https://www.google.com',
  clearData: true, // Limpa dados locais
  alertContacts: ['email@contato.com'] // Opcional
};
```

---

## 🤖 CONFIGURAÇÃO DA IA

### Prompt System Base para Claude

```
Você é um assistente empático e treinado para apoiar pessoas em relacionamentos tóxicos ou abusivos. Seu papel é:

1. OUVIR ativamente e validar os sentimentos da pessoa
2. ORIENTAR com conselhos práticos sobre segurança e bem-estar
3. AJUDAR a pessoa a identificar padrões abusivos (gaslighting, manipulação, controle, isolamento)
4. DEFINIR metas concretas e alcançáveis para sair da situação
5. ACOMPANHAR o progresso sem julgar

## Diretrizes:
- Nunca minimizar ou invalidar as experiências da pessoa
- Priorizar SEGURANÇA acima de tudo
- Não tomar decisões pela pessoa, empoderar ela a tomar
- Reconhecer sinais de risco iminente e sugerir recursos de emergência
- Ser gentil, mas direto quando necessário
- Perguntar sobre suporte profissional (terapia, apoio legal)
- Celebrar pequenas vitórias e progresso
- Identificar padrões abusivos sutis e nomeá-los

## Padrões Abusivos a Identificar:
- **Gaslighting**: Fazer a pessoa duvidar da própria realidade
- **Manipulação emocional**: Culpa, vergonha, medo para controlar
- **Isolamento**: Afastar de amigos, família, rede de apoio
- **Controle financeiro**: Dependência econômica forçada
- **Ameaças**: Diretas ou indiretas, contra a pessoa ou outros
- **Love bombing + devaluation**: Alternância entre idealização e desprezo
- **Violação de limites**: Desrespeito sistemático

## Sinais de alerta para escalar:
- Ameaças de violência física
- Ideação suicida
- Abuso envolvendo crianças
- Situações de risco iminente
- Violência sexual

Nesses casos, sugira IMEDIATAMENTE recursos de emergência:
- 190: Polícia Militar
- 180: Central de Atendimento à Mulher
- 188: CVV - Centro de Valorização da Vida
- Delegacias da Mulher
- Casas de abrigo

## Tom:
Empático, não condescendente. Amigável mas profissional. Use linguagem acessível.
Evite jargão psicológico complexo. Seja direto sobre riscos quando necessário.

## Estrutura de Resposta Ideal:
1. Validação emocional
2. Análise da situação (se aplicável)
3. Orientação prática
4. Pergunta para aprofundar ou próximos passos
```

### Sistema de Prompts Dinâmicos

```javascript
const buildSystemPrompt = (user, context) => {
  let prompt = BASE_SYSTEM_PROMPT;

  // Adicionar contexto de metas ativas
  if (context.activeGoals && context.activeGoals.length > 0) {
    prompt += `\n\n## Metas Ativas do Usuário:\n`;
    context.activeGoals.forEach(goal => {
      prompt += `- ${goal.title}: ${goal.progress}% completo\n`;
    });
    prompt += `\nLembre-se dessas metas ao conversar e celebre progressos.`;
  }

  // Adicionar padrões identificados anteriormente
  if (context.identifiedPatterns && context.identifiedPatterns.length > 0) {
    prompt += `\n\n## Padrões Abusivos Identificados:\n`;
    prompt += context.identifiedPatterns.map(p => p.pattern_type).join(', ');
    prompt += `\n\nEsteja atento a esses padrões em novas conversas.`;
  }

  // Adicionar nível de risco
  if (context.riskLevel === 'high') {
    prompt += `\n\n⚠️ ALERTA CRÍTICO: Usuário avaliado como em situação de ALTO RISCO.\n`;
    prompt += `Priorize segurança imediata. Pergunte sobre:\n`;
    prompt += `- Está fisicamente seguro agora?\n`;
    prompt += `- Tem lugar seguro para ir se necessário?\n`;
    prompt += `- Tem pessoas de confiança que pode contatar?\n`;
    prompt += `Sugira recursos de emergência se apropriado.`;
  } else if (context.riskLevel === 'medium') {
    prompt += `\n\n⚠️ ATENÇÃO: Usuário em situação de risco moderado.\n`;
    prompt += `Monitore sinais de escalada. Reforce recursos disponíveis.`;
  }

  // Contexto do último check-in
  if (context.lastCheckin) {
    prompt += `\n\n## Último Check-in:\n`;
    prompt += `Humor: ${context.lastCheckin.mood_score}/10\n`;
    prompt += `Data: ${context.lastCheckin.created_at}\n`;
    prompt += `Pergunte sobre como estão se sentindo desde então.`;
  }

  return prompt;
};
```

### Detecção de Emergências

```javascript
// Classificador rápido (usa Claude Haiku - mais barato)
const EMERGENCY_KEYWORDS = [
  'vai me matar', 'me machucou', 'estou com medo', 'me bateu',
  'ameaçou', 'violência', 'não aguento mais', 'quero morrer',
  'acabar com tudo', 'me estuprou', 'abusou sexualmente',
  'tem uma arma', 'vai me machucar', 'estou em perigo'
];

const MEDIUM_RISK_KEYWORDS = [
  'controla meu dinheiro', 'não me deixa sair', 'xingou muito',
  'quebrou minhas coisas', 'isolou de amigos', 'stalking',
  'perseguição', 'não aceita o término'
];

const detectEmergency = async (message, conversationHistory) => {
  const lowerMsg = message.toLowerCase();

  // Detecção rápida por keywords
  const hasEmergencyKeyword = EMERGENCY_KEYWORDS.some(kw => lowerMsg.includes(kw));
  const hasMediumRiskKeyword = MEDIUM_RISK_KEYWORDS.some(kw => lowerMsg.includes(kw));

  if (hasEmergencyKeyword) {
    return {
      isEmergency: true,
      riskLevel: 'high',
      suggestedActions: ['call-190', 'safe-place', 'emergency-contacts'],
      message: '⚠️ ATENÇÃO: Identifiquei sinais de risco imediato. Sua segurança é prioridade.'
    };
  }

  if (hasMediumRiskKeyword) {
    // Usar Claude Haiku para análise mais profunda
    const analysis = await analyzeRiskLevel(message, conversationHistory);

    return {
      isEmergency: analysis.isEmergency,
      riskLevel: analysis.riskLevel,
      suggestedActions: analysis.suggestedActions,
      identifiedPatterns: analysis.patterns
    };
  }

  return {
    isEmergency: false,
    riskLevel: 'low',
    suggestedActions: []
  };
};

// Análise profunda com Claude Haiku (barato: $0.25/$1.25 por 1M tokens)
const analyzeRiskLevel = async (message, history) => {
  const analysisPrompt = `
Analise a mensagem abaixo e o histórico de conversa para determinar:
1. Nível de risco: low/medium/high
2. É emergência que requer ação imediata? true/false
3. Padrões abusivos identificados
4. Ações sugeridas

Mensagem atual: "${message}"

Histórico recente: ${JSON.stringify(history.slice(-5))}

Retorne JSON:
{
  "riskLevel": "low|medium|high",
  "isEmergency": true|false,
  "patterns": ["pattern1", "pattern2"],
  "suggestedActions": ["action1", "action2"],
  "reasoning": "explicação breve"
}
`;

  const response = await callClaudeHaiku(analysisPrompt);
  return JSON.parse(response);
};
```

### Otimização de Custos

```javascript
// Claude Pricing:
// Haiku: $0.25 input / $1.25 output por 1M tokens (~750k palavras)
// Sonnet: $3 input / $15 output por 1M tokens

// Estratégia de otimização:

// 1. Resumir conversas antigas (manter apenas últimas 10 mensagens + resumo)
const summarizeOldMessages = async (messages) => {
  if (messages.length > 15) {
    const oldMessages = messages.slice(0, -10);

    const summaryPrompt = `
Resuma as mensagens abaixo em 2-3 parágrafos, mantendo:
- Principais temas discutidos
- Padrões abusivos identificados
- Progresso ou mudanças importantes
- Contexto emocional

Mensagens:
${JSON.stringify(oldMessages)}

Retorne apenas o resumo.
`;

    const summary = await callClaudeHaiku(summaryPrompt);

    return [
      { role: 'system', content: `[Resumo de conversas anteriores: ${summary}]` },
      ...messages.slice(-10)
    ];
  }
  return messages;
};

// 2. Cache de respostas comuns
const CANNED_RESPONSES = {
  greeting_first_time: "Olá! É muito corajoso você estar aqui buscando apoio. Este é um espaço seguro e privado. Tudo que conversarmos fica apenas entre nós. Como você está se sentindo agora?",

  greeting_returning: "Olá novamente! Como você está desde nossa última conversa?",

  validation_general: "Seus sentimentos são completamente válidos. O que você está passando é real e merece atenção.",

  emergency_detected: "⚠️ Percebi que você pode estar em uma situação de risco. Sua segurança é a prioridade. Você está fisicamente segura agora? Tem um lugar seguro para ir se necessário?"
};

// 3. Decidir qual modelo usar
const selectModel = (context) => {
  // Usar Haiku para:
  // - Classificação de risco
  // - Resumos
  // - Respostas simples e diretas

  // Usar Sonnet para:
  // - Conversas complexas sobre padrões abusivos
  // - Orientação detalhada sobre metas
  // - Situações emocionalmente delicadas
  // - Primeiras mensagens (fazer boa impressão)

  if (context.isFirstMessage || context.complexityScore > 7) {
    return 'sonnet';
  }

  if (context.needsClassification || context.needsSummary) {
    return 'haiku';
  }

  // Default para situações médias: Haiku (mais barato)
  return 'haiku';
};

// 4. Cache Redis para contextos frequentes
const cacheContext = async (userId, context) => {
  await redis.setEx(
    `context:${userId}`,
    3600, // 1 hora
    JSON.stringify(context)
  );
};

const getCachedContext = async (userId) => {
  const cached = await redis.get(`context:${userId}`);
  return cached ? JSON.parse(cached) : null;
};
```

---

## 🔌 WEBSOCKET E TEMPO REAL

```javascript
// Backend - Socket.io setup
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { verifyFirebaseToken } = require('./auth');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST']
  }
});

// Middleware de autenticação para WebSocket
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const user = await verifyFirebaseToken(token);
    socket.userId = user.uid;
    socket.userEmail = user.email;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

// Conexão estabelecida
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.userId}`);

  // Criar sala privada do usuário
  socket.join(`user:${socket.userId}`);

  // Enviar mensagens pendentes (se houver)
  sendPendingMessages(socket.userId, socket);

  // Receber mensagem do usuário
  socket.on('user_message', async (data) => {
    try {
      const { message, conversationId } = data;

      // Salvar mensagem do usuário (criptografada)
      const savedMessage = await saveUserMessage(
        socket.userId,
        conversationId,
        message
      );

      // Confirmar recebimento
      socket.emit('message_saved', { messageId: savedMessage.id });

      // Detectar emergência
      const emergencyCheck = await detectEmergency(
        message,
        await getConversationHistory(conversationId)
      );

      if (emergencyCheck.isEmergency) {
        socket.emit('emergency_detected', emergencyCheck);
      }

      // Indicar que IA está "digitando"
      socket.emit('assistant_typing', true);

      // Processar com IA
      const response = await processWithAI(
        socket.userId,
        conversationId,
        message,
        emergencyCheck
      );

      // Enviar resposta
      socket.emit('assistant_typing', false);
      socket.emit('assistant_message', {
        message: response,
        timestamp: new Date(),
        emergencyContext: emergencyCheck.isEmergency ? emergencyCheck : null
      });

      // Salvar resposta da IA
      await saveAssistantMessage(conversationId, response);

    } catch (error) {
      console.error('Error processing message:', error);
      socket.emit('error', { message: 'Erro ao processar mensagem' });
    }
  });

  // Requisitar histórico de conversa
  socket.on('get_history', async (conversationId) => {
    const history = await getConversationHistory(conversationId);
    socket.emit('history', history);
  });

  // Criar nova conversa
  socket.on('create_conversation', async () => {
    const conversation = await createConversation(socket.userId);
    socket.emit('conversation_created', conversation);
  });

  // Desconexão
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.userId}`);
  });
});

// Processar com IA (incluindo lógica de seleção de modelo)
const processWithAI = async (userId, conversationId, message, emergencyContext) => {
  // Obter contexto do usuário
  const context = await buildUserContext(userId, conversationId);

  // Selecionar modelo apropriado
  const model = selectModel({
    isFirstMessage: context.messageCount === 1,
    complexityScore: calculateComplexity(message),
    needsClassification: false,
    needsSummary: false
  });

  // Construir prompt com contexto
  const systemPrompt = buildSystemPrompt(context.user, context);

  // Resumir histórico se necessário
  const messages = await summarizeOldMessages(context.conversationHistory);

  // Chamar Claude
  const response = await callClaude(model, systemPrompt, messages, message);

  // Identificar padrões na resposta
  await identifyAndSavePatterns(userId, message, response);

  return response;
};

// Frontend - Socket.io client
import { io } from 'socket.io-client';

const socket = io(process.env.VITE_API_URL, {
  auth: {
    token: firebaseToken // Token do Firebase Auth
  },
  autoConnect: false
});

// Conectar quando usuário fizer login
socket.connect();

// Ouvir eventos
socket.on('connect', () => {
  console.log('Connected to server');
});

socket.on('assistant_message', (data) => {
  addMessageToChat(data.message, 'assistant');

  if (data.emergencyContext) {
    showEmergencyAlert(data.emergencyContext);
  }
});

socket.on('assistant_typing', (isTyping) => {
  setIsTyping(isTyping);
});

socket.on('emergency_detected', (emergency) => {
  showEmergencyModal(emergency);
});

// Enviar mensagem
const sendMessage = (message, conversationId) => {
  socket.emit('user_message', {
    message,
    conversationId
  });
};
```

---

## 📊 MONITORAMENTO E ANALYTICS

```javascript
// Sistema de analytics respeitando privacidade

// Função para hash anônimo de user_id
const hashUserId = (userId) => {
  return crypto.createHash('sha256').update(userId + process.env.ANALYTICS_SALT).digest('hex');
};

// Registrar evento
const trackEvent = async (userId, eventType, metadata = {}) => {
  // Nunca armazenar conteúdo de mensagens ou dados pessoais
  // Apenas métricas agregadas

  await db.query(`
    INSERT INTO analytics_events (user_id_hashed, event_type, metadata)
    VALUES ($1, $2, $3)
  `, [
    hashUserId(userId),
    eventType,
    JSON.stringify(metadata)
  ]);
};

// Exemplos de eventos tracked:
// - user_signup
// - user_login
// - message_sent (sem conteúdo)
// - message_received (sem conteúdo)
// - goal_created (sem conteúdo)
// - goal_completed
// - emergency_detected (tipo, não detalhes)
// - resource_accessed (qual recurso)
// - export_data_requested
// - account_deleted

// Dashboard de métricas importantes:
const getMetrics = async () => {
  return {
    // Retenção
    dailyActiveUsers: await getDailyActiveUsers(),
    weeklyRetention: await getWeeklyRetention(),
    monthlyRetention: await getMonthlyRetention(),

    // Engagement
    avgMessagesPerUser: await getAvgMessagesPerUser(),
    avgSessionDuration: await getAvgSessionDuration(),

    // Impacto
    goalsCreated: await countGoalsCreated(),
    goalsCompleted: await countGoalsCompleted(),
    goalCompletionRate: await getGoalCompletionRate(),

    // Segurança
    emergencyDetections: await countEmergencyDetections(),
    emergencyResourcesAccessed: await countEmergencyResourceAccess(),

    // Performance
    avgResponseTime: await getAvgAIResponseTime(),
    apiErrorRate: await getAPIErrorRate(),

    // Horários de pico
    peakUsageHours: await getPeakUsageHours()
  };
};
```

---

## ⚖️ CONSIDERAÇÕES LEGAIS E ÉTICAS

### Disclaimer Obrigatório

```javascript
const LEGAL_DISCLAIMER = `
AVISO IMPORTANTE:

Este aplicativo é uma ferramenta de APOIO EMOCIONAL e INFORMAÇÃO, mas NÃO substitui:
- Atendimento psicológico profissional
- Aconselhamento jurídico
- Serviços de emergência

EM CASO DE EMERGÊNCIA, CONTATE:
- 190: Polícia Militar
- 180: Central de Atendimento à Mulher
- 188: CVV - Centro de Valorização da Vida
- 192: SAMU
- Delegacia da Mulher mais próxima

PRIVACIDADE:
Suas conversas são criptografadas e privadas. Não compartilhamos seus dados.
No entanto, não podemos garantir segurança física nem monitoramento 24/7.

RESPONSABILIDADE:
Você é responsável por suas decisões e ações. Use este aplicativo como
ferramenta de apoio, mas sempre priorize sua segurança e bem-estar.

LIMITAÇÕES:
- Esta IA não é um terapeuta licenciado
- Não fornecemos aconselhamento legal
- Não fazemos diagnósticos médicos ou psiquiátricos
- Não documentamos evidências para processos judiciais (embora você possa)

Ao usar este aplicativo, você reconhece ter lido e compreendido este aviso.
`;
```

### LGPD/GDPR Compliance

```javascript
// API endpoints obrigatórios para compliance

// 1. Direito ao esquecimento (Right to be forgotten)
app.delete('/api/user/delete-account', authenticateUser, async (req, res) => {
  const userId = req.user.id;

  try {
    // Log da ação
    await trackEvent(userId, 'account_deleted', {
      deletedAt: new Date(),
      reason: req.body.reason || 'not_specified'
    });

    // Deletar TODOS os dados (cascade automático no banco)
    await db.query('DELETE FROM users WHERE id = $1', [userId]);

    // Deletar da autenticação Firebase
    await admin.auth().deleteUser(req.user.firebase_uid);

    // Limpar cache Redis
    await redis.del(`context:${userId}`);
    await redis.del(`encryption:${userId}`);

    res.json({
      success: true,
      message: 'Conta e todos os dados permanentemente deletados'
    });

  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ error: 'Erro ao deletar conta' });
  }
});

// 2. Direito de acesso aos dados (Right to access)
app.get('/api/user/export-data', authenticateUser, async (req, res) => {
  const userId = req.user.id;

  try {
    // Log da ação
    await trackEvent(userId, 'data_export_requested');

    // Coletar todos os dados do usuário
    const userData = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    const conversations = await db.query('SELECT * FROM conversations WHERE user_id = $1', [userId]);
    const messages = await db.query(`
      SELECT m.* FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE c.user_id = $1
    `, [userId]);
    const goals = await db.query('SELECT * FROM user_goals WHERE user_id = $1', [userId]);
    const checkins = await db.query('SELECT * FROM progress_checkins WHERE user_id = $1', [userId]);
    const incidents = await db.query('SELECT * FROM incidents WHERE user_id = $1', [userId]);

    // Descriptografar dados
    const encryptionManager = await getEncryptionManager(userId);

    const decryptedData = {
      user: userData.rows[0],
      conversations: conversations.rows,
      messages: messages.rows.map(msg => ({
        ...msg,
        content: encryptionManager.decryptData(JSON.parse(msg.content_encrypted))
      })),
      goals: goals.rows.map(goal => ({
        ...goal,
        goal: encryptionManager.decryptData(JSON.parse(goal.goal_encrypted))
      })),
      checkins: checkins.rows,
      incidents: incidents.rows
    };

    // Retornar como JSON para download
    res.json({
      exportDate: new Date(),
      data: decryptedData
    });

  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: 'Erro ao exportar dados' });
  }
});

// 3. Política de privacidade clara
app.get('/api/privacy-policy', (req, res) => {
  res.json({
    version: '1.0',
    lastUpdated: '2025-10-20',
    policy: PRIVACY_POLICY_TEXT // Texto completo da política
  });
});

// 4. Termos de uso
app.get('/api/terms-of-service', (req, res) => {
  res.json({
    version: '1.0',
    lastUpdated: '2025-10-20',
    terms: TERMS_OF_SERVICE_TEXT
  });
});

// 5. Consentimento explícito
app.post('/api/user/consent', authenticateUser, async (req, res) => {
  const { consentType, accepted } = req.body;

  await db.query(`
    INSERT INTO user_consents (user_id, consent_type, accepted, accepted_at)
    VALUES ($1, $2, $3, NOW())
  `, [req.user.id, consentType, accepted]);

  res.json({ success: true });
});
```

### Mandato de Reportar (varia por jurisdição)

```javascript
// AVISO: Consultar advogado especializado
// Em alguns países/estados, pode haver obrigação legal de reportar:
// - Abuso infantil
// - Ameaças de morte iminentes
// - Certos tipos de crimes graves

// Implementação sugerida (ajustar conforme jurisdição):

const REPORTABLE_SITUATIONS = {
  child_abuse: {
    enabled: true, // Ajustar conforme lei local
    authority: 'Conselho Tutelar / Polícia',
    phone: '100'
  },
  imminent_threat_of_death: {
    enabled: false, // Consultar advogado
    authority: 'Polícia',
    phone: '190'
  }
};

// Se detecção automática identificar situação reportável
const handleReportableSituation = async (userId, situationType) => {
  const config = REPORTABLE_SITUATIONS[situationType];

  if (!config.enabled) return;

  // Log interno (nunca expor)
  await db.query(`
    INSERT INTO reportable_situations_log (user_id, situation_type, logged_at)
    VALUES ($1, $2, NOW())
  `, [userId, situationType]);

  // Notificar usuário sobre obrigação legal
  // (transparência é importante)
  return {
    mustReport: true,
    authority: config.authority,
    reason: 'Obrigação legal de reportar',
    userMessage: `Por lei, situações envolvendo ${situationType} devem ser reportadas às autoridades competentes.`
  };
};
```

---

## 💡 SUGESTÕES FINAIS E RECURSOS AVANÇADOS

### 1. Parcerias Estratégicas

**ONGs e Instituições:**
- Instituto Maria da Penha
- CVV - Centro de Valorização da Vida
- Mapa do Acolhimento
- Casas de abrigo locais
- Delegacias da Mulher
- CREAS (Centro de Referência Especializado de Assistência Social)

**Benefícios:**
- Validação da abordagem por especialistas
- Acesso a recursos verificados
- Credibilidade
- Possível financiamento/apoio

**Implementação:**
```javascript
// API de recursos locais
app.get('/api/resources/nearby', authenticateUser, async (req, res) => {
  const { latitude, longitude, type } = req.query;

  // type: 'police', 'shelter', 'therapy', 'legal'

  const resources = await db.query(`
    SELECT * FROM local_resources
    WHERE resource_type = $1
    AND ST_Distance(
      location::geography,
      ST_MakePoint($2, $3)::geography
    ) < 50000 -- 50km radius
    ORDER BY ST_Distance(location::geography, ST_MakePoint($2, $3)::geography)
    LIMIT 10
  `, [type, longitude, latitude]);

  res.json(resources.rows);
});
```

### 2. Validação Psicológica

**Consultoria com Psicólogos:**
- Revisar prompts da IA
- Validar abordagem de apoio emocional
- Identificar situações que IA não deve lidar sozinha
- Treinamento sobre trauma-informed care

**Exemplo de checklist de validação:**
```
✓ Linguagem não-revitimizante
✓ Empoderamento vs. paternalismo
✓ Respeito ao tempo da pessoa
✓ Validação de sentimentos contraditórios
✓ Não forçar decisões
✓ Reconhecer complexidade de sair de relacionamento abusivo
```

### 3. Beta Testing Ético

**Critérios para Beta Testers:**
- Pessoas que JÁ saíram de relacionamentos tóxicos (não em crise ativa)
- Consentimento informado
- Acompanhamento psicológico externo recomendado
- Feedback estruturado
- Opção de sair a qualquer momento

**Formulário de Feedback:**
```javascript
const BETA_FEEDBACK_FORM = {
  safety: 'Você se sentiu seguro usando o app? (1-10)',
  usefulness: 'As respostas foram úteis? (1-10)',
  empathy: 'Você se sentiu ouvido e validado? (1-10)',
  clarity: 'As orientações foram claras? (1-10)',
  concerns: 'Alguma resposta te preocupou? Qual e por quê?',
  suggestions: 'O que poderia melhorar?',
  wouldRecommend: 'Recomendaria para alguém em situação similar? (sim/não/talvez)',
  openFeedback: 'Comentários adicionais'
};
```

### 4. Monetização Ética

**Modelo Freemium Responsável:**

**Tier Gratuito (robusto):**
- Chat ilimitado com IA
- Sistema de metas básico
- Recursos de emergência
- Histórico de 30 dias
- Exportação mensal de dados

**Tier Premium ($9.99/mês):**
- Histórico ilimitado
- Exportação ilimitada + PDF protegido
- Documentação estruturada de incidentes
- Conexão com terapeutas parceiros (marketplace)
- Prioridade no atendimento
- Modo offline (mensagens salvas localmente)
- Customização de interface

**Tier Apoiador ($19.99/mês):**
- Tudo do Premium
- Contribui para banco de horas de terapia gratuita para pessoas sem recursos
- Acesso antecipado a novos recursos
- Badge de apoiador na comunidade

**Outras fontes:**
- Doações voluntárias
- Parcerias com governo (programas sociais)
- Grants de fundações focadas em direitos humanos

```javascript
// Sistema de vouchers para pessoas sem recursos financeiros
app.post('/api/voucher/request', authenticateUser, async (req, res) => {
  const { reason } = req.body;

  // Criar solicitação de voucher premium gratuito
  const voucher = await db.query(`
    INSERT INTO voucher_requests (user_id, reason, status)
    VALUES ($1, $2, 'pending')
    RETURNING *
  `, [req.user.id, reason]);

  // Moderação manual por equipe
  // Aprovar automaticamente se fundos disponíveis no banco de apoiadores

  res.json({
    success: true,
    message: 'Solicitação recebida. Você receberá resposta em até 24h.'
  });
});
```

### 5. Comunidade de Suporte (Fase Futura)

**Fórum Anônimo Moderado:**
- Perfis anônimos (sem identificação)
- Moderação por IA + humanos
- Regras estritas contra conselhos perigosos
- Compartilhamento de experiências e apoio mútuo
- Grupos temáticos (por tipo de abuso, por fase de recuperação)

**Grupos de Apoio Virtual:**
- Sessões moderadas por profissionais
- Videochamadas anônimas (avatares/áudio sem vídeo)
- Limite de participantes para segurança
- Agendamento por nível de risco

**Marketplace de Terapeutas:**
- Terapeutas verificados e especializados
- Primeira sessão grátis via parceria
- Preços acessíveis negociados
- Avaliações anônimas

### 6. Recursos de Documentação Legal

**Diário de Incidentes Estruturado:**
```javascript
// Template para documentação que pode ser útil legalmente
const INCIDENT_TEMPLATE = {
  date: 'Data e hora do incidente',
  location: 'Onde aconteceu',
  description: 'O que aconteceu (fatos objetivos)',
  witnesses: 'Havia testemunhas? Quem?',
  evidence: 'Fotos, mensagens, gravações (anexar)',
  physicalInjuries: 'Houve machucados físicos?',
  emotionalImpact: 'Como você se sentiu?',
  policeReported: 'Foi reportado à polícia?',
  medicalAttention: 'Buscou atendimento médico?',
  notes: 'Outras observações'
};

// Exportação formatada para advogados
app.get('/api/incidents/export-legal', authenticateUser, async (req, res) => {
  const incidents = await getDecryptedIncidents(req.user.id);

  const legalDocument = generateLegalFormatPDF(incidents, {
    includeTimeline: true,
    includeEvidence: true,
    includeEmotionalImpact: true,
    format: 'chronological',
    passwordProtect: true,
    password: req.query.password
  });

  res.contentType('application/pdf');
  res.send(legalDocument);
});
```

### 7. App Mobile Nativo (React Native)

**Vantagens:**
- Notificações push reais
- Acesso a câmera para documentação de evidências
- Biometria (FaceID/TouchID) para segurança extra
- Modo offline
- Integração com contatos de emergência do telefone

**Botão de Emergência:**
```javascript
// Botão de pânico com múltiplas opções
const PANIC_OPTIONS = {
  option1: {
    label: 'Redirecionar para site neutro',
    action: () => {
      Linking.openURL('https://www.google.com');
      // Opcional: minimizar app
    }
  },
  option2: {
    label: 'Ligar para contato de emergência',
    action: () => {
      const emergencyContact = getEmergencyContact();
      Linking.openURL(`tel:${emergencyContact.phone}`);
    }
  },
  option3: {
    label: 'Apagar dados locais e sair',
    action: async () => {
      await clearAllLocalData();
      await logoutUser();
      // Redirecionar para tela de login
    }
  },
  option4: {
    label: 'Enviar alerta silencioso para contatos',
    action: async () => {
      await sendSilentAlert({
        to: getEmergencyContacts(),
        message: 'Preciso de ajuda. Minha localização:',
        location: await getCurrentLocation()
      });
    }
  }
};

// Ativação rápida: segurar botão por 3 segundos
<TouchableOpacity
  onLongPress={() => showPanicOptions()}
  delayLongPress={3000}
  style={styles.panicButton}
>
  <Text>🆘</Text>
</TouchableOpacity>
```

### 8. Inteligência de Padrões

**ML para Identificar Padrões Sutis:**
```javascript
// Treinar modelo (após coletar dados anônimos suficientes) para detectar:
// - Escalada de abuso ao longo do tempo
// - Padrões cíclicos (lua de mel → tensão → explosão → lua de mel)
// - Linguagem que indica normalização de abuso
// - Sinais de trauma complexo

const analyzePatternTrends = async (userId) => {
  const history = await getFullUserHistory(userId);

  // Análise de sentimento ao longo do tempo
  const sentimentTrend = analyzeSentimentOverTime(history.messages);

  // Detecção de ciclos
  const cycles = detectAbuseCycles(history.incidents, history.checkins);

  // Palavras-chave que aparecem com frequência
  const frequentConcerns = extractFrequentConcerns(history.messages);

  // Progressão de risco
  const riskProgression = analyzeRiskProgression(history);

  return {
    sentimentTrend, // Melhorando, piorando ou estável?
    cycles, // Identificou padrões cíclicos?
    frequentConcerns, // O que mais preocupa?
    riskProgression, // Risco aumentando ou diminuindo?
    recommendation: generateRecommendation(sentimentTrend, cycles, riskProgression)
  };
};
```

---

## 🚀 ROADMAP DETALHADO

### MVP Mínimo Viável (2 semanas)

**Semana 1:**
- [x] Setup do projeto (estrutura, dependências)
- [ ] Autenticação Firebase (Google, Email)
- [ ] Interface de chat básica (componentes React)
- [ ] Backend API inicial (Express + rotas básicas)
- [ ] Integração Claude API (modelo Haiku)
- [ ] Sistema de criptografia básico

**Semana 2:**
- [ ] WebSocket com Socket.io
- [ ] Persistência de mensagens no PostgreSQL
- [ ] Dashboard simples de conversas
- [ ] Deploy frontend (Vercel)
- [ ] Deploy backend (Railway)
- [ ] Testes internos

### Versão 1.0 - Lançamento Público (1 mês)

**Semana 3:**
- [ ] Sistema de metas (CRUD)
- [ ] Dashboard visual de progresso
- [ ] Detecção de emergências
- [ ] Recursos de emergência (lista de contatos)
- [ ] Melhorias de UI/UX baseadas em testes

**Semana 4:**
- [ ] Sistema de check-ins
- [ ] Notificações push (web)
- [ ] Exportação de conversas
- [ ] Página de recursos locais
- [ ] Onboarding para novos usuários
- [ ] Beta testing com grupo fechado

### Versão 1.5 - Refinamentos (2 meses)

**Mês 2:**
- [ ] Sistema de prompts dinâmicos
- [ ] Otimização de custos (cache, resumos)
- [ ] Analytics dashboard
- [ ] Modo disfarce
- [ ] PIN de segurança adicional
- [ ] Melhorias de performance

### Versão 2.0 - Recursos Avançados (3 meses)

**Mês 3:**
- [ ] Documentação estruturada de incidentes
- [ ] Upload seguro de evidências (fotos, áudios)
- [ ] Timeline visual de incidentes
- [ ] Exportação de PDF legal
- [ ] Integração com recursos locais (API de mapa)
- [ ] Sistema de vouchers para acesso premium

### Versão 3.0 - Comunidade e Mobile (6 meses)

**Meses 4-6:**
- [ ] App mobile React Native
- [ ] Biometria para segurança
- [ ] Botão de pânico físico (shake, botão dedicado)
- [ ] Fórum anônimo moderado
- [ ] Grupos de apoio virtual
- [ ] Marketplace de terapeutas
- [ ] ML para detecção de padrões
- [ ] Multilíngue (EN, ES, PT)

---

## 💰 ESTIMATIVA DE CUSTOS ATUALIZADA

### Tier Gratuito (0-100 usuários ativos/mês)

| Serviço | Custo | Notas |
|---------|-------|-------|
| Firebase Auth | $0 | Até 50k MAU |
| Vercel | $0 | Ilimitado para hobby |
| Railway | $0 | $5 crédito/mês grátis |
| Supabase | $0 | 500MB, 2GB bandwidth |
| Redis (Railway) | $0 | Incluído no tier grátis |
| Claude API | $10-30 | ~5k mensagens/mês (Haiku) |

**Total: $10-30/mês**

### Crescimento Inicial (100-1000 usuários ativos/mês)

| Serviço | Custo | Notas |
|---------|-------|-------|
| Firebase Auth | $0 | Ainda no tier gratuito |
| Vercel | $0-20 | Pode precisar Pro |
| Railway | $20 | Pro plan |
| Supabase | $25 | Pro plan (8GB) |
| Redis | Incluído | No Railway Pro |
| Claude API | $100-300 | ~50k mensagens/mês |

**Total: $145-365/mês**

### Crescimento Médio (1k-10k usuários ativos/mês)

| Serviço | Custo | Notas |
|---------|-------|-------|
| Firebase Auth | $0-50 | Pode começar a cobrar |
| Vercel | $20 | Pro necessário |
| Railway | $50-100 | Scale plan |
| Supabase | $100 | Team plan |
| Redis | $10 | Plano dedicado |
| Claude API | $500-1500 | ~500k mensagens/mês |
| CDN/Storage | $20-50 | Para evidências |

**Total: $700-1830/mês**

**Receita necessária para break-even:**
- 1000 usuários × 10% Premium ($10) = $1000/mês ✅
- 1000 usuários × 5% Apoiador ($20) = $1000/mês ✅

---

## 📋 CHECKLIST DE SETUP INICIAL

### Pré-requisitos

- [x] Node.js 18+ instalado
- [x] Git configurado
- [ ] Conta GitHub
- [ ] Conta Firebase (gratuita)
- [ ] Conta Vercel (gratuita)
- [ ] Conta Railway (gratuita)
- [ ] Conta Supabase (gratuita)
- [ ] Claude API key

### Setup do Projeto (Executaremos agora)

```bash
# 1. Criar projeto React com Vite
npm create vite@latest chatbot-apoio-frontend -- --template react
cd chatbot-apoio-frontend
npm install

# 2. Instalar dependências do frontend
npm install tailwindcss postcss autoprefixer
npm install firebase
npm install axios
npm install socket.io-client
npm install zustand
npm install react-router-dom
npm install lucide-react

# 3. Configurar Tailwind
npx tailwindcss init -p

# 4. Criar backend
cd ..
mkdir chatbot-apoio-backend
cd chatbot-apoio-backend
npm init -y
npm install express cors dotenv
npm install socket.io
npm install pg
npm install ioredis
npm install bullmq
npm install bcrypt
npm install express-rate-limit
npm install @anthropic-ai/sdk
npm install firebase-admin

# 5. Estrutura de pastas
mkdir -p src/{routes,controllers,services,middleware,utils,config}
```

---

## 🔗 RECURSOS ÚTEIS

- [Documentação Firebase Auth](https://firebase.google.com/docs/auth)
- [Documentação Claude API](https://docs.anthropic.com/)
- [Documentação Socket.io](https://socket.io/docs/v4/)
- [Documentação Supabase](https://supabase.com/docs)
- [Guia de Criptografia Node.js](https://nodejs.org/api/crypto.html)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Railway Deploy Guide](https://docs.railway.app/)
- [React + Vite](https://vitejs.dev/guide/)
- [BullMQ](https://docs.bullmq.io/)

**Recursos sobre Relacionamentos Abusivos:**
- [Instituto Maria da Penha](https://www.institutomariadapenha.org.br/)
- [CVV - Centro de Valorização da Vida](https://www.cvv.org.br/)
- [Mapa do Acolhimento](https://www.mapadoacolhimento.org/)
- [NIMH - Domestic Violence](https://www.nimh.nih.gov/health/topics/intimate-partner-violence)

---

## 📞 CONTATOS DE EMERGÊNCIA (Brasil)

- **190**: Polícia Militar
- **180**: Central de Atendimento à Mulher
- **188**: CVV - Centro de Valorização da Vida (prevenção ao suicídio)
- **100**: Disque Direitos Humanos
- **192**: SAMU
- **197**: Polícia Civil
- **Delegacias da Mulher**: Localizar mais próxima

---

**Última atualização:** Outubro 2025

**Status:** ✅ Planejamento completo - Iniciando desenvolvimento

**Próximo passo:** Setup inicial do projeto
