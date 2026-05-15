import { forwardRef } from "react";
import { formatearCuit } from "../utils/formatearCuit";
import {
  Box,
  Paper,
  Typography,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";

const GenerarPdf = forwardRef(
  (
    {
      fecha,
      tipoComprobante,
      numeroFactura,
      formaPago,
      clienteSeleccionado,
      detalle,
      totalFactura,
      observaciones,
    },
    ref,
  ) => {
    const formatearNumeroFactura = (tipo, numero) => {
      return `${tipo}-${String(numero || 0).padStart(8, "0")}`;
    };

    return (
      <Box
        sx={{
          position: "absolute",
          left: "-9999px",
          top: 0,
        }}
      >
        <Paper
          ref={ref}
          sx={{
            width: 800,
            p: 4,
            backgroundColor: "white",
            color: "black",
            borderRadius: 0,
          }}
        >
          {/* ENCABEZADO */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "stretch",
              mb: 3,
              border: "1px solid black",
            }}
          >
            {/* EMPRESA */}
            <Box
              sx={{
                flex: 1,
                p: 2,
                borderRight: "1px solid black",
              }}
            >
              <Typography
                variant="h4"
                sx={{ fontWeight: 700 }}
              >
                MI EMPRESA
              </Typography>
              <Typography variant="body2">
                Razón Social: Mi Empresa S.A.
              </Typography>
              <Typography variant="body2">CUIT: 00-00000000-0</Typography>
              <Typography variant="body2">Dirección: Calle 123</Typography>
              <Typography variant="body2">Ciudad: Buenos Aires</Typography>
              <Typography variant="body2">
                Condición IVA: Responsable Inscripto
              </Typography>
            </Box>

            {/* LETRA + DATOS FACTURA */}
            <Box
              sx={{
                width: 260,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Box
                sx={{
                  borderBottom: "1px solid black",
                  p: 2,
                  textAlign: "center",
                }}
              >
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 800,
                    border: "1px solid black",
                    display: "inline-block",
                    px: 2,
                    py: 0.5,
                    mb: 1,
                  }}
                >
                  {tipoComprobante}
                </Typography>

                <Typography
                  variant="h5"
                  sx={{ fontWeight: 700 }}
                >
                  FACTURA
                </Typography>
              </Box>

              <Box sx={{ p: 2 }}>
                <Typography
                  variant="body2"
                  sx={{ mb: 0.5 }}
                >
                  <strong>Número:</strong>{" "}
                  {formatearNumeroFactura(tipoComprobante, numeroFactura)}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ mb: 0.5 }}
                >
                  <strong>Fecha:</strong> {fecha}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ mb: 0.5 }}
                >
                  <strong>Forma de pago:</strong> {formaPago}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* DATOS CLIENTE */}
          <Box
            sx={{
              border: "1px solid black",
              p: 2,
              mb: 3,
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 700, mb: 1 }}
            >
              Datos del cliente
            </Typography>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
              <Box sx={{ minWidth: 250 }}>
                <Typography variant="body2">
                  <strong>Nombre:</strong> {clienteSeleccionado?.nombre || "-"}
                </Typography>
              </Box>

              <Box sx={{ minWidth: 250 }}>
                <Typography variant="body2">
                  <strong>CUIT:</strong>{" "}
                  {formatearCuit(clienteSeleccionado?.cuit) || "-"}
                </Typography>
              </Box>

              <Box sx={{ minWidth: 250 }}>
                <Typography variant="body2">
                  <strong>Dirección:</strong>{" "}
                  {clienteSeleccionado?.direccion || "-"}
                </Typography>
              </Box>

              <Box sx={{ minWidth: 250 }}>
                <Typography variant="body2">
                  <strong>Teléfono:</strong>{" "}
                  {clienteSeleccionado?.telefono || "-"}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* TABLA DETALLE */}
          <Table
            size="small"
            sx={{
              border: "1px solid black",
              mb: 3,
              "& th, & td": {
                border: "1px solid black",
              },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell>
                  <strong>Artículo</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>Cantidad</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>Precio</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>Subtotal</strong>
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {detalle.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.articulo}</TableCell>
                  <TableCell align="right">{item.cantidad}</TableCell>
                  <TableCell align="right">
                    $ {new Intl.NumberFormat("es-AR").format(item.precio)}
                  </TableCell>
                  <TableCell align="right">
                    $ {new Intl.NumberFormat("es-AR").format(item.subtotal)}
                  </TableCell>
                </TableRow>
              ))}

              {detalle.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    align="center"
                  >
                    Sin artículos cargados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* TOTALES */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              mb: 3,
            }}
          >
            <Box
              sx={{
                width: 280,
                border: "1px solid black",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  p: 1.5,
                  borderBottom: "1px solid black",
                }}
              >
                <Typography
                  variant="body1"
                  sx={{ fontWeight: 700 }}
                >
                  Total
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ fontWeight: 700 }}
                >
                  $ {new Intl.NumberFormat("es-AR").format(totalFactura)}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* OBSERVACIONES */}
          {observaciones && (
            <Box
              sx={{
                border: "1px solid black",
                p: 2,
                mb: 4,
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 700, mb: 1 }}
              >
                Observaciones
              </Typography>
              <Typography variant="body2">{observaciones}</Typography>
            </Box>
          )}

          {/* PIE */}
          <Divider sx={{ mb: 2 }} />

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              mt: 6,
            }}
          >
            <Box sx={{ width: 250, textAlign: "center" }}>
              <Divider sx={{ borderColor: "black", mb: 1 }} />
              <Typography variant="body2">Firma cliente</Typography>
            </Box>

            <Box sx={{ width: 250, textAlign: "center" }}>
              <Divider sx={{ borderColor: "black", mb: 1 }} />
              <Typography variant="body2">Firma responsable</Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    );
  },
);

export default GenerarPdf;
