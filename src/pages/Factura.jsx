import { useRef, useEffect, useState } from "react";
import { supabase } from "../hook/supabaseClient";

import {
  Grid,
  MenuItem,
  TextField,
  Button,
  Typography,
  Box,
  IconButton,
  Paper,
} from "@mui/material";

import { DataGrid } from "@mui/x-data-grid";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";

import GenerarPdf from "../componentes/GenerarPdf";
import { generarpdfU } from "../utils/generarpdfu";

export default function Factura() {
  const [clientes, setClientes] = useState([]);
  const [articulos, setArticulos] = useState([]);
  const [clienteId, setClienteId] = useState("");
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [tipoComprobante, setTipoComprobante] = useState("X");
  const [formaPago, setFormaPago] = useState("Contado");
  const [observaciones, setObservaciones] = useState("");
  const [articuloId, setArticuloId] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [precio, setPrecio] = useState("");
  const [detalle, setDetalle] = useState([]);
  const [numeroFactura, setNumeroFactura] = useState("");
  const [pdfData, setPdfData] = useState(null);
  const drawerWidth = 200;

  const facturaPdfRef = useRef();

  // 🔹 CARGAR CLIENTES
  const cargarClientes = async () => {
    const { data, error } = await supabase
      .from("clientes")
      .select(
        `
        id,
        nombre,
        direccion,
        cuit,
        telefono,
        ciudades ( nombre )
      `,
      )
      .order("nombre");

    if (error) {
      console.log(error);
      return;
    }

    setClientes(data);
  };

  // 🔹 CARGAR ARTICULOS
  const cargarArticulos = async () => {
    const { data, error } = await supabase
      .from("articulos")
      .select("*")
      .order("nombre");

    if (error) {
      console.log(error);
      return;
    }

    setArticulos(data);
  };

  // 🔹 CLIENTE
  const manejarCliente = (id) => {
    setClienteId(id);

    const cli = clientes.find((c) => c.id === id);
    setClienteSeleccionado(cli || null);
  };

  // 🔹 ARTICULO
  const manejarArticulos = (id) => {
    setArticuloId(id);

    const art = articulos.find((a) => a.id === id);
    if (art) {
      setPrecio(art.precio);
    }
  };

  // 🔹 AGREGAR DETALLE
  const agregarDetalle = () => {
    if (!articuloId || !cantidad || !precio) return;

    const art = articulos.find((a) => a.id === articuloId);
    if (!art) return;

    const nuevoItem = {
      id: Date.now(),
      idarticulo: art.id,
      articulo: art.nombre,
      cantidad: Number(cantidad),
      precio: Number(precio),
      subtotal: Number(cantidad) * Number(precio),
    };

    setDetalle((prev) => [...prev, nuevoItem]);

    setArticuloId("");
    setCantidad(1);
    setPrecio("");
  };

  // 🔹 ELIMINAR DETALLE
  const eliminarDetalle = (id) => {
    setDetalle(detalle.filter((item) => item.id !== id));
  };

  const totalFactura = detalle.reduce((acc, item) => acc + item.subtotal, 0);

  // 🔹 GUARDAR FACTURA
  const guardarFactura = async () => {
    if (!clienteId) {
      alert("Seleccione un cliente");
      return;
    }

    if (detalle.length === 0) {
      alert("Agregue al menos un artículo");
      return;
    }

    const totalCalc = detalle.reduce(
      (acc, item) => acc + Number(item.subtotal || 0),
      0,
    );

    const facturaNueva = {
      fecha,
      idcliente: clienteId,
      tipo_comprobante: tipoComprobante,
      forma_pago: formaPago,
      observaciones: observaciones || "",
      subtotal: totalCalc,
      total: totalCalc,
      saldo: formaPago === "Cuenta corriente" ? totalCalc : 0,
      estado_pago: formaPago === "Cuenta corriente" ? "pendiente" : "pagada",
    };

    const { data, error } = await supabase
      .from("facturas")
      .insert([facturaNueva])
      .select()
      .single();

    if (error) {
      console.error(error);
      alert("Error al guardar factura");
      return;
    }

    const facturaId = data.id;
    const numeroGenerado = data.numero;

    const detalleInsert = detalle.map((item) => ({
      idfactura: facturaId,
      idarticulo: item.idarticulo,
      cantidad: Number(item.cantidad),
      precio: Number(item.precio),
      subtotal: Number(item.subtotal),
    }));

    const { error: errorDetalle } = await supabase
      .from("factura_detalle")
      .insert(detalleInsert);

    if (errorDetalle) {
      console.log(errorDetalle);
      alert("Error al guardar detalle");
      return;
    }

    setNumeroFactura(numeroGenerado);
    const datosPdf = {
      numeroFactura: numeroGenerado,
      fecha,
      tipoComprobante,
      formaPago,
      clienteSeleccionado,
      detalle,
      totalFactura: totalCalc,
      observaciones,
      puntoVenta: 1,
    };
    setPdfData(datosPdf);

    setTimeout(() => {
      generarpdfU(facturaPdfRef.current, `factura-${numeroGenerado}.pdf`);
    }, 800);

    // RESET
    setClienteId("");
    setClienteSeleccionado(null);
    setFecha(new Date().toISOString().slice(0, 10));
    setTipoComprobante("X");
    setFormaPago("Contado");
    setObservaciones("");
    setArticuloId("");
    setCantidad(1);
    setPrecio("");
    setDetalle([]);
  };

  // 🔹 INIT
  useEffect(() => {
    const init = async () => {
      try {
        cargarClientes();
        cargarArticulos();
      } catch (error) {
        console.log("Error al cargar los datos", error);
      }
    };
    init();
  }, []);

  // 🔹 GRID
  const columnasDetalle = [
    { field: "articulo", headerName: "Artículo", flex: 1 },
    {
      field: "cantidad",
      headerName: "Cantidad",
      width: 100,
      align: "right",
    },
    {
      field: "precio",
      headerName: "Precio",
      width: 120,
      align: "right",
      renderCell: (params) =>
        `$ ${new Intl.NumberFormat("es-AR").format(
          Number(params.row.precio) || 0,
        )}`,
    },
    {
      field: "subtotal",
      headerName: "Subtotal",
      width: 130,
      align: "right",
      renderCell: (params) =>
        `$ ${new Intl.NumberFormat("es-AR").format(
          (Number(params.row.cantidad) || 0) * (Number(params.row.precio) || 0),
        )}`,
    },
    {
      field: "acciones",
      headerName: "Acciones",
      width: 100,
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
      {/* PAPER SUPERIOR */}
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          borderRadius: 2,
          mb: 2,
          flexShrink: 0,
        }}
      >
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 8 }}>
            <TextField
              select
              label="Cliente"
              fullWidth
              size="small"
              value={clienteId}
              onChange={(e) => manejarCliente(e.target.value)}
            >
              {clientes.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.nombre}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
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
              <MenuItem value="Transferencia">Transferencia</MenuItem>
            </TextField>
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
                    <strong>Dirección:</strong>{" "}
                    {clienteSeleccionado?.direccion || "-"}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="body2">
                    <strong>Ciudad:</strong>{" "}
                    {clienteSeleccionado?.ciudades?.nombre || "-"}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="body2">
                    <strong>CUIT:</strong> {clienteSeleccionado?.cuit || "-"}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      {/* PAPER CENTRAL */}
      <Paper
        variant="outlined"
        sx={{
          flex: 1,
          minHeight: 0,
          borderRadius: 2,
          mb: 12,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* BLOQUE CARGA ARTICULO */}
        <Box sx={{ p: 2, flexShrink: 0 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 5 }}>
              <TextField
                select
                label="Artículo"
                fullWidth
                size="small"
                value={articuloId}
                onChange={(e) => manejarArticulos(e.target.value)}
              >
                {articulos.map((a) => (
                  <MenuItem key={a.id} value={a.id}>
                    {a.nombre}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, md: 1.5 }}>
              <TextField
                label="Cantidad"
                type="number"
                fullWidth
                size="small"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 2 }}>
              <TextField
                label="Precio"
                type="number"
                fullWidth
                size="small"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 2 }}>
              <TextField
                label="Subtotal"
                fullWidth
                size="small"
                value={new Intl.NumberFormat("es-AR").format(
                  Number(cantidad || 0) * Number(precio || 0),
                )}
                InputProps={{ readOnly: true }}
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

        {/* GRID */}
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
            autoHeight
            disableRowSelectionOnClick
            rowHeight={44}
            sx={{
              height: "100%",
              border: 0,
              "& .MuiDataGrid-columnHeaders": {
                display: "none",
              },
              "& .MuiDataGrid-virtualScroller": {
                marginTop: "0px !important",
              },
            }}
            localeText={{
              noRowsLabel: "No hay artículos cargados",
            }}
          />
        </Box>
      </Paper>

      {/* PAPER FOOTER */}
      <Paper
        variant="outlined"
        sx={{
          position: "fixed",
          bottom: 0,
          left: { xs: 0, md: `${drawerWidth}px` },
          width: { xs: "100%", md: `calc(100% - ${drawerWidth}px)` },
          bgcolor: "background.paper",
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
          }}
        >
          <Box sx={{ flex: 1 }}>
            <TextField
              label="Observaciones"
              fullWidth
              multiline
              size="small"
              maxRows={2}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
            />
          </Box>

          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Button
              variant="contained"
              color="success"
              startIcon={<SaveIcon />}
              onClick={guardarFactura}
            >
              Guardar
            </Button>
          </Box>

          <Box sx={{ minWidth: 180, textAlign: "right" }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Total: ${new Intl.NumberFormat("es-AR").format(totalFactura)}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {pdfData && (
        <div style={{ position: "absolute", left: "-9999px" }}>
          <GenerarPdf
            ref={facturaPdfRef}
            numeroFactura={pdfData.numeroFactura}
            fecha={pdfData.fecha}
            tipoComprobante={pdfData.tipoComprobante}
            formaPago={pdfData.formaPago}
            clienteSeleccionado={pdfData.clienteSeleccionado}
            detalle={pdfData.detalle}
            totalFactura={pdfData.totalFactura}
            observaciones={pdfData.observaciones}
            puntoVenta={pdfData.puntoVenta}
          />
        </div>
      )}
    </Box>
  );
}
