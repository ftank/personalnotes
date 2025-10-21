const crypto = require('crypto');

console.log('\n🔐 Gerando chaves de criptografia...\n');

const encryptionKey = crypto.randomBytes(32).toString('hex');
const analyticsSalt = crypto.randomBytes(16).toString('hex');

console.log('ENCRYPTION_MASTER_KEY=' + encryptionKey);
console.log('ANALYTICS_SALT=' + analyticsSalt);

console.log('\n✅ Copie e cole no arquivo .env\n');
