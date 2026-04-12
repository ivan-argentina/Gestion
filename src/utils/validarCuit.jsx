export const validarCuit = (cuit) => {
  if (!cuit) return false;

  const limpio = cuit.toString().replace(/\D/g, "");

  if (limpio.length !== 11) return false;

  const multiplicadores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

  let suma = 0;
  for (let i = 0; i < 10; i++) {
    suma += parseInt(limpio[i], 10) * multiplicadores[i];
  }

  const resto = suma % 11;
  const digitoCalculado = resto === 0 ? 0 : resto === 1 ? 9 : 11 - resto;

  return digitoCalculado === parseInt(limpio[10], 10);
};
