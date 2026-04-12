export const formatearCuit = (cuit) => {
  if (!cuit) return "";

  const limpio = cuit.toString().replace(/\D/g, "");

  if (limpio.length !== 11) return limpio;

  return `${limpio.slice(0, 2)}-${limpio.slice(2, 10)}-${limpio.slice(10)}`;
};
