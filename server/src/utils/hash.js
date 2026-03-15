// Utility script: generate bcrypt hash for admin password
// Usage: node src/utils/hash.js yourpassword
import bcrypt from 'bcryptjs';

const password = process.argv[2];
if (!password) {
  console.error('Usage: node src/utils/hash.js <password>');
  process.exit(1);
}
const hash = await bcrypt.hash(password, 12);
console.log('ADMIN_PASSWORD_HASH=', hash);
