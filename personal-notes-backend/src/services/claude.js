const Anthropic = require('@anthropic-ai/sdk');

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

// Base system prompt
const BASE_SYSTEM_PROMPT = `Você é um assistente empático e treinado para apoiar pessoas em relacionamentos tóxicos ou abusivos. Seu papel é:

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
4. Pergunta para aprofundar ou próximos passos`;

/**
 * Build dynamic system prompt with user context
 * @param {Object} context - User context (goals, patterns, risk level, etc)
 * @returns {string} Complete system prompt
 */
function buildSystemPrompt(context = {}) {
  let prompt = BASE_SYSTEM_PROMPT;

  // Add active goals
  if (context.activeGoals && context.activeGoals.length > 0) {
    prompt += `\n\n## Metas Ativas do Usuário:\n`;
    context.activeGoals.forEach(goal => {
      prompt += `- ${goal.title}: ${goal.progress}% completo\n`;
    });
    prompt += `\nLembre-se dessas metas ao conversar e celebre progressos.`;
  }

  // Add identified patterns
  if (context.identifiedPatterns && context.identifiedPatterns.length > 0) {
    prompt += `\n\n## Padrões Abusivos Identificados:\n`;
    prompt += context.identifiedPatterns.map(p => p.pattern_type).join(', ');
    prompt += `\n\nEsteja atento a esses padrões em novas conversas.`;
  }

  // Add risk level
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

  // Add last check-in context
  if (context.lastCheckin) {
    prompt += `\n\n## Último Check-in:\n`;
    prompt += `Humor: ${context.lastCheckin.mood_score}/10\n`;
    prompt += `Data: ${context.lastCheckin.created_at}\n`;
    prompt += `Pergunte sobre como estão se sentindo desde então.`;
  }

  return prompt;
}

/**
 * Call Claude Haiku model (cheaper, for classification/simple responses)
 * @param {string} prompt - User prompt
 * @param {string} systemPrompt - System prompt
 * @returns {Promise<string>} Claude response
 */
async function callClaudeHaiku(prompt, systemPrompt = BASE_SYSTEM_PROMPT) {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    return message.content[0].text;
  } catch (error) {
    console.error('Error calling Claude Haiku:', error);
    throw new Error('Erro ao processar resposta da IA');
  }
}

/**
 * Call Claude Sonnet model (better quality, for complex conversations)
 * @param {string} prompt - User prompt
 * @param {Array} conversationHistory - Previous messages
 * @param {string} systemPrompt - System prompt
 * @returns {Promise<string>} Claude response
 */
async function callClaudeSonnet(prompt, conversationHistory = [], systemPrompt = BASE_SYSTEM_PROMPT) {
  try {
    // Build messages array
    const messages = [
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: prompt
      }
    ];

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      system: systemPrompt,
      messages: messages
    });

    return message.content[0].text;
  } catch (error) {
    console.error('Error calling Claude Sonnet:', error);
    throw new Error('Erro ao processar resposta da IA');
  }
}

/**
 * Decide which model to use based on context
 * @param {Object} context - Context information
 * @returns {string} Model name ('haiku' or 'sonnet')
 */
function selectModel(context = {}) {
  // Use Sonnet for:
  // - First message (make good impression)
  // - High complexity
  // - High risk situations
  if (context.isFirstMessage || context.complexityScore > 7 || context.riskLevel === 'high') {
    return 'sonnet';
  }

  // Use Haiku for:
  // - Classification
  // - Summaries
  // - Simple responses
  if (context.needsClassification || context.needsSummary) {
    return 'haiku';
  }

  // Default: Haiku (cheaper)
  return 'haiku';
}

/**
 * Process message with appropriate Claude model
 * @param {string} userMessage - User's message
 * @param {Object} context - User context
 * @param {Array} conversationHistory - Previous messages
 * @returns {Promise<string>} AI response
 */
async function processMessage(userMessage, context = {}, conversationHistory = []) {
  try {
    // Build system prompt with context
    const systemPrompt = buildSystemPrompt(context);

    // Select appropriate model
    const model = selectModel(context);

    let response;

    if (model === 'sonnet') {
      response = await callClaudeSonnet(userMessage, conversationHistory, systemPrompt);
    } else {
      // For Haiku, we'll use just the current message (no full history)
      response = await callClaudeHaiku(userMessage, systemPrompt);
    }

    return response;

  } catch (error) {
    console.error('Error processing message:', error);
    throw error;
  }
}

/**
 * Analyze risk level using Claude Haiku
 * @param {string} message - User message
 * @param {Array} conversationHistory - Recent conversation history
 * @returns {Promise<Object>} Risk analysis
 */
async function analyzeRiskLevel(message, conversationHistory = []) {
  try {
    const analysisPrompt = `
Analise a mensagem abaixo e o histórico de conversa para determinar:
1. Nível de risco: low/medium/high
2. É emergência que requer ação imediata? true/false
3. Padrões abusivos identificados
4. Ações sugeridas

Mensagem atual: "${message}"

Histórico recente: ${JSON.stringify(conversationHistory.slice(-5))}

Retorne JSON válido:
{
  "riskLevel": "low|medium|high",
  "isEmergency": true|false,
  "patterns": ["pattern1", "pattern2"],
  "suggestedActions": ["action1", "action2"],
  "reasoning": "explicação breve"
}`;

    const response = await callClaudeHaiku(analysisPrompt);

    // Parse JSON response
    try {
      return JSON.parse(response);
    } catch (parseError) {
      console.error('Error parsing risk analysis:', parseError);
      // Return safe default
      return {
        riskLevel: 'low',
        isEmergency: false,
        patterns: [],
        suggestedActions: [],
        reasoning: 'Unable to parse analysis'
      };
    }

  } catch (error) {
    console.error('Error analyzing risk:', error);
    // Return safe default
    return {
      riskLevel: 'low',
      isEmergency: false,
      patterns: [],
      suggestedActions: [],
      reasoning: 'Analysis failed'
    };
  }
}

/**
 * Summarize old messages to reduce token usage
 * @param {Array} messages - Messages to summarize
 * @returns {Promise<string>} Summary
 */
async function summarizeMessages(messages) {
  try {
    const summaryPrompt = `
Resuma as mensagens abaixo em 2-3 parágrafos, mantendo:
- Principais temas discutidos
- Padrões abusivos identificados
- Progresso ou mudanças importantes
- Contexto emocional

Mensagens:
${JSON.stringify(messages)}

Retorne apenas o resumo em português.`;

    const summary = await callClaudeHaiku(summaryPrompt);
    return summary;

  } catch (error) {
    console.error('Error summarizing messages:', error);
    return 'Resumo não disponível';
  }
}

module.exports = {
  buildSystemPrompt,
  callClaudeHaiku,
  callClaudeSonnet,
  selectModel,
  processMessage,
  analyzeRiskLevel,
  summarizeMessages
};
