// generate-admin-hash.js
// Exécutez: node generate-admin-hash.js

const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = 'admin123';
  const saltRounds = 10;
  
  try {
    const hash = await bcrypt.hash(password, saltRounds);
    console.log('🔐 Generated bcrypt hash for password "admin123":');
    console.log(hash);
    console.log('');
    console.log('📋 SQL pour mettre à jour:');
    console.log(`UPDATE admin_users SET password_hash = '${hash}' WHERE email = 'admin@talvio.com';`);
    
    // Test de vérification
    const isValid = await bcrypt.compare(password, hash);
    console.log('');
    console.log('✅ Vérification:', isValid ? 'SUCCÈS' : 'ÉCHEC');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

generateHash();