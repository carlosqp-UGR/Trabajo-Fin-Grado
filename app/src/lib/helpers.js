import bcrypt from "bcryptjs";

export const encryptPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  const hashed_password = await bcrypt.hash(password,  salt);
  return hashed_password;
};

// función para comprobar contraseñas (login)
// password: contraseña en texto plano
// savedPassword: contraseña cifrada guardada en la BD
export const matchPassword = async (password, savedPassword) => {
    const result = await bcrypt.compare(password, savedPassword);
    return result;
};
