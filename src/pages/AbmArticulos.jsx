import {
  Box,
  MenuItem,
  Paper,
  TextField,
  Typography,
  Button,
  Chip,
  IconButton,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { supabase } from "../hook/supabaseClient";
import { useEffect, useState } from "react";
import Notificaciones from "./Notificaciones";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import DeleteIcon from "@mui/icons-material/Delete";
import ImageIcon from "@mui/icons-material/Image";
import CancelIcon from "@mui/icons-material/Cancel";
import { DataGrid } from "@mui/x-data-grid";
import InputPrecio from "./InputPrecio";
import imageCompression from "browser-image-compression";

export default function AbmArticulos() {
  const [articulos, setArticulos] = useState([]);
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [familiaId, setFamiliaId] = useState("");
  const [familias, setFamilias] = useState([]);
  const [archivoImagen, setArchivoImagen] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [fotoActual, setFotoActual] = useState("");
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [tipo, setTipo] = useState("");
  const [open, setOpen] = useState(false);
  const [editando, setEditando] = useState(false);
  const [editandoId, setEditandoId] = useState(null);

  const manejarImagen = async (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    // validar tipo
    if (!archivo.type.startsWith("image/")) {
      setMensaje("El archivo debe ser una imagen");
      setTipo("error");
      setOpen(true);
      return;
    }

    // validar tamaño original (ej. 5 MB)
    if (archivo.size > 5 * 1024 * 1024) {
      setMensaje("La imagen es demasiado grande. Máximo 5 MB");
      setTipo("error");
      setOpen(true);
      return;
    }

    try {
      const opciones = {
        maxSizeMB: 0.7,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      };

      const archivoComprimido = await imageCompression(archivo, opciones);

      setArchivoImagen(archivoComprimido);

      const urlPreview = URL.createObjectURL(archivoComprimido);
      setPreviewUrl(urlPreview);
    } catch (error) {
      console.log(error);
      setMensaje("Error al procesar la imagen");
      setTipo("error");
      setOpen(true);
    }
  };

  const mostrarNotificacion = (msg, severity = "success") => {
    setMensaje(msg);
    setTipo(severity);
    setOpen(true);
  };

  const resetFormulario = () => {
    setNombre("");
    setPrecio("");
    setFamiliaId("");
    setArchivoImagen(null);
    setPreviewUrl("");
    setFotoActual("");
    setEditando(false);
    setEditandoId(null);
    setError("");
  };

  const obtenerUrlImagen = (path) => {
    if (!path) return "";

    const { data } = supabase.storage.from("articulos").getPublicUrl(path);
    return data?.publicUrl || "";
  };

  const subirImagen = async (archivo) => {
    if (!archivo) return null;

    const extension = archivo.name?.split(".").pop() || "jpg";
    const nombreArchivo = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${extension}`;

    const { data, error } = await supabase.storage
      .from("articulos")
      .upload(nombreArchivo, archivo, {
        cacheControl: "3600",
        upsert: false,
        contentType: archivo.type,
      });

    if (error) {
      console.log("ERROR STORAGE:", error);
      setMensaje(`Error al subir imagen: ${error.message}`);
      setTipo("error");
      setOpen(true);
      return null;
    }

    return data.path;
  };

  const eliminarImagenStorage = async (path) => {
    if (!path) return;

    const { error } = await supabase.storage.from("articulos").remove([path]);

    if (error) {
      console.log("No se pudo borrar la imagen anterior:", error.message);
    }
  };

  const cargarArticulos = async () => {
    const { data, error } = await supabase
      .from("articulos")
      .select(
        `
      id,
      codigo,
      descripcion,
      precio,
      stock,
      idfamilia,
      imagen_url,
      familias(nombre)
    `,
      )
      .order("descripcion", { ascending: true });

    if (error) {
      console.log(error);
      mostrarNotificacion("Error al cargar artículos", "error");
      return;
    }

    setArticulos(data || []);
  };

  const cargarFamilias = async () => {
    const { data, error } = await supabase
      .from("familias")
      .select("*")
      .order("nombre");

    if (error) {
      console.log(error);
      mostrarNotificacion("Error al cargar familias", "error");
      return;
    }

    setFamilias(data || []);
  };

  const editarArticulo = (articulo) => {
    setNombre(articulo.nombre || "");
    setPrecio(articulo.precio || "");
    setFamiliaId(articulo.idfamilia || "");
    setEditandoId(articulo.id);
    setEditando(true);
    setFotoActual(articulo.foto_url || "");
    setPreviewUrl(articulo.foto_url ? obtenerUrlImagen(articulo.foto_url) : "");
    setArchivoImagen(null);
    setError("");
  };

  const cancelarEdicion = () => {
    resetFormulario();
  };

  const eliminarArticulo = async (articulo) => {
    if (!window.confirm("¿Eliminar artículo?")) return;

    const { error } = await supabase
      .from("articulos")
      .delete()
      .eq("id", articulo.id);

    if (error) {
      console.log(error);
      mostrarNotificacion("Error al eliminar artículo", "error");
      return;
    }

    if (articulo.foto_url) {
      await eliminarImagenStorage(articulo.foto_url);
    }

    mostrarNotificacion("Artículo eliminado", "info");
    cargarArticulos();
  };

  const guardarArticulos = async (e) => {
    e.preventDefault();

    if (!nombre || !precio || !familiaId) {
      setError("Complete los campos obligatorios");
      return;
    }

    setError("");

    let fotoPath = fotoActual;

    if (archivoImagen) {
      const nuevaFoto = await subirImagen(archivoImagen);

      if (!nuevaFoto) {
        mostrarNotificacion("Error al subir la imagen", "error");
        return;
      }

      fotoPath = nuevaFoto;
    }

    if (editandoId) {
      //console.log("fotoPath a guardar:", fotoPath);
      const { error } = await supabase
        .from("articulos")
        .update({
          nombre,
          precio: Number(precio),
          idfamilia: familiaId,
          foto_url: fotoPath || null,
        })
        .eq("id", editandoId);

      if (error) {
        console.log(error);
        mostrarNotificacion("Error al actualizar artículo", "error");
        return;
      }

      if (archivoImagen && fotoActual && fotoActual !== fotoPath) {
        await eliminarImagenStorage(fotoActual);
      }

      mostrarNotificacion("Artículo actualizado correctamente", "success");
    } else {
      console.log("fotoPath a guardar:", fotoPath);
      const { error } = await supabase.from("articulos").insert([
        {
          nombre,
          precio: Number(precio),
          idfamilia: familiaId,
          foto_url: fotoPath || null,
        },
      ]);

      if (error) {
        console.log(error);
        mostrarNotificacion("Error al guardar el artículo", "error");
        return;
      }

      mostrarNotificacion("Artículo guardado correctamente", "success");
    }

    resetFormulario();
    cargarArticulos();
    setArchivoImagen(null);
    setPreviewUrl("");
  };

  const columnas = [
    {
      field: "foto_url",
      headerName: "Foto",
      width: 100,
      renderCell: (params) => {
        // console.log(params.row);
        //  console.log(params.row.foto_url);
        const url = obtenerUrlImagen(params.row.foto_url);
        //  console.log(url);
        return params.row.foto_url ? (
          <img
            src={url}
            alt="articulo"
            style={{
              width: 50,
              height: 50,
              objectFit: "cover",
              borderRadius: 8,
            }}
          />
        ) : (
          "Sin foto"
        );
      },
    },
    { field: "nombre", headerName: "Articulo", flex: 1 },
    {
      field: "precio",
      headerName: "Precio",
      width: 150,
      valueGetter: (value, row) => row?.precio || 0,
      valueFormatter: (value) => new Intl.NumberFormat("es-AR").format(value),
    },
    {
      field: "familia",
      headerName: "Familia",
      flex: 1,
      renderCell: (params) => (
        <Chip
          label={params.row?.familias?.nombre || "Sin familia"}
          color="primary"
          size="small"
        />
      ),
    },
    {
      field: "acciones",
      headerName: "Acciones",
      width: 150,
      renderCell: (params) => (
        <>
          <IconButton
            color="primary"
            onClick={() => editarArticulo(params.row)}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            color="error"
            onClick={() => eliminarArticulo(params.row.id)}
          >
            <DeleteIcon />
          </IconButton>
        </>
      ),
    },
  ];

  useEffect(() => {
    cargarFamilias();
    cargarArticulos();
  }, []);

  useEffect(() => {
    if (!archivoImagen) return;

    const objectUrl = URL.createObjectURL(archivoImagen);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [archivoImagen]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Paper
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          p: 2,
          borderRadius: 3,
        }}
      >
        <Typography
          variant="h5"
          align="center"
          gutterBottom
          sx={{ fontSize: "16px" }}
        >
          Carga de Artículos
        </Typography>

        <Notificaciones
          open={open}
          mensaje={mensaje}
          tipo={tipo}
          onClose={() => setOpen(false)}
        />

        <Box component="form" onSubmit={guardarArticulos} sx={{ mb: 2 }}>
          <Grid container spacing={1}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Artículo"
                fullWidth
                size="small"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                label="Familia"
                fullWidth
                size="small"
                value={familiaId}
                onChange={(e) => setFamiliaId(e.target.value)}
              >
                {familias.map((f) => (
                  <MenuItem key={f.id} value={f.id}>
                    {f.nombre}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <InputPrecio value={precio} onChange={setPrecio} size="small" />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Button
                component="label"
                variant="outlined"
                fullWidth
                size="small"
                sx={{ height: 40, textTransform: "none" }}
              >
                {archivoImagen ? "Cambiar foto" : "Seleccionar foto"}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={manejarImagen}
                />
              </Button>
              {previewUrl && (
                <Box
                  sx={{
                    mt: 1,
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <Box
                    component="img"
                    src={previewUrl}
                    alt="Preview"
                    sx={{
                      width: 100,
                      height: 100,
                      objectFit: "cover",
                      borderRadius: 2,
                      border: "1px solid #ccc",
                    }}
                  />
                </Box>
              )}
            </Grid>

            {(previewUrl || fotoActual) && (
              <Grid size={{ xs: 12 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    p: 1,
                    border: "1px solid #ddd",
                    borderRadius: 2,
                  }}
                >
                  <Box
                    component="img"
                    src={previewUrl || obtenerUrlImagen(fotoActual)}
                    alt="preview"
                    sx={{
                      width: 70,
                      height: 70,
                      objectFit: "cover",
                      borderRadius: 2,
                    }}
                  />

                  <Button
                    color="error"
                    size="small"
                    startIcon={<CancelIcon />}
                    onClick={() => {
                      setArchivoImagen(null);
                      setPreviewUrl("");
                      setFotoActual("");
                    }}
                  >
                    Quitar foto
                  </Button>
                </Box>
              </Grid>
            )}

            <Grid size={{ xs: 12, sm: 6 }}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="small"
                startIcon={<SaveIcon />}
                disabled={!nombre || !familiaId || !precio}
                sx={{ height: 40 }}
              >
                {editando ? "Actualizar" : "Guardar"}
              </Button>
            </Grid>

            {editando && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <Button
                  type="button"
                  variant="outlined"
                  fullWidth
                  size="small"
                  onClick={cancelarEdicion}
                  sx={{ height: 40 }}
                >
                  Cancelar
                </Button>
              </Grid>
            )}
          </Grid>

          {error && (
            <Typography color="error" sx={{ mt: 1, fontSize: 13 }}>
              {error}
            </Typography>
          )}
        </Box>

        <Box sx={{ flexGrow: 1, minHeight: 0, display: "flex" }}>
          <DataGrid
            rows={articulos}
            columns={columnas}
            rowHeight={60}
            pageSizeOptions={[5, 10, 20]}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 5, page: 0 },
              },
            }}
            density="compact"
            sx={{ flexGrow: 1, fontSize: 12 }}
          />
        </Box>
      </Paper>
    </Box>
  );
}
