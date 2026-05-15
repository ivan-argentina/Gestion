import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../hook/supabaseClient";

import {
  Autocomplete,
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Button,
} from "@mui/material";

import { DataGrid } from "@mui/x-data-grid";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SearchIcon from "@mui/icons-material/Search";
import SaveIcon from "@mui/icons-material/Save";
import DeleteIcon from "@mui/icons-material/Delete";

export default function Compra() {
  const drawerWidth = 240;
  const inputArticuloRef = useRef(null);
  const Compra = useRef(null);
  const [proveedores, setProveedores] = useState([]);
  const [articulos, setArticulos] = useState([]);

  const [proveedorId, setProveedorId] = useState("");
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);

  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [formaPago, setFormaPago] = useState("Contado");
  const [medioPago, setMedioPago] = useState("efectivo");
  const [tipoComprobante, setTipoComprobante] = useState("factura");
  const [letraComprobante, setLetraComprobante] = useState("A");
  const [numeroComprobante, setNumeroComprobante] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const [articuloSeleccionado, setArticuloSeleccionado] = useState(null);
  const [inputArticulo, setInputArticulo] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [precio, setPrecio] = useState("");
  const [detalle, setDetalle] = useState([]);

  const [openFoto, setOpenFoto] = useState(false);
  const [fotoSeleccionada, setFotoSeleccionada] = useState("");
  const [puntoVenta, setPuntoVenta] = useState("1");

  const totalCompra = useMemo(() => {
    return detalle.reduce((acc, item) => acc + Number(item.subtotal || 0), 0);
  }, [detalle]);

  const formatoNumero = (valor) =>
    new Intl.NumberFormat("es-AR").format(Number(valor || 0));

  const cargarProveedores = async () => {
    const { data, error } = await supabase
      .from("proveedores")
      .select(
        `
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
      `,
      )
      .order("nombre", { ascending: true });

    if (error) {
      console.error("Error al cargar el proveedor", error);
      return;
    }
    setProveedores(data || []);
  };

  const cargarArticulos = async () => {
    const { data, error } = await supabase
      .from("articulos")
      .select("*")
      .order("descripcion", { ascending: true });

    if (error) {
      console.error("Error al cargar articulos", error);
      return;
    }
    setArticulos(data || []);
  };
  useEffect(() => {
    cargarProveedores();
    cargarArticulos();
  }, []);

  const manejarProveedor = (id) => {
    setProveedorId(id);
    const proveedor = proveedores.find((p) => String(p.id) === String(id));
    setProveedorSeleccionado(proveedor || null);
  };
  const buscarPorCodigoODescripcion = (texto) => {
    const valor = texto.toLowerCase().trim();

    return articulos.find((a) => {
      const codigo = String(a.codigo || "").toLowerCase();
      const descripcion = String(a.descripcion || "").toLowerCase();

      return codigo === valor || descripcion.includes(valor);
    });
  };

  const seleccionarArticulo = (articulo) => {
    setArticuloSeleccionado(articulo);
    setInputArticulo(articulo.descripcion || "");

    const precioCompra =
      articulo.precio_Compra ?? articulo.precio_Costo ?? articulo.precio ?? 0;

    setPrecio(precioCompra);
    setCantidad("1");
  };

  const agregarDetalle = () => {
    if (!articuloSeleccionado) {
      alert("Seleccione un articulo");
      return;
    }
    if (!cantidad || Number(cantidad) <= 0) {
      alert("Ingrese una cantidad valida");
      return;
    }

    if (!precio || Number(precio) <= 0) {
      alert("Ingrese un precio valida");
      return;
    }
    const subtotal = Number(cantidad) * Number(precio);

    const nuevoItem = {
      id: Date.now(),
      idarticulo: articuloSeleccionado.id,
      codigo: articuloSeleccionado.codigo || "",
      descripcion: articuloSeleccionado.descripcion || "",
      cantidad: Number(cantidad),
      precio: Number(precio),
      subtotal,
    };
    setDetalle((prev) => [...prev, nuevoItem]);

    setArticuloSeleccionado(null);
    setInputArticulo("");
    setCantidad("");
    setPrecio("");

    setTimeout(() => {
      inputArticuloRef.current?.focus();
    }, 100);
  };
  const eliminarDetalle = (id) => {
    setDetalle((prev) => prev.filter((item) => item.id !== id));
  };
  const guardarCompra = async () => {
    if (!proveedorId) {
      alert("Seleccione un proveedor");
      return;
    }
    if (detalle.length === 0) {
      alert("Agregue al menos un Articulo");
      return;
    }
    const compraNueva = {
      fecha,
      idproveedor: proveedorId,
      tipo_comprobante: tipoComprobante,
      letra_comprobante: letraComprobante,
      punto_venta: puntoVenta,
      numero_comprobante: numeroComprobante,
      forma_pago: formaPago,
      medio_pago: medioPago,
      observaciones,
      subtotal: totalCompra,
      total: totalCompra,
      saldo: formaPago === "Cuenta corriente" ? totalCompra : 0,
      estado_pago: formaPago === "Cuenta corriente" ? "pendiente" : "pagada",
    };
    const { data: compraGuardada, errorCompra } = await supabase
      .from("compras")
      .insert([compraNueva])
      .select()
      .single();

    if (errorCompra) {
      console.error("ERROR COMPLETO:", errorCompra);
      alert(errorCompra.message);
      return;
    }
    const detalleCompra = detalle.map((item) => ({
      idcompra: compraGuardada.id,
      idarticulo: item.idarticulo,
      cantidad: item.cantidad,
      precio: item.precio,
      subtotal: item.subtotal,
    }));

    const { error: errorDetalle } = await supabase
      .from("detalle_compras")
      .insert(detalleCompra);

    if (errorDetalle) {
      console.error("Error al guardar el detalle", errorDetalle);
      alert("La compra se guardo, pero hubo un error en el detalle");
      return;
    }

    for (const item of detalle) {
      const articulo = articulos.find((a) => a.id === item.idarticulo);
      const stockActual = Number(articulo?.stock || 0);
      const nuevoStock = stockActual + Number(item.cantidad);

      const { error: errorStock } = await supabase
        .from("articulos")
        .update({ stock: nuevoStock })
        .eq("id", item.idarticulo);

      if (errorStock) {
        console.error("Error al actualizar el stock", errorStock);
      }
    }
    alert("Compra guardada correctamente");

    setProveedorId("");
    setProveedorSeleccionado(null);
    setFormaPago("Contado");
    setMedioPago("Efectivo");
    setTipoComprobante("factura");
    setLetraComprobante("A");
    setNumeroComprobante("");
    setObservaciones("");
    setDetalle([]);
    await cargarArticulos();
  };

  const columnasDetalle = [
    { field: "codigo", heardName: "Codigo", width: 120 },
    { field: "descripcion", heardName: "Articulo", flex: 1 },
    {
      field: "cantidad",
      heardName: "Cantidad",
      width: 110,
      align: "right",
      headerAlign: "right",
    },
    {
      field: "precio",
      heardName: "precio",
      width: 130,
      algin: "right",
      headerAlign: "right",
      valueFormatter: (value) => `$ ${formatoNumero(value)}`,
    },
    {
      field: "subtotal",
      heardName: "Subtotal",
      width: 140,
      align: "right",
      headerAlign: "right",
      valueFormatter: (value) => `$ ${formatoNumero(value)}`,
    },
    {
      field: "eliminar",
      headerName: "",
      width: 70,
      sortable: false,
      renderCell: (params) => (
        <IconButton
          color="error"
          onClick={() => eliminarDetalle(params.row.id)}
        >
          <DeleteIcon />
        </IconButton>
      ),
    },
  ];

  return (
    <Box
      sx={{
        p: 1,
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          borderRadius: 2,
          mb: 2,
          flesShrink: 0,
        }}
      >
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              select
              label="Proveedor"
              fullWidth
              size="small"
              value={proveedorId}
              onChange={(e) => manejarProveedor(e.target.value)}
            >
              {proveedores.map((p) => (
                <MenuItem key={p.id} value={String(p.id)}>
                  {p.nombre}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <TextField
              type="date"
              label="Fecha"
              fullWidth
              size="small"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 2 }}>
            <TextField
              select
              label="Forma de pago"
              fullWidth
              size="small"
              value={formaPago}
              onChange={(e) => setFormaPago(e.target.value)}
            >
              <MenuItem value="Contado">Contado</MenuItem>
              <MenuItem value="Cuenta corriente">Cuenta corriente</MenuItem>
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, md: 2 }}>
            <TextField
              select
              label="Medio de pago"
              fullWidth
              size="small"
              value={medioPago}
              onChange={(e) => setMedioPago(e.target.value)}
              disabled={formaPago !== "Contado"}
            >
              <MenuItem value="efectivo">Efectivo</MenuItem>
              <MenuItem value="debito">Debito</MenuItem>
              <MenuItem value="credito">Credito</MenuItem>
              <MenuItem value="transferencia">transferencia</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ sx: 12, md: 2 }}>
            <TextField
              select
              label="Comprobante"
              fullWidth
              size="small"
              value={tipoComprobante}
              onChange={(e) => setTipoComprobante(e.target.value)}
            >
              <MenuItem value="factura">Factura</MenuItem>
              <MenuItem value="nota_de_credito">Nota de credito</MenuItem>
              <MenuItem value="remito">Remito</MenuItem>
              <MenuItem value="ticket">Ticket</MenuItem>
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, md: 1.5 }}>
            <TextField
              label="Pto.Venta"
              fullWidth
              size="small"
              value={puntoVenta}
              onChange={(e) => setPuntoVenta(e.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 2 }}>
            <TextField
              label="N° Comprobante"
              fullWidth
              size="small"
              value={numeroComprobante}
              onChange={(e) => setNumeroComprobante(e.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: "#fafafa",
              }}
            >
              <Grid container spacing={1}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="body2">
                    <strong>Direccion:</strong>
                    {""}
                    {proveedorSeleccionado?.direccion || "-"}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="body2">
                    <strong>Ciudad:</strong>
                    {""}
                    {proveedorSeleccionado?.ciudades?.nombre || "-"}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="body2">
                    <strong>Condicion Iva:</strong>
                    {""}
                    {proveedorSeleccionado?.condicion_iva?.descripcion || "-"}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="body2">
                    <strong>Cuit:</strong>
                    {""}
                    {proveedorSeleccionado?.cuit || "-"}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="body2">
                    <strong>Telefono:</strong>
                    {""}
                    {proveedorSeleccionado?.telefono || "-"}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="body2">
                    <strong>Email:</strong>
                    {""}
                    {proveedorSeleccionado?.email || "-"}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      <Paper
        variant="outlined"
        sx={{
          flex: 1,
          minHeight: 0,
          borderRadius: 2,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          pb: "110px",
        }}
      >
        <Box
          sx={{
            p: 2,
            flexShrink: 0,
            borderBotom: "1px solid #e0e0e0",
            backgroundColor: "#fafafa",
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 5 }}>
              <Autocomplete
                options={articulos || []}
                size="small"
                fullWidth
                value={articuloSeleccionado}
                inputValue={inputArticulo}
                onInputChange={(event, newInputValue) => {
                  setInputArticulo(newInputValue);
                }}
                onChange={(event, newValue) => {
                  if (newValue) seleccionarArticulo(newValue);
                }}
                getOptionLabel={(option) => option?.descripcion || ""}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                filterOptions={(options, state) => {
                  const texto = state.inputValue.toLowerCase().trim();

                  return options.filter((option) => {
                    const codigo = String(option.codigo || "").toLowerCase();
                    const descripcion = String(
                      option.descripcion || "",
                    ).toLowerCase();

                    return (
                      codigo.includes(texto) || descripcion.includes(texto)
                    );
                  });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    inputRef={inputArticuloRef}
                    label="Artículo o código de barras"
                    fullWidth
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();

                        const texto = inputArticulo.trim();
                        if (!texto) return;

                        const articulo = buscarPorCodigoODescripcion(texto);

                        if (articulo) {
                          seleccionarArticulo(articulo);
                        } else {
                          alert("Artículo no encontrado");
                        }
                      }
                    }}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4, md: 1.5 }}>
              <TextField
                label="Cantidad"
                type="number"
                fullWidth
                size="small"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4, md: 2 }}>
              <TextField
                label="Precio Compra"
                type="number"
                fullWidth
                size="small"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4, md: 2 }}>
              <TextField
                label="Subtotal"
                fullWidth
                size="small"
                value={formatoNumero(
                  Number(cantidad || 0) * Number(precio || 0),
                )}
                inputProps={{ readOnly: true }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 1.5 }}>
              <Button
                fullWidth
                variant="contained"
                onClick={agregarDetalle}
                sx={{ height: 40 }}
              >
                Agregar
              </Button>
            </Grid>
          </Grid>
        </Box>
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            px: 2,
            pb: 2,
          }}
        >
          <DataGrid
            rows={detalle}
            columns={columnasDetalle}
            hideFooter
            disableRowSelectionOnClick
            rowHeight={44}
            sx={{
              height: "100%",
              border: 0,
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: "#f5f5f5",
                fontWeight: 600,
                minHeight: "40px !important",
                maxHeight: "40px !important",
              },
              "& .MuiDataGrid-cell": {
                display: "flex",
                alignItems: "center",
              },
            }}
            localeText={{ noRowsLabel: "No hay Articulos cargados" }}
          />
        </Box>
      </Paper>
      <Paper
        variant="outlined"
        sx={{
          position: "fixed",
          bottom: 0,
          left: { xs: 0, md: `${drawerWidth}px` },
          width: { xs: "100%", md: `calc(100% - ${drawerWidth}px)` },
          bgColor: "background.paper",
          borderTop: "1px solid #ddd",
          borderRadius: 0,
          p: 2,
          minHeight: "90px",
          zIndex: 1000,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ flex: 1, minWidth: 260 }}>
            <TextField
              label="Observaciones"
              fullWidth
              multiline
              rows={2}
              size="small"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Opcional"
            />
          </Box>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Button
              variant="contained"
              color="success"
              startIcon={<SaveIcon />}
              onClick={guardarCompra}
            >
              Guardar Compra
            </Button>
          </Box>

          <Box sx={{ minWidth: 180, textAlign: "right" }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Total: ${formatoNumero(totalCompra)}
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
