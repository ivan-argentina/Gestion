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
    idciudad,
    ciudades(nombre),
    cuit
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
    setNombre(cliente.nombre);
    setDireccion(cliente.direccion);
    setTelefono(cliente.telefono);
    setEmail(cliente.email);
    setCiudadId(cliente.idciudad);
    setCuit(cliente.cuit);
  };

  // 🔹 ELIMINAR
  const eliminarClientes = async (id) => {
    if (!confirm("Eliminar Cliente?")) return;

    const { error } = await supabase.from("clientes").delete().eq("id", id);

    if (error) {
      setMensaje("Error al eliminar cliente");
      setTipo("error");
      setOpen(true);
      return;
    }

    const clientesActualizados = await cargarClientes();
    setClientes(clientesActualizados);

    setMensaje("Cliente eliminado");
    setTipo("info");
    setOpen(true);
  };

  // 🔹 Guardar
  const guardarClientes = async (e) => {
    e.preventDefault();

    if (!nombre || !telefono || !ciudadId || !direccion) {
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
          idciudad: ciudadId,
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
          idciudad: ciudadId,
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
    { field: "email", headerName: "Email", width: 200 },
    { field: "direccion", headerName: "Dirección", flex: 1 },
    { field: "telefono", headerName: "Teléfono", flex: 1 },
    { field: "cuit", headerName: "Cuit", flex: 1 },
    {
      field: "ciudad",
      headerName: "Ciudad",
      flex: 1,
      valueGetter: (value, row) => row?.ciudades?.nombre || "",
    },
    {
      field: "editar",
      headerName: "",
      width: 70,
      renderCell: (params) => (
        <IconButton
          onClick={() => editarCliente(params.row)}
          color="primary"
        >
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
        <Typography
          variant="h5"
          align="center"
          gutterBottom
        >
          Carga de Clientes
        </Typography>

        <Notificaciones
          open={open}
          mensaje={mensaje}
          tipo={tipo}
          onClose={() => setOpen(false)}
        />

        <Grid
          container
          spacing={2}
          component="form"
          onSubmit={guardarClientes}
        >
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
                <MenuItem
                  key={c.id}
                  value={c.id}
                >
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
          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
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
