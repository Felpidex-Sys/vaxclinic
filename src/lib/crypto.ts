import bcrypt from 'bcryptjs';

/**
 * Hash de senha usando bcrypt
 * @param password Senha em texto plano
 * @returns Senha hash
 */
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Verifica se uma senha corresponde ao hash
 * @param password Senha em texto plano
 * @param hash Hash armazenado
 * @returns true se a senha corresponde
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};
