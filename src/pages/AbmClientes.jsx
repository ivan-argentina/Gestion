import {
  Box,
  Button,
  Container,
  MenuItem,
  Paper,
  TextField,
  Typography,
  InputAdornment,
  Grid,
  IconButton,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { supabase } from "../hook/supabaseClient";
import Notificaciones from "./Notificaciones";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatearCuit } from "../utils/formatearCuit";
import { validarCuit } from "../utils/validarCuit";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import LocationCityIcon from "@mui/icons-material/LocationCity";
import SearchIcon from "@mui/icons-material/Search";

export default function AbmClientes() {
  const Navigate = useNavigate();

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [ciudadId, setCiudadId] = useState("");

  const [clientes, setClientes] = useState([]);
  const [ciudades, setCiudades] = useState([]);

  const [buscar, setBuscar] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [cuit, setCuit] = useState("");
  const [errorCuit, setErrorCuit] = useState("");

  const [mensaje, setMensaje] = useState("");
  const [tipo, setTipo] = useState("success");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [condicionIvaId, setCondicionIvaId] = useState("");
  const [condicionesIva, setCondicionesIva] = useState([]);

  const handleCuitChange = (e) => {
    const valor = e.target.value.replace(/\D/g, "");
    setCuit(valor);

    if (valor.length === 11) {
      if (!validarCuit(valor)) {
        setErrorCuit("CUIT inválido");
      } else {
        setErrorCuit("");
      }
    } else {
      setErrorCuit("");
    }
  };

  //Cargar Condicion Iva
  const cargarCondicionIva = async () => {
    const { data, error } = await supabase
      .from("condicion_iva")
      .select("id,descripcion")
      .order("descripcion", { ascending: true });

    if (error) {
      console.error("Error al cargar condiciones de Iva", error);
      return;
    }

    setCondicionesIva(data || []);
  };

  // 🔹 Cargar ciudades
  const cargarCiudades = async () => {
    const { data, error } = await supabase
      .from("ciudades")
      .select("*")
      .order("nombre");
    if (error) {
      console.log(error);
      return [];
    }
    return data || [];
  };

  const cargarClientes = async () => {
    const { data, error } = await supabase.from("clientes").select(`
    id,
    nombre,
    direccion,
    telefono,
    email,
    cuit,
    idciudad,
    idciva,
    ciudades(nombre),
    condicion_iva(descripcion)
  `);

    if (error) {
      console.log(error);
      return [];
    }

    return data || [];
  };

  // 🔹 Editar
  const editarCliente = (cliente) => {
    setEditandoId(cliente.id);
    setNombre(cliente.nombre || "");
    setDireccion(cliente.direccion || "");
    setTelefono(cliente.telefono || "");
    setEmail(cliente.email || "");
    setCiudadId(cliente.idciudad || "");
    setCondicionIvaId(cliente.idciva || "");
    setCuit(cliente.cuit);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelarEdicion = () => {
    (setNombre(""),
      setDireccion(""),
      setTelefono(""),
      setEmail(""),
      setCuit(""),
      setCiudadId(""),
      setCondicionIvaId(""),
      setEditandoId(null),
      setError(""),
      setMensaje("Edicion Cancelada"));
    setTipo("info");
    setOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 🔹 ELIMINAR
  const eliminarClientes = async (id) => {
    const { data } = await supabase
      .from("facturas")
      .select("id")
      .eq("idcliente", id);

    if (data && data.length > 0) {
      setMensaje("No se puede eliminar: tiene facturas asociadas");
      setTipo("warning");
      setOpen(true);
      return;
    }

    const { error } = await supabase.from("clientes").delete().eq("id", id);

    if (error) {
      console.error(error);
      setMensaje("Error al eliminar");
      setTipo("error");
      setOpen(true);
      return;
    }

    setMensaje("Cliente eliminado");
    setTipo("success");
    setOpen(true);

    await cargarClientes();
  };

  // 🔹 Guardar clientes
  const guardarClientes = async (e) => {
    e.preventDefault();

    if (!nombre.trim() || !telefono.trim() || !ciudadId || !direccion.trim()) {
      setError("Complete los campos obligatorios");
      return;
    }

    if (editandoId) {
      const { error } = await supabase
        .from("clientes")
        .update({
          nombre,
          direccion,
          telefono,
          email,
          cuit,
          idciudad: ciudadId || null,
          idciva: condicionIvaId || null,
        })
        .eq("id", editandoId);

      if (error) {
        setError("Error al actualizar cliente");
        return;
      }

      setMensaje("Cliente actualizado");
      setTipo("success");
      setOpen(true);
    } else {
      const { error } = await supabase.from("clientes").insert([
        {
          nombre,
          direccion,
          email,
          telefono,
          cuit,
          idciudad: ciudadId || null,
          idciva: condicionIvaId || null,
        },
      ]);

      if (error) {
        setMensaje("Error al guardar");
        setTipo("error");
        setOpen(true);
        return;
      }

      setMensaje("Cliente guardado");
      setTipo("success");
      setOpen(true);
    }

    setNombre("");
    setEmail("");
    setTelefono("");
    setDireccion("");
    setCiudadId("");
    setEditandoId(null);
    setError("");
    setCuit("");
    setCondicionIvaId("");

    const clientesActualizados = await cargarClientes();
    setClientes(clientesActualizados);
  };

  // 🔹 Filtro
  const clientesFiltrados = clientes.filter((c) =>
    c.nombre.toLowerCase().includes(buscar.toLowerCase()),
  );

  // 🔹 Columnas
  const columnas = [
    { field: "nombre", headerName: "Cliente", flex: 1 },

    { field: "direccion", headerName: "Dirección", flex: 1 },

    {
      field: "ciudad",
      headerName: "Ciudad",
      flex: 1,
      valueGetter: (value, row) => row?.ciudades?.nombre || "",
    },
    { field: "cuit", headerName: "Cuit", flex: 1 },
    { field: "telefono", headerName: "Teléfono", flex: 1 },
    {
      field: "condicion_iva",
      headerName: "Cond. IVA",
      flex: 1,
      valueGetter: (value, row) => row?.condicion_iva?.descripcion || "",
    },
    { field: "email", headerName: "Email", width: 200 },
    {
      field: "editar",
      headerName: "",
      width: 70,
      renderCell: (params) => (
        <IconButton onClick={() => editarCliente(params.row)} color="primary">
          <EditIcon />
        </IconButton>
      ),
    },
    {
      field: "eliminar",
      headerName: "",
      width: 70,
      renderCell: (params) => (
        <IconButton
          onClick={() => eliminarClientes(params.row.id)}
          color="error"
        >
          <DeleteIcon />
        </IconButton>
      ),
    },
  ];
  useEffect(() => {
    let activo = true;

    const init = async () => {
      const [ciudadesData, clientesData] = await Promise.all([
        cargarCiudades(),
        cargarClientes(),
        cargarCondicionIva(),
      ]);

      if (!activo) return;

      setCiudades(ciudadesData);
      setClientes(clientesData);
    };

    init();

    return () => {
      activo = false;
    };
  }, []);
  return (
    <Container maxWidth="lg">
      {/* FORM */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
        <Typography variant="h5" align="center" gutterBottom>
          Carga de Clientes
        </Typography>

        <Notificaciones
          open={open}
          mensaje={mensaje}
          tipo={tipo}
          onClose={() => setOpen(false)}
        />

        <Grid container spacing={2} component="form" onSubmit={guardarClientes}>
          {/* FILA 1 */}
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              label="Cliente"
              fullWidth
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              label="Dirección"
              fullWidth
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              select
              label="Ciudad"
              fullWidth
              value={ciudadId}
              onChange={(e) => setCiudadId(e.target.value)}
            >
              {ciudades.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.nombre}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          {/* FILA 2 */}
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              label="Teléfono"
              fullWidth
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              label="Email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              select
              label="Condición Iva"
              fullWidth
              value={condicionIvaId}
              onChange={(e) => setCondicionIvaId(e.target.value)}
            >
              {condicionesIva.map((iva) => (
                <MenuItem key={iva.id} value={iva.id}>
                  {iva.descripcion}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          {/* Fila 3*/}

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              label="Cuit"
              fullWidth
              size="small"
              value={formatearCuit(cuit)}
              onChange={handleCuitChange}
              error={!!errorCuit}
              helperText={errorCuit}
            />
          </Grid>
          {/* BOTÓN */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              {editandoId && (
                <Button
                  sx={{ mr: 1 }}
                  variant="outlined"
                  color="inherit"
                  size="small"
                  onClick={cancelarEdicion}
                >
                  Cancelar
                </Button>
              )}
              <Button
                type="submit"
                variant="contained"
                size="small"
                startIcon={<SaveIcon />}
              >
                {editandoId ? "Actualizar Cliente" : "Guardar Cliente"}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* GRID */}
      <Paper
        sx={{
          p: 2,
          borderRadius: 3,
          display: "flex",
          flexDirection: "column",
          height: 400,
        }}
      >
        <TextField
          label="Buscar Cliente"
          size="small"
          fullWidth
          sx={{ mb: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
        />

        <Box sx={{ flexGrow: 1 }}>
          <DataGrid
            rows={clientesFiltrados}
            columns={columnas}
            pageSize={5}
            density="compact"
          />
        </Box>
      </Paper>
    </Container>
  );
}
