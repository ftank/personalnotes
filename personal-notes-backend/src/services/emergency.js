const { analyzeRiskLevel } = require('./claude');

// Emergency keywords for quick detection
const EMERGENCY_KEYWORDS = [
  'vai me matar', 'me machucou', 'estou com medo', 'me bateu',
  'ameaçou', 'violência', 'não aguento mais', 'quero morrer',
  'acabar com tudo', 'me estuprou', 'abusou sexualmente',
  'tem uma arma', 'vai me machucar', 'estou em perigo'
];

const MEDIUM_RISK_KEYWORDS = [
  'controla meu dinheiro', 'não me deixa sair', 'xingou muito',
  'quebrou minhas coisas', 'isolou de amigos', 'stalking',
  'perseguição', 'não aceita o término', 'me ameaça'
];

/**
 * Detect emergency situation
 * @param {string} message - User message
 * @param {Array} conversationHistory - Recent conversation
 * @returns {Promise<Object>} Emergency detection result
 */
async function detectEmergency(message, conversationHistory = []) {
  try {
    const lowerMsg = message.toLowerCase();

    // Quick keyword detection
    const hasEmergencyKeyword = EMERGENCY_KEYWORDS.some(kw => lowerMsg.includes(kw));
    const hasMediumRiskKeyword = MEDIUM_RISK_KEYWORDS.some(kw => lowerMsg.includes(kw));

    if (hasEmergencyKeyword) {
      return {
        isEmergency: true,
        riskLevel: 'high',
        suggestedActions: ['call-190', 'safe-place', 'emergency-contacts'],
        message: '⚠️ ATENÇÃO: Identifiquei sinais de risco imediato. Sua segurança é prioridade.',
        resources: [
          { name: 'Polícia Militar', phone: '190', available24_7: true },
          { name: 'Central de Atendimento à Mulher', phone: '180', available24_7: true },
          { name: 'CVV - Centro de Valorização da Vida', phone: '188', available24_7: true }
        ]
      };
    }

    if (hasMediumRiskKeyword) {
      // Use Claude for deeper analysis
      const analysis = await analyzeRiskLevel(message, conversationHistory);

      return {
        isEmergency: analysis.isEmergency,
        riskLevel: analysis.riskLevel,
        suggestedActions: analysis.suggestedActions,
        identifiedPatterns: analysis.patterns,
        message: analysis.riskLevel === 'high'
          ? '⚠️ ATENÇÃO: Identifiquei sinais de risco. Vamos conversar sobre sua segurança.'
          : null,
        resources: analysis.riskLevel === 'high' ? [
          { name: 'Polícia Militar', phone: '190', available24_7: true },
          { name: 'Central de Atendimento à Mulher', phone: '180', available24_7: true }
        ] : []
      };
    }

    return {
      isEmergency: false,
      riskLevel: 'low',
      suggestedActions: [],
      identifiedPatterns: [],
      message: null,
      resources: []
    };

  } catch (error) {
    console.error('Error detecting emergency:', error);
    // Return safe default
    return {
      isEmergency: false,
      riskLevel: 'low',
      suggestedActions: [],
      identifiedPatterns: [],
      message: null,
      resources: []
    };
  }
}

/**
 * Get emergency resources
 * @returns {Array} Emergency resources
 */
function getEmergencyResources() {
  return [
    {
      name: 'Polícia Militar',
      phone: '190',
      description: 'Emergências policiais',
      available24_7: true
    },
    {
      name: 'Central de Atendimento à Mulher',
      phone: '180',
      description: 'Atendimento especializado para mulheres em situação de violência',
      available24_7: true
    },
    {
      name: 'CVV - Centro de Valorização da Vida',
      phone: '188',
      description: 'Apoio emocional e prevenção ao suicídio',
      available24_7: true
    },
    {
      name: 'Disque Direitos Humanos',
      phone: '100',
      description: 'Denúncias de violações de direitos humanos',
      available24_7: true
    },
    {
      name: 'SAMU',
      phone: '192',
      description: 'Atendimento médico de emergência',
      available24_7: true
    }
  ];
}

module.exports = {
  detectEmergency,
  getEmergencyResources
};
