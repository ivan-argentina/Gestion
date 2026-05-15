import {
  Box,
  MenuItem,
  Paper,
  TextField,
  Typography,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { supabase } from "../hook/supabaseClient";
import { useEffect, useState } from "react";
import Notificaciones from "./Notificaciones";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import DeleteIcon from "@mui/icons-material/Delete";
import CancelIcon from "@mui/icons-material/Cancel";
import { DataGrid } from "@mui/x-data-grid";
import InputPrecio from "./InputPrecio";
import imageCompression from "browser-image-compression";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloseIcon from "@mui/icons-material/Close";
import ModalImagen from "../componentes/ModalImagen";

export default function AbmArticulos() {
  const [articulos, setArticulos] = useState([]);
  const [nombre, setNombre] = useState("");
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
  const [codigo, setCodigo] = useState("");
  const [precioCosto, setPrecioCosto] = useState("");
  const [precio, setPrecio] = useState("");
  const [margen, setMargen] = useState("");
  const [familiaId, setFamiliaId] = useState("");
  const [stock, setStock] = useState("");
  const [stockMinimo, setStockMinimo] = useState("");
  const [filtroStock, setFiltroStock] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [openFoto, setOpenFoto] = useState(false);
  const [fotoSeleccionada, setFotoSeleccionada] = useState("");

  const abrirFoto = (foto) => {
    setFotoSeleccionada(obtenerUrlImagen(foto));
    setOpenFoto(true);
  };

  const cerrarFoto = () => {
    setOpenFoto(false);
    setFotoSeleccionada("");
  };
  const articulosFiltrados = articulos.filter((articulo) => {
    const stock = Number(articulo.stock || 0);
    const minimo = Number(articulo.stock_minimo || 0);
    const texto = busqueda.toLowerCase();

    const coincideBusqueda =
      articulo.descripcion?.toLowerCase().includes(texto) ||
      articulo.codigo?.toLowerCase().includes(texto) ||
      articulo.familias?.nombre?.toLowerCase().includes(texto);

    if (!coincideBusqueda) return false;

    if (filtroStock === "sin-stock") {
      return stock === 0;
    }
    if (filtroStock === "bajo-stock") {
      return stock > 0 && stock <= minimo;
    }
    return true;
  });

  const calcularPrecioDesdeMargen = (costo, porcentaje) => {
    const costoNum = Number(costo) || 0;
    const margenNum = Number(porcentaje) || 0;

    if (!costoNum) return 0;

    return costoNum * (1 + margenNum / 100);
  };

  const manejarCambioMargen = (valor) => {
    setMargen(valor);

    const nuevoPrecio = calcularPrecioDesdeMargen(precioCosto, valor);
    setPrecio(nuevoPrecio);
  };

  const manejarCambioCosto = (valor) => {
    setPrecioCosto(valor);

    if (margen !== "") {
      const nuevoPrecio = calcularPrecioDesdeMargen(valor, margen);
      setPrecio(nuevoPrecio);
    }
  };

  const generarCodigo = () => {
    return "ART-" + Date.now();
  };

  const mostrarNotificacion = (msg, severity = "success") => {
    setMensaje(msg);
    setTipo(severity);
    setOpen(true);
  };

  const resetFormulario = () => {
    setCodigo("");
    setNombre("");
    setPrecio("");
    setStock("");
    setFamiliaId("");
    setArchivoImagen(null);
    setPreviewUrl("");
    setFotoActual("");
    setEditando(false);
    setEditandoId(null);
    setError("");
    setPrecioCosto("");
    setMargen("");
    setStockMinimo("");
  };

  const obtenerUrlImagen = (path) => {
    if (!path) return "";
    const { data } = supabase.storage.from("articulos").getPublicUrl(path);
    return data?.publicUrl || "";
  };

  const manejarImagen = async (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    if (!archivo.type.startsWith("image/")) {
      mostrarNotificacion("El archivo debe ser una imagen", "error");
      return;
    }

    if (archivo.size > 5 * 1024 * 1024) {
      mostrarNotificacion(
        "La imagen es demasiado grande. Máximo 5 MB",
        "error",
      );
      return;
    }

    try {
      const opciones = {
        maxSizeMB: 0.7,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      };

      const archivoComprimido = await imageCompression(archivo, opciones);

      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }

      setArchivoImagen(archivoComprimido);
      setPreviewUrl(URL.createObjectURL(archivoComprimido));
    } catch (err) {
      console.log(err);
      mostrarNotificacion("Error al procesar la imagen", "error");
    }
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
      mostrarNotificacion(`Error al subir imagen: ${error.message}`, "error");
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

  const cargarDatosIniciales = async () => {
    const [familiasResp, articulosResp] = await Promise.all([
      supabase
        .from("familias")
        .select("*")
        .order("nombre", { ascending: true }),
      supabase
        .from("articulos")
        .select(
          `
            id,
            codigo,
            descripcion,
            precio,
            precio_costo,
            stock,
            stock_minimo,
            idfamilia,
            imagen_url,
            familias(nombre)
          `,
        )
        .order("descripcion", { ascending: true }),
    ]);

    if (familiasResp.error) {
      console.log(familiasResp.error);
      mostrarNotificacion("Error al cargar familias", "error");
    } else {
      setFamilias(familiasResp.data || []);
    }

    if (articulosResp.error) {
      console.log(articulosResp.error);
      mostrarNotificacion("Error al cargar artículos", "error");
    } else {
      setArticulos(articulosResp.data || []);
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
          precio_costo,
          stock,
          stock_minimo,
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

  const editarArticulo = (articulo) => {
    setCodigo(articulo.codigo || "");
    setNombre(articulo.descripcion || "");
    setPrecio(articulo.precio || "");
    setPrecioCosto(articulo.precio_costo || "");
    setStock(articulo.stock || "");
    setStockMinimo(articulo.stock_minimo || "");
    setFamiliaId(articulo.idfamilia || "");
    setEditandoId(articulo.id);
    setEditando(true);
    setFotoActual(articulo.imagen_url || "");

    const costo = Number(articulo.precio_costo || 0);
    const venta = Number(articulo.precio || 0);

    if (costo > 0) {
      const margenCalculado = ((venta - costo) / costo) * 100;
      setMargen(margenCalculado.toFixed(2));
    } else {
      setMargen("");
    }

    setPreviewUrl(
      articulo.imagen_url ? obtenerUrlImagen(articulo.imagen_url) : "",
    );
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

    if (articulo.imagen_url) {
      await eliminarImagenStorage(articulo.imagen_url);
    }

    mostrarNotificacion("Artículo eliminado", "info");
    cargarArticulos();
  };

  const guardarArticulos = async (e) => {
    e.preventDefault();

    if (!nombre.trim() || !precio || !familiaId) {
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

    const codigoFinal = codigo.trim() || generarCodigo();

    const articuloPayload = {
      codigo: codigoFinal,
      descripcion: nombre.trim(),
      precio: Number(precio) || 0,
      stock: Number(stock) || 0,
      stock_minimo: Number(stockMinimo) || 0,
      idfamilia: familiaId || null,
      precio_costo: Number(precioCosto) || 0,
      imagen_url: fotoPath || null,
    };

    if (editandoId) {
      const { error } = await supabase
        .from("articulos")
        .update(articuloPayload)
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
      const { error } = await supabase
        .from("articulos")
        .insert([articuloPayload]);

      if (error) {
        console.log(error);
        mostrarNotificacion("Error al guardar el artículo", "error");
        return;
      }

      mostrarNotificacion("Artículo guardado correctamente", "success");
    }

    resetFormulario();
    cargarArticulos();
  };

  const columnas = [
    {
      field: "foto",
      headerName: "Foto",
      width: 90,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const url = obtenerUrlImagen(params.row?.imagen_url);

        return url ? (
          <img
            src={url}
            alt={params.row?.descripcion || "Artículo"}
            style={{
              width: 42,
              height: 42,
              objectFit: "cover",
              borderRadius: 8,
              marginTop: 8,
              marginBottom: 8,
            }}
          />
        ) : (
          <span style={{ color: "#888", fontSize: 12 }}>Sin foto</span>
        );
      },
    },
    {
      field: "codigo",
      headerName: "Código",
      width: 120,
    },
    {
      field: "descripcion",
      headerName: "Artículo",
      flex: 1,
      minWidth: 100,
    },
    {
      field: "stock",
      headerName: "Stock",
      width: 80,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        const stock = Number(params.row?.stock || 0);
        const minimo = Number(params.row?.stock_minimo || 0);

        let color = "success.main";

        if (stock === 0) color = "error.main";
        else if (stock <= minimo) color = "warning.main";

        return (
          <Box
            sx={{
              width: "100%",
              textAlign: "center",
              mt: "10px",
              fontWeight: 700,
              color,
            }}
          >
            {stock}
          </Box>
        );
      },
    },

    {
      field: "ganancia",
      headerName: "Ganancia",
      width: 130,
      renderCell: (params) => {
        const costo = Number(params.row?.precio_costo || 0);
        const venta = Number(params.row?.precio || 0);
        const ganancia = venta - costo;

        return (
          <Box sx={{ mt: "10px" }}>
            {`$ ${ganancia.toLocaleString("es-AR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`}
          </Box>
        );
      },
    },
    {
      field: "margen",
      headerName: "Margen %",
      width: 110,
      renderCell: (params) => {
        const costo = Number(params.row?.precio_costo || 0);
        const venta = Number(params.row?.precio || 0);

        if (!costo || venta <= 0) {
          return <Box sx={{ mt: "10px" }}>0%</Box>;
        }

        const margen = ((venta - costo) / costo) * 100;

        return <Box sx={{ mt: "10px" }}>{margen.toFixed(1)}%</Box>;
      },
    },
    {
      field: "precio",
      headerName: "Precio",
      width: 130,
      renderCell: (params) => (
        <Box sx={{ mt: "10px" }}>
          {`$ ${Number(params.row?.precio || 0).toLocaleString("es-AR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
        </Box>
      ),
    },
    {
      field: "familia",
      headerName: "Familia",
      width: 170,
      renderCell: (params) => (
        <Box sx={{ mt: "8px" }}>
          <Chip
            label={params.row?.familias?.nombre || "Sin familia"}
            color="primary"
            size="small"
            variant="outlined"
          />
        </Box>
      ),
    },
    {
      field: "acciones",
      headerName: "Acciones",
      width: 110,
      sortable: false,
      filterable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        return (
          <Box sx={{ mt: "6px" }}>
            {/* Editar */}
            <IconButton
              color="primary"
              size="small"
              onClick={() => editarArticulo(params.row)}
            >
              <EditIcon fontSize="small" />
            </IconButton>

            {/* Eliminar */}
            <IconButton
              color="error"
              size="small"
              onClick={() => eliminarArticulo(params.row)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>

            {/* Ver Foto */}
            <IconButton
              size="small"
              color="primary"
              onClick={() => abrirFoto(params.row.imagen_url)}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Box>
        );
      },
    },
  ];

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        p: 1.5,
        backgroundColor: "#f7f7f7",
      }}
    >
      <Paper
        elevation={3}
        sx={{
          minHeight: "calc(100vh - 24px)",
          display: "flex",
          flexDirection: "column",
          p: 2,
          borderRadius: 3,
          gap: 2,
        }}
      >
        <Typography
          variant="h6"
          align="center"
          sx={{ fontWeight: 700, fontSize: 20 }}
        >
          Carga de Artículos
        </Typography>

        <Notificaciones
          open={open}
          mensaje={mensaje}
          tipo={tipo}
          onClose={() => setOpen(false)}
        />

        <Box
          component="form"
          onSubmit={guardarArticulos}
          sx={{
            border: "1px solid #e0e0e0",
            borderRadius: 3,
            p: 2,
            backgroundColor: "#fafafa",
          }}
        >
          <Grid container spacing={2}>
            {/*Fila 1*/}
            <Grid size={{ xs: 12, md: 2 }}>
              <TextField
                label="Código"
                fullWidth
                size="small"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Automático si queda vacío"
                autoFocus
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Artículo"
                fullWidth
                size="small"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 2 }}>
              <TextField
                label="Stock"
                fullWidth
                size="small"
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
              />
            </Grid>
            <Grid>
              <TextField
                label="Stock Minimo"
                fullWidth
                size="small"
                type="number"
                value={stockMinimo}
                onChange={(e) => setStockMinimo(e.target.value)}
              />
            </Grid>
            {/*Fila 2*/}
            <Grid size={{ xs: 12, md: 4 }}>
              <InputPrecio
                value={precioCosto}
                onChange={manejarCambioCosto}
                size="small"
                label="Costo"
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Margen %"
                fullWidth
                size="small"
                type="number"
                value={margen}
                onChange={(e) => manejarCambioMargen(e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <InputPrecio
                value={precio}
                onChange={setPrecio}
                size="small"
                label="Precio Venta"
              />
            </Grid>
            {/*Fila 3*/}
            <Grid size={{ xs: 12, md: 4 }}>
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

            <Grid size={{ xs: 12, md: 4 }}>
              <Button
                component="label"
                variant="outlined"
                fullWidth
                sx={{
                  height: 40,
                  textTransform: "none",
                  justifyContent: "center",
                }}
              >
                {archivoImagen || fotoActual
                  ? "Cambiar foto"
                  : "Seleccionar foto"}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={manejarImagen}
                />
              </Button>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  height: "100%",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={!nombre || !familiaId || !precio}
                  sx={{
                    height: 40,
                    minWidth: 140,
                    textTransform: "none",
                    flexGrow: 1,
                  }}
                >
                  {editando ? "Actualizar" : "Guardar"}
                </Button>

                {editando && (
                  <Button
                    type="button"
                    variant="outlined"
                    color="inherit"
                    onClick={cancelarEdicion}
                    sx={{
                      height: 40,
                      minWidth: 120,
                      textTransform: "none",
                      flexGrow: 1,
                    }}
                  >
                    Cancelar
                  </Button>
                )}
              </Box>
            </Grid>

            {(previewUrl || fotoActual) && (
              <Grid size={{ xs: 12 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                    p: 1.5,
                    border: "1px solid #ddd",
                    borderRadius: 2,
                    backgroundColor: "#fff",
                    flexWrap: "wrap",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box
                      component="img"
                      src={previewUrl || obtenerUrlImagen(fotoActual)}
                      alt="preview"
                      sx={{
                        width: 72,
                        height: 72,
                        objectFit: "cover",
                        borderRadius: 2,
                        border: "1px solid #ccc",
                      }}
                    />

                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary" }}
                    >
                      Vista previa de la imagen seleccionada
                    </Typography>
                  </Box>

                  <Button
                    color="error"
                    size="small"
                    startIcon={<CancelIcon />}
                    onClick={() => {
                      if (previewUrl && previewUrl.startsWith("blob:")) {
                        URL.revokeObjectURL(previewUrl);
                      }
                      setArchivoImagen(null);
                      setPreviewUrl("");
                      setFotoActual("");
                    }}
                    sx={{ textTransform: "none" }}
                  >
                    Quitar foto
                  </Button>
                </Box>
              </Grid>
            )}
          </Grid>

          {error && (
            <Typography color="error" sx={{ mt: 1.5, fontSize: 13 }}>
              {error}
            </Typography>
          )}
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            gap: 1,
            mb: 1,
          }}
        >
          {/*Buscador*/}
          <TextField
            label="Buscar Articulo"
            size="small"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            sx={{ width: 250 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />

          {/*Filtro*/}
          <TextField
            select
            label="Filtrar Stock"
            size="small"
            value={filtroStock}
            onChange={(e) => setFiltroStock(e.target.value)}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="todos">Todos</MenuItem>
            <MenuItem value="bajo-stock">Bajo Stock</MenuItem>
            <MenuItem value="sin-stock">Sin Stock</MenuItem>
          </TextField>
        </Box>
        <Box sx={{ flexGrow: 1, minHeight: 350 }}>
          <DataGrid
            rows={articulosFiltrados}
            columns={columnas}
            rowHeight={60}
            pageSizeOptions={[5, 10, 20]}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 5, page: 0 },
              },
            }}
            disableRowSelectionOnClick
            density="compact"
            getRowClassName={(params) => {
              const stock = Number(params.row?.stock || 0);
              const minimo = Number(params.row?.stock_minimo || 0);

              if (stock === 0) {
                return "fila-sin-stock";
              } else if (stock > 0 && stock <= minimo) {
                return "fila-bajo-stock";
              }

              return "";
            }}
            sx={{
              backgroundColor: "#fff",
              borderRadius: 2,
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: "#f3f3f3",
                fontSize: 13,
                fontWeight: 700,
              },
              "& .MuiDataGrid-cell": {
                fontSize: 12,
              },
              "& .fila-bajo-stock": {
                backgroundColor: "#fff8e1",
              },
              "& .fila-sin-stock": {
                backgroundColor: "#ffebee",
              },
              "& .fila-bajo-stock:hover": {
                backgroundColor: "#ffefc2",
              },
              "& .fila-sin-stock:hover": {
                backgroundColor: "#ffcdd2",
              },
            }}
          />
          <ModalImagen
            open={openFoto}
            onClose={cerrarFoto}
            imagen={fotoSeleccionada}
          />
        </Box>
      </Paper>
    </Box>
  );
}
