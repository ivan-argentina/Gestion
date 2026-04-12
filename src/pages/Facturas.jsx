import VisibilityIcon from "@mui/icons-material/Visibility";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import { useRef, useEffect, useState } from "react";
import { generarpdfU } from "../utils/generarpdfu";
import GenerarPdf from "../componentes/GenerarPdf";
import { DataGrid } from "@mui/x-data-grid";
import { supabase } from "../hook/supabaseClient";

import {
  Box,
  Paper,
  Typography,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";

export default function Facturas() {
  const [facturas, setFacturas] = useState([]);
  const [detalleFactura, setDetalleFactura] = useState([]);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
  const [openDetalle, setOpenDetalle] = useState(false);
  const [filtro, setFiltro] = useState("");
  const facturaPdfRef = useRef();

  const cargarFacturas = async () => {
    const { data, error } = await supabase.from("facturas").select(`
      id,
      numero,
      fecha,
      tipo_comprobante,
      forma_pago,
      observaciones,
      subtotal,
      total,
      punto_venta,
      clientes (
        nombre,
        cuit,
        direccion,
        telefono,
        idciudad
      )
    `);

    if (error) {
      console.log("Error al cargar facturas:", error);
      return;
    }

    setFacturas(data || []);
  };

  const verDetalleFactura = async (factura) => {
    setFacturaSeleccionada(factura);

    const { data, error } = await supabase
      .from("factura_detalle")
      .select(
        `
        id,
        cantidad,
        precio,
        subtotal,
        articulos(nombre)
      `,
      )
      .eq("idfactura", factura.id);

    if (error) {
      console.log("Error al cargar detalle:", error);
      return;
    }

    const detalleFormateado = (data || []).map((item) => ({
      id: item.id,
      articulo: item?.articulos?.nombre || "-",
      cantidad: item.cantidad,
      precio: item.precio,
      subtotal: item.subtotal,
    }));

    setDetalleFactura(detalleFormateado);
    setOpenDetalle(true);
  };

  const descargarPdfFactura = async (factura) => {
    setFacturaSeleccionada(factura);

    const { data, error } = await supabase
      .from("factura_detalle")
      .select(
        `
        id,
        cantidad,
        precio,
        subtotal,
        articulos(nombre)
      `,
      )
      .eq("idfactura", factura.id);

    if (error) {
      console.log("Error al cargar detalle para PDF:", error);
      return;
    }

    const detalleFormateado = (data || []).map((item) => ({
      id: item.id,
      articulo: item?.articulos?.nombre || "-",
      cantidad: item.cantidad,
      precio: item.precio,
      subtotal: item.subtotal,
    }));

    setDetalleFactura(detalleFormateado);

    setTimeout(() => {
      generarpdfU(
        facturaPdfRef.current,
        `factura-${factura.numero || "sin-numero"}.pdf`,
      );
    }, 300);
  };

  useEffect(() => {
    cargarFacturas();
  }, []);

  const columnas = [
    {
      field: "fecha",
      headerName: "Fecha",
      width: 120,
    },
    {
      field: "cliente",
      headerName: "Cliente",
      flex: 1,
      minWidth: 180,
      renderCell: (params) => params.row?.clientes?.nombre || "Sin Cliente",
    },
    {
      field: "tipo_comprobante",
      headerName: "Comprobante",
      width: 140,
    },
    {
      field: "forma_pago",
      headerName: "Pago",
      width: 140,
      renderCell: (params) => (
        <Chip label={params.value} size="small" color="primary" />
      ),
    },
    {
      field: "total",
      headerName: "Total",
      width: 130,
      align: "right",
      headerAlign: "right",
      valueFormatter: (params) =>
        new Intl.NumberFormat("es-AR", {
          style: "currency",
          currency: "ARS",
          minimumFractionDigits: 0,
        }).format(params.value || 0),
    },
    {
      field: "ver",
      headerName: "Ver",
      width: 80,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <IconButton
          color="primary"
          onClick={() => verDetalleFactura(params.row)}
        >
          <VisibilityIcon />
        </IconButton>
      ),
    },
    {
      field: "pdf",
      headerName: "PDF",
      width: 80,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <IconButton
          color="secondary"
          onClick={() => descargarPdfFactura(params.row)}
        >
          <PictureAsPdfIcon />
        </IconButton>
      ),
    },
  ];

  const facturasFiltradas = facturas.filter((f) => {
    const nombreCliente = f.clientes?.nombre || "";
    return nombreCliente.toLowerCase().includes(filtro.toLowerCase());
  });

  return (
    <Box sx={{ p: 2 }}>
      <Paper sx={{ p: 2, borderRadius: 3, width: "100%" }}>
        <Typography variant="h5" gutterBottom>
          Listado de Facturas
        </Typography>

        <Box sx={{ mb: 2 }}>
          <TextField
            label="Buscar por cliente"
            size="small"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
        </Box>

        <Box sx={{ width: "100%", height: 450 }}>
          <DataGrid
            rows={facturasFiltradas}
            columns={columnas}
            pageSizeOptions={[5, 10, 20]}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10, page: 0 },
              },
            }}
            rowHeight={50}
            disableRowSelectionOnClick
            sx={{
              width: "100%",
              fontSize: 13,
              borderRadius: 2,
            }}
            localeText={{
              noRowsLabel: "No hay facturas cargadas",
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
        <DialogTitle>Detalle de Factura</DialogTitle>

        <DialogContent>
          {facturaSeleccionada && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Número:</strong> {facturaSeleccionada.numero || "-"}
              </Typography>
              <Typography variant="body2">
                <strong>Fecha:</strong> {facturaSeleccionada.fecha}
              </Typography>
              <Typography variant="body2">
                <strong>Cliente:</strong>{" "}
                {facturaSeleccionada?.clientes?.nombre || "-"}
              </Typography>
              <Typography variant="body2">
                <strong>Tipo:</strong> {facturaSeleccionada.tipo_comprobante}
              </Typography>
              <Typography variant="body2">
                <strong>Forma de pago:</strong> {facturaSeleccionada.forma_pago}
              </Typography>
              <Typography variant="body2">
                <strong>Total:</strong>{" "}
                {new Intl.NumberFormat("es-AR", {
                  style: "currency",
                  currency: "ARS",
                  minimumFractionDigits: 0,
                }).format(facturaSeleccionada.total || 0)}
              </Typography>
            </Box>
          )}

          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Artículo</TableCell>
                <TableCell align="right">Cantidad</TableCell>
                <TableCell align="right">Precio</TableCell>
                <TableCell align="right">Subtotal</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {detalleFactura.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.articulo || "-"}</TableCell>
                  <TableCell align="right">{item.cantidad}</TableCell>
                  <TableCell align="right">
                    {new Intl.NumberFormat("es-AR", {
                      style: "currency",
                      currency: "ARS",
                      minimumFractionDigits: 0,
                    }).format(item.precio || 0)}
                  </TableCell>
                  <TableCell align="right">
                    {new Intl.NumberFormat("es-AR", {
                      style: "currency",
                      currency: "ARS",
                      minimumFractionDigits: 0,
                    }).format(item.subtotal || 0)}
                  </TableCell>
                </TableRow>
              ))}

              {detalleFactura.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No hay detalle para esta factura
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      <GenerarPdf
        ref={facturaPdfRef}
        fecha={facturaSeleccionada?.fecha}
        tipoComprobante={facturaSeleccionada?.tipo_comprobante}
        puntoVenta={facturaSeleccionada?.punto_venta || 1}
        numeroFactura={facturaSeleccionada?.numero}
        formaPago={facturaSeleccionada?.forma_pago}
        clienteSeleccionado={facturaSeleccionada?.clientes}
        detalle={detalleFactura}
        totalFactura={facturaSeleccionada?.total}
        observaciones={facturaSeleccionada?.observaciones}
      />
    </Box>
  );
}
