const bcrypt = require("bcrypt");

export function encryptData(password: string) {
  return bcrypt.hashSync(password, 10);
}

export async function verifyData(hash: string, text: string) {
  return bcrypt.compare(text, hash);
}
