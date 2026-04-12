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
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import PersonIcon from "@mui/icons-material/Person";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PaidIcon from "@mui/icons-material/Paid";
import { DataGrid } from "@mui/x-data-grid";
import { supabase } from "../hook/supabaseClient";
import CloseIcon from "@mui/icons-material/Close";
import PrintIcon from "@mui/icons-material/Print";
import GenerarPdf from "../componentes/GenerarPdf";
import { generarpdfU } from "../utils/generarpdfu";

export default function ResumenClientes() {
  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [facturas, setFacturas] = useState([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [loadingFacturas, setLoadingFacturas] = useState(false);
  const [error, setError] = useState("");
  const [detalleFactura, setDetalleFactura] = useState([]);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
  const [openDetalle, setOpenDetalle] = useState(false);
  const facturaPdfRef = useRef();
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 20,
  });

  useEffect(() => {
    cargarClientes();
  }, []);

  const imprimirFactura = async () => {
    await generarpdfU(facturaPdfRef);
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
      console.error("error al traer el detalle", error);
      return;
    }
    setDetalleFactura(data);
    setOpenDetalle(true);
  };

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
      setLoadingClientes(false);
      return;
    }

    setClientes(data || []);
    setLoadingClientes(false);
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
        "id, fecha, numero, tipo_comprobante, total, saldo, forma_pago, estado_pago",
      )
      .eq("idcliente", clienteSeleccionado.id)
      .gte("fecha", fechaDesde)
      .lte("fecha", fechaHasta)
      .order("fecha", { ascending: true });

    if (error) {
      console.log("Error al buscar facturas:", error);
      setError("No se pudieron cargar las facturas.");
      setFacturas([]);
      setLoadingFacturas(false);
      return;
    }

    setFacturas(data || []);
    setLoadingFacturas(false);
  };

  const limpiarFiltros = () => {
    setClienteSeleccionado(null);
    setFechaDesde("");
    setFechaHasta("");
    setFacturas([]);
    setError("");
  };

  const cantidadFacturas = facturas.length;

  const totalFacturado = useMemo(() => {
    return facturas.reduce((acc, item) => acc + Number(item.total || 0), 0);
  }, [facturas]);

  //Armo la grilla
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
      valueFormatter: (value) => {
        return value ? value.toString().padStart(4, "0") : "0000";
      },
    },
    {
      field: "tipo_comprobante",
      headerName: "Tipo",
      width: 80,
    },
    {
      field: "total",
      headerName: "Total",
      width: 120,
      valueFormatter: (value) => {
        const valor = value || 0;
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
        const saldo = params.value || 0;

        return (
          <Typography
            fontWeight="bold"
            color={saldo > 0 ? "error.main" : "success.main"}
          >
            ${" "}
            {Number(saldo).toLocaleString("es-AR", {
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
  //Hasta aca armo la grilla

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
              onChange={(event, newValue) => setClienteSeleccionado(newValue)}
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
      </Paper>

      <Paper sx={{ p: 2, borderRadius: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
          Cantidad de facturas: {facturas.length}
        </Typography>

        <Typography fontWeight="bold" sx={{ mb: 1 }}>
          Total deuda: $
          {facturas
            .reduce((acc, f) => acc + (f.saldo || 0), 0)
            .toLocaleString()}
        </Typography>
        <Box sx={{ width: "100%", height: 600 }}>
          <DataGrid
            rows={facturas}
            columns={columnas}
            loading={loadingFacturas}
            disableRowSelectionOnClick
            getRowId={(row) => row.id}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 20, page: 0 },
              },
            }}
            pageSizeOptions={[10, 20, 50]}
            localeText={{
              noRowsLabel: "No hay facturas para mostrar",
              footerRowSelected: (count) =>
                count !== 1
                  ? `${count.toLocaleString()} filas seleccionadas`
                  : `${count.toLocaleString()} fila seleccionada`,
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
          Numero:{facturaSeleccionada?.numero}
          <IconButton onClick={imprimirFactura}>
            <PrintIcon />
          </IconButton>
          <IconButton onClick={() => setOpenDetalle(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Articulo</TableCell>
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
        </DialogContent>
      </Dialog>
      <Typography sx={{ mt: 2 }}>
        Total: $
        {detalleFactura.reduce((acc, i) => acc + Number(i.subtotal || 0), 0)}
      </Typography>

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
    </Box>
  );
}
