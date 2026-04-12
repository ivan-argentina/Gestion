import { useState } from "react";

export default function PagosClientes() {
  const [clientes, setClientes] = useState([]);
  const [clienteId, setClienteId] = useState("");
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [formaPago, setFormaPago] = useState("Efectivo");
  const [observaciones, setObservaciones] = useState("");
  const [importeRecibido, setImporteRecibido] = useState("");

  const [facturasPendientes, setFacturasPendientes] = useState([]);
  const [loading, setLoading] = useState(false);
}
