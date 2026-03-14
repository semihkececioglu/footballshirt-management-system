// Yardımcı script: Admin şifre hash'i oluşturmak için
// Kullanım: node src/utils/hash.js yourpassword
import bcrypt from 'bcryptjs';

const password = process.argv[2];
if (!password) {
  console.error('Kullanım: node src/utils/hash.js <şifre>');
  process.exit(1);
}
const hash = await bcrypt.hash(password, 12);
console.log('ADMIN_PASSWORD_HASH=', hash);
