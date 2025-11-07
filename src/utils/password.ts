import bcrypt from 'bcryptjs';

// Defining the salt rounds for hashing strength
const SALT_ROUNDS = 10;

/**
 * Hashing a plain text password.
 * @param password The password string to hash.
 * @returns The hashed password string.
 */
export const hashPassword = async (password: string): Promise<string> => {
  // Generating a salt with the specified number of rounds
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  // Hashing the password using the generated salt
  return bcrypt.hash(password, salt);
};

/**
 * Comparing a plain text password with a hashed password.
 * @param password The plain text password.
 * @param hash The hashed password from the database.
 * @returns True if passwords match, false otherwise.
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  // Comparing the plain text password against the stored hash
  return bcrypt.compare(password, hash);
};