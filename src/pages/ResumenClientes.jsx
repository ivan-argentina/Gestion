import { useEffect, useMemo, useRef, useState } from "react";
import {
  Chip,
  IconButton,
  Autocomplete,
  Box,
  Button,
  Grid,
  Paper,
  TextField,
  Typography,
  DialogTitle,
  DialogContent,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Table,
  Dialog,
  MenuItem,
} from "@mui/material";

import VisibilityIcon from "@mui/icons-material/Visibility";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import CloseIcon from "@mui/icons-material/Close";
import PrintIcon from "@mui/icons-material/Print";

import { DataGrid } from "@mui/x-data-grid";
import { supabase } from "../hook/supabaseClient";
import GenerarPdf from "../componentes/GenerarPdf";
import { generarpdfU } from "../utils/generarpdfu";

export default function ResumenClientes() {
  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [clienteId, setClienteId] = useState("");

  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  const [facturas, setFacturas] = useState([]);
  const [pagos, setPagos] = useState([]);

  const [loadingClientes, setLoadingClientes] = useState(false);
  const [loadingFacturas, setLoadingFacturas] = useState(false);
  const [loadingPagos, setLoadingPagos] = useState(false);

  const [error, setError] = useState("");

  const [detalleFactura, setDetalleFactura] = useState([]);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
  const [openDetalle, setOpenDetalle] = useState(false);

  const [openPago, setOpenPago] = useState(false);
  const [facturasPendientes, setFacturasPendientes] = useState([]);
  const [importeRecibido, setImporteRecibido] = useState("");
  const [formaPago, setFormaPago] = useState("Efectivo");
  const [observaciones, setObservaciones] = useState("");
  const [guardandoPago, setGuardandoPago] = useState(false);

  const facturaPdfRef = useRef();

  useEffect(() => {
    cargarClientes();
  }, []);

  useEffect(() => {
    if (openPago && clienteId) {
      cargarFacturasPendientes(clienteId);
    }
  }, [openPago, clienteId]);

  const cargarClientes = async () => {
    setLoadingClientes(true);
    setError("");

    const { data, error } = await supabase
      .from("clientes")
      .select("id, nombre")
      .order("nombre", { ascending: true });

    if (error) {
      console.log("Error al cargar clientes:", error);
      setError("No se pudieron cargar los clientes.");
      setClientes([]);
      setLoadingClientes(false);
      return;
    }

    setClientes(data || []);
    setLoadingClientes(false);
  };

  const cargarPagos = async (idClienteParam) => {
    const id = idClienteParam || clienteId;
    if (!id) return;

    setLoadingPagos(true);

    const { data, error } = await supabase
      .from("Pagos_Clientes")
      .select("id, fecha, importe, forma_pago, observaciones")
      .eq("idCliente", String(id))
      .order("fecha", { ascending: false });

    if (error) {
      console.log("Error al cargar pagos:", error);
      setPagos([]);
      setLoadingPagos(false);
      return;
    }

    setPagos(data || []);
    setLoadingPagos(false);
  };

  const cargarFacturasPendientes = async (idClienteParam) => {
    if (!idClienteParam) return;

    const { data, error } = await supabase
      .from("facturas")
      .select("id, fecha, numero, tipo_comprobante, total, saldo, estado_pago")
      .eq("idcliente", idClienteParam)
      .gt("saldo", 0)
      .order("fecha", { ascending: true });

    if (error) {
      console.log("Error al cargar facturas pendientes:", error);
      setFacturasPendientes([]);
      return;
    }

    const facturasConPago = (data || []).map((f) => ({
      ...f,
      pagar: 0,
    }));

    setFacturasPendientes(facturasConPago);
  };

  const buscarResumen = async () => {
    setError("");

    if (!clienteSeleccionado) {
      setError("Tenés que seleccionar un cliente.");
      return;
    }

    if (!fechaDesde || !fechaHasta) {
      setError("Tenés que ingresar fecha desde y fecha hasta.");
      return;
    }

    if (fechaDesde > fechaHasta) {
      setError("La fecha desde no puede ser mayor que la fecha hasta.");
      return;
    }

    setLoadingFacturas(true);

    const { data, error } = await supabase
      .from("facturas")
      .select(
        "id, fecha, numero, tipo_comprobante, total, saldo, forma_pago, estado_pago, observaciones",
      )
      .eq("idcliente", clienteSeleccionado.id)
      .gte("fecha", fechaDesde)
      .lte("fecha", fechaHasta)
      .order("fecha", { ascending: true });

    if (error) {
      console.log("Error al buscar facturas:", error);
      setError("No se pudieron cargar las facturas.");
      setFacturas([]);
      setPagos([]);
      setLoadingFacturas(false);
      return;
    }

    setFacturas(data || []);
    await cargarPagos(clienteSeleccionado.id);
    setLoadingFacturas(false);
  };

  const aplicarPagoAutomatico = () => {
    let restante = Number(importeRecibido || 0);

    const actualizadas = facturasPendientes.map((factura) => {
      const saldo = Number(factura.saldo || 0);

      if (restante <= 0) {
        return { ...factura, pagar: 0 };
      }

      const aplicado = Math.min(restante, saldo);
      restante -= aplicado;

      return {
        ...factura,
        pagar: aplicado,
      };
    });

    setFacturasPendientes(actualizadas);
  };

  const manejarPagoFactura = (idfactura, valor) => {
    const numero = Number(valor || 0);

    setFacturasPendientes((prev) =>
      prev.map((f) =>
        f.id === idfactura
          ? {
              ...f,
              pagar: Math.min(Math.max(numero, 0), Number(f.saldo || 0)),
            }
          : f,
      ),
    );
  };

  const totalAplicado = facturasPendientes.reduce(
    (acc, item) => acc + Number(item.pagar || 0),
    0,
  );

  const guardarPago = async () => {
    if (!clienteId) {
      setError("Tenés que seleccionar un cliente.");
      return;
    }

    const recibido = Number(importeRecibido || 0);

    if (recibido <= 0) {
      setError("Ingresá un importe recibido válido.");
      return;
    }

    const detallesAplicados = facturasPendientes.filter(
      (f) => Number(f.pagar || 0) > 0,
    );

    if (detallesAplicados.length === 0) {
      setError("No hay importes aplicados a facturas.");
      return;
    }

    if (totalAplicado > recibido) {
      setError("El total aplicado no puede ser mayor al importe recibido.");
      return;
    }

    setGuardandoPago(true);
    setError("");

    try {
      const { data: pagoCreado, error: errorPago } = await supabase
        .from("Pagos_Clientes")
        .insert([
          {
            fecha: new Date().toISOString().split("T")[0],
            idCliente: clienteId,
            importe: recibido,
            forma_pago: formaPago,
            observaciones: observaciones || "",
          },
        ])
        .select()
        .single();

      if (errorPago) throw errorPago;

      const detalleInsert = detallesAplicados.map((item) => ({
        idPago: pagoCreado.id,
        idFactura: item.id,
        importe_aplicado: Number(item.pagar || 0),
      }));

      const { error: errorDetalle } = await supabase
        .from("detal_pagos_clientes")
        .insert(detalleInsert);

      if (errorDetalle) throw errorDetalle;

      for (const item of detallesAplicados) {
        const nuevoSaldo = Number(item.saldo || 0) - Number(item.pagar || 0);

        const { error: errorFactura } = await supabase
          .from("facturas")
          .update({
            saldo: nuevoSaldo,
            estado_pago: nuevoSaldo <= 0 ? "pagada" : "pendiente",
          })
          .eq("id", item.id);

        if (errorFactura) throw errorFactura;
      }

      await cargarFacturasPendientes(clienteId);
      await cargarPagos(clienteId);

      if (clienteSeleccionado && fechaDesde && fechaHasta) {
        await buscarResumen();
      }

      setOpenPago(false);
      setImporteRecibido("");
      setFormaPago("Efectivo");
      setObservaciones("");
      setFacturasPendientes([]);

      alert("Pago guardado correctamente");
    } catch (error) {
      console.log("Error al guardar pago:", error);
      setError(error?.message || error?.details || "Error al guardar el pago.");
    } finally {
      setGuardandoPago(false);
    }
  };

  const verDetalle = async (factura) => {
    setFacturaSeleccionada(factura);

    const { data, error } = await supabase
      .from("factura_detalle")
      .select(
        `
          id,
          cantidad,
          precio,
          subtotal,
          idarticulo,
          articulos:idarticulo ( * )
        `,
      )
      .eq("idfactura", factura.id);

    if (error) {
      console.error("Error al traer el detalle:", error);
      return;
    }

    setDetalleFactura(data || []);
    setOpenDetalle(true);
  };

  const imprimirFactura = async () => {
    await generarpdfU(facturaPdfRef);
  };

  const limpiarFiltros = () => {
    setClienteSeleccionado(null);
    setClienteId("");
    setFechaDesde("");
    setFechaHasta("");
    setFacturas([]);
    setPagos([]);
    setFacturasPendientes([]);
    setImporteRecibido("");
    setFormaPago("Efectivo");
    setObservaciones("");
    setError("");
  };

  const totalFacturado = useMemo(() => {
    return facturas.reduce((acc, item) => acc + Number(item.total || 0), 0);
  }, [facturas]);

  const columnas = [
    {
      field: "fecha",
      headerName: "Fecha",
      width: 110,
    },
    {
      field: "numero",
      headerName: "N°",
      width: 100,
      valueGetter: ({ row }) => row?.numero ?? "",
      valueFormatter: (params) => {
        const num = params.value;

        if (!num) return "-";

        return Number(num).toString().padStart(4, "0");
      },
    },
    {
      field: "tipo_comprobante",
      headerName: "Tipo",
      width: 90,
    },
    {
      field: "total",
      headerName: "Total",
      width: 130,
      valueFormatter: (params) => {
        const valor = params?.value || 0;
        return `$ ${Number(valor).toLocaleString("es-AR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;
      },
    },
    {
      field: "saldo",
      headerName: "Saldo",
      width: 130,
      renderCell: (params) => {
        const saldo = Number(params.value || 0);

        return (
          <Typography
            fontWeight="bold"
            color={saldo > 0 ? "error.main" : "success.main"}
          >
            ${" "}
            {saldo.toLocaleString("es-AR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Typography>
        );
      },
    },
    {
      field: "forma_pago",
      headerName: "Forma de pago",
      width: 150,
    },
    {
      field: "estado_pago",
      headerName: "Estado",
      width: 130,
      renderCell: (params) => {
        const esPendiente = params.value === "pendiente";

        return (
          <Chip
            label={esPendiente ? "Debe" : "Pagado"}
            color={esPendiente ? "error" : "success"}
            size="small"
          />
        );
      },
    },
    {
      field: "acciones",
      headerName: "",
      width: 80,
      sortable: false,
      renderCell: (params) => (
        <IconButton onClick={() => verDetalle(params.row)}>
          <VisibilityIcon />
        </IconButton>
      ),
    },
  ];

  const columnasPagos = [
    {
      field: "fecha",
      headerName: "Fecha",
      width: 120,
    },
    {
      field: "importe",
      headerName: "Importe",
      width: 140,
      valueFormatter: (params) => {
        const importe = Number(params?.value || 0);
        return `$ ${importe.toLocaleString("es-AR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;
      },
    },
    {
      field: "forma_pago",
      headerName: "Forma de pago",
      width: 150,
    },
    {
      field: "observaciones",
      headerName: "Observaciones",
      flex: 1,
      minWidth: 180,
    },
  ];

  return (
    <Box
      sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 2 }}
    >
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Resumen de Clientes
        </Typography>

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Autocomplete
              options={clientes}
              loading={loadingClientes}
              value={clienteSeleccionado}
              onChange={(event, newValue) => {
                setClienteSeleccionado(newValue || null);
                setClienteId(newValue?.id || "");
                setPagos([]);
                setFacturas([]);
              }}
              getOptionLabel={(option) => option?.nombre || ""}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => (
                <TextField {...params} label="Cliente" fullWidth />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 2 }}>
            <TextField
              label="Desde"
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 2 }}>
            <TextField
              label="Hasta"
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={buscarResumen}
                fullWidth
                startIcon={<SearchIcon />}
                sx={{
                  height: 56,
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: "bold",
                }}
              >
                Buscar
              </Button>

              <Button
                variant="contained"
                color="success"
                onClick={() => setOpenPago(true)}
                disabled={!clienteId}
                fullWidth
                startIcon={<SearchIcon />}
                sx={{
                  height: 56,
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: "bold",
                }}
              >
                Pago
              </Button>

              <Button
                variant="text"
                color="inherit"
                onClick={limpiarFiltros}
                fullWidth
                startIcon={<ClearIcon />}
                sx={{
                  height: 56,
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: "bold",
                }}
              >
                Limpiar
              </Button>
            </Box>
          </Grid>
        </Grid>

        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </Paper>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
              Cantidad de facturas: {facturas.length}
            </Typography>

            <Typography fontWeight="bold" sx={{ mb: 1 }}>
              Total facturado: $
              {totalFacturado.toLocaleString("es-AR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Typography>

            <Typography fontWeight="bold" sx={{ mb: 2 }}>
              Total deuda: $
              {facturas
                .reduce((acc, f) => acc + Number(f.saldo || 0), 0)
                .toLocaleString("es-AR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
            </Typography>

            <Box sx={{ width: "100%", height: 600 }}>
              <DataGrid
                rows={facturas || []}
                columns={columnas}
                loading={loadingFacturas}
                disableRowSelectionOnClick
                getRowId={(row) => row.id ?? row.numero}
                initialState={{
                  pagination: {
                    paginationModel: { pageSize: 20, page: 0 },
                  },
                }}
                pageSizeOptions={[10, 20, 50]}
                localeText={{
                  noRowsLabel: "No hay facturas para mostrar",
                }}
                sx={{
                  border: 0,
                  "& .MuiDataGrid-columnHeaders": {
                    fontWeight: "bold",
                  },
                }}
              />
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2, borderRadius: 3, height: "100%" }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
              Pagos realizados
            </Typography>

            <Box sx={{ width: "100%", height: 600 }}>
              <DataGrid
                rows={pagos}
                columns={columnasPagos}
                loading={loadingPagos}
                getRowId={(row) => row.id}
                pageSizeOptions={[10, 20, 50]}
                initialState={{
                  pagination: {
                    paginationModel: { pageSize: 20, page: 0 },
                  },
                }}
                localeText={{
                  noRowsLabel: "No hay pagos para mostrar",
                }}
                sx={{
                  border: 0,
                  "& .MuiDataGrid-columnHeaders": {
                    fontWeight: "bold",
                  },
                }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Dialog
        open={openDetalle}
        onClose={() => setOpenDetalle(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          Número: {facturaSeleccionada?.numero}
          <Box>
            <IconButton onClick={imprimirFactura}>
              <PrintIcon />
            </IconButton>
            <IconButton onClick={() => setOpenDetalle(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Artículo</TableCell>
                <TableCell>Cantidad</TableCell>
                <TableCell>Precio</TableCell>
                <TableCell>Subtotal</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {detalleFactura.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {item.articulo ||
                      item.nombre ||
                      item.articulos?.nombre ||
                      ""}
                  </TableCell>
                  <TableCell>{item.cantidad}</TableCell>
                  <TableCell>${item.precio}</TableCell>
                  <TableCell>${item.subtotal}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Typography sx={{ mt: 2, fontWeight: "bold" }}>
            Total: $
            {detalleFactura
              .reduce((acc, i) => acc + Number(i.subtotal || 0), 0)
              .toLocaleString("es-AR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
          </Typography>
        </DialogContent>
      </Dialog>

      <div style={{ position: "absolute", top: "-9999px", left: "-9999px" }}>
        <GenerarPdf
          ref={facturaPdfRef}
          numeroFactura={facturaSeleccionada?.numero}
          fecha={facturaSeleccionada?.fecha}
          tipoComprobante={facturaSeleccionada?.tipo_comprobante}
          formaPago={facturaSeleccionada?.forma_pago}
          clienteSeleccionado={facturaSeleccionada?.cliente}
          detalle={detalleFactura}
          totalFactura={facturaSeleccionada?.total}
          observaciones={facturaSeleccionada?.observaciones}
          puntoVenta={1}
        />
      </div>

      <Dialog
        open={openPago}
        onClose={() => setOpenPago(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Registrar Pago</DialogTitle>

        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Importe recibido"
                  type="number"
                  fullWidth
                  size="small"
                  value={importeRecibido}
                  onChange={(e) => setImporteRecibido(e.target.value)}
                />
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
                  <MenuItem value="Efectivo">Efectivo</MenuItem>
                  <MenuItem value="Transferencia">Transferencia</MenuItem>
                  <MenuItem value="Tarjeta">Tarjeta</MenuItem>
                  <MenuItem value="Cheque">Cheque</MenuItem>
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{ height: 40 }}
                  onClick={aplicarPagoAutomatico}
                >
                  Aplicar automático
                </Button>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Observaciones"
                  fullWidth
                  size="small"
                  multiline
                  minRows={2}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="body1">
                <strong>Cliente:</strong> {clienteSeleccionado?.nombre || "-"}
              </Typography>

              <Typography variant="body1">
                <strong>Total aplicado:</strong> ${" "}
                {Number(totalAplicado).toLocaleString("es-AR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Typography>
            </Box>

            <Box sx={{ height: 350 }}>
              <DataGrid
                rows={facturasPendientes}
                getRowId={(row) => row.id}
                disableRowSelectionOnClick
                columns={[
                  {
                    field: "fecha",
                    headerName: "Fecha",
                    width: 110,
                  },
                  {
                    field: "numero",
                    headerName: "N°",
                    width: 100,
                    valueFormatter: (params) =>
                      String(params?.value || 0).padStart(4, "0"),
                  },
                  {
                    field: "tipo_comprobante",
                    headerName: "Tipo",
                    width: 100,
                  },
                  {
                    field: "saldo",
                    headerName: "Saldo",
                    width: 130,
                    valueFormatter: (params) =>
                      `$ ${Number(params?.value || 0).toLocaleString("es-AR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`,
                  },
                  {
                    field: "pagar",
                    headerName: "A pagar",
                    width: 140,
                    renderCell: (params) => (
                      <TextField
                        size="small"
                        type="number"
                        value={params.row.pagar}
                        onChange={(e) =>
                          manejarPagoFactura(params.row.id, e.target.value)
                        }
                        inputProps={{
                          min: 0,
                          max: params.row.saldo,
                          step: "0.01",
                        }}
                        sx={{ width: "100%" }}
                      />
                    ),
                  },
                ]}
              />
            </Box>

            <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
              <Button
                variant="contained"
                onClick={guardarPago}
                disabled={guardandoPago}
              >
                {guardandoPago ? "Guardando..." : "Guardar pago"}
              </Button>

              <Button variant="outlined" onClick={() => setOpenPago(false)}>
                Cancelar
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
