import { TextField, InputAdornment } from "@mui/material";
import { useEffect, useState, useRef } from "react";

export default function InputPrecio({ value, onChange, label = "Precio" }) {
  const [display, setDisplay] = useState("");
  const isEditing = useRef(false); // ✅ agregado

  const formatear = (valor) => {
    if (!valor && valor !== 0) return "";
    return new Intl.NumberFormat("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(valor);
  };

  // 🔑 SOLO actualiza si NO estás escribiendo
  useEffect(() => {
    if (!isEditing.current) {
      if (value || value === 0) {
        setDisplay(formatear(value));
      } else {
        setDisplay("");
      }
    }
  }, [value]);

  const handleChange = (e) => {
    isEditing.current = true;

    let input = e.target.value;

    // permitir números, coma y punto
    input = input.replace(/[^0-9.,]/g, "");

    setDisplay(input);

    const normalizado = input.replace(",", ".");
    const numero = parseFloat(normalizado);

    if (!isNaN(numero)) {
      onChange(numero);
    } else {
      onChange("");
    }
  };

  const handleBlur = () => {
    isEditing.current = false;
    setDisplay(formatear(value));
  };

  const handleFocus = () => {
    isEditing.current = true;
    setDisplay(value?.toString() || "");
  };

  return (
    <TextField
      label={label}
      fullWidth
      value={display}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      InputProps={{
        startAdornment: <InputAdornment position="start">$</InputAdornment>,
      }}
    />
  );
}