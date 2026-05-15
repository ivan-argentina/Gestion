import { supabase } from "../hook/supabaseClient";

export const obtenerEmpresa = async () => {
  const { data, error } = await supabase.from("empresa").select("*");

  if (error) {
    console.error("Error al cargar la Empresa", error);
    return null;
  }

  return data?.[0] || null;
};
