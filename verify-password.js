const bcrypt = require('bcryptjs');

async function verify() {
  // Get the actual hash from database
  const dbHash = '$2b$12$7cQcsFf2Vr2wsNF9aXSqYObZsLqWVArPPphegBiNaWsE0o7/68YFW';
  
  console.log('Testing password: admin123');
  console.log('Hash from DB:', dbHash);
  console.log('Hash length:', dbHash.length);
  
  // Test various password variations
  const tests = [
    'admin123',
    'admin123 ',
    ' admin123',
    'Admin123',
    'ADMIN123',
  ];
  
  for (const pwd of tests) {
    const result = await bcrypt.compare(pwd, dbHash);
    console.log(`"${pwd}" (length ${pwd.length}): ${result ? '✅ MATCH' : '❌ NO MATCH'}`);
  }
  
  // Generate a fresh hash to be absolutely sure
  console.log('\n--- Generating fresh hash ---');
  const freshHash = await bcrypt.hash('admin123', 12);
  console.log('Fresh hash:', freshHash);
  const freshVerify = await bcrypt.compare('admin123', freshHash);
  console.log('Fresh hash verification:', freshVerify);
  
  if (freshVerify) {
    console.log('\n✅ Use this SQL to update:');
    console.log(`UPDATE "User" SET password = '${freshHash}' WHERE email = 'austin@kinhome.com';`);
  }
}

verify().catch(console.error);
