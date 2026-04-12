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
      puntoVenta = "0001",
      numeroFactura,
      formaPago,
      clienteSeleccionado,
      detalle = [],
      observaciones,
      totalFactura,
      cae = "00000000000000",
      vencimientoCae = "__/__/____",
    },
    ref,
  ) => {
    const formatoMoneda = (valor) =>
      new Intl.NumberFormat("es-AR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number(valor || 0));

    const formatearNumeroFactura = (ptoVta, numero) => {
      return `${String(ptoVta || 1).padStart(4, "0")}-${String(
        numero || 0,
      ).padStart(8, "0")}`;
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
            width: 820,
            p: 3,
            backgroundColor: "#fff",
            color: "#000",
            borderRadius: 0,
            fontFamily: "Arial, sans-serif",
            boxShadow: "none",
            display: "flex",
            flexDirection: "column",
            height: 1120,
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 90px 1fr",
              alignItems: "stretch",
              border: "1.5px solid #000",
              mb: 2,
            }}
          >
            <Box
              sx={{
                p: 2,
              }}
            >
              <Typography
                sx={{
                  fontSize: 28,
                  fontWeight: 800,
                  lineHeight: 1,
                  mb: 1,
                }}
              >
                MI EMPRESA
              </Typography>

              <Typography sx={{ fontSize: 13, mb: 0.3 }}>
                <strong>Razón Social:</strong> Mi Empresa S.A.
              </Typography>
              <Typography sx={{ fontSize: 13, mb: 0.3 }}>
                <strong>Domicilio Comercial:</strong> Calle 123
              </Typography>
              <Typography sx={{ fontSize: 13, mb: 0.3 }}>
                <strong>Localidad:</strong> Buenos Aires
              </Typography>
              <Typography sx={{ fontSize: 13, mb: 0.3 }}>
                <strong>Condición frente al IVA:</strong> Responsable Inscripto
              </Typography>

              <Box sx={{ mt: 2 }}>
                <Typography sx={{ fontSize: 12 }}>
                  <strong>Ingresos Brutos:</strong> 123456-7
                </Typography>
                <Typography sx={{ fontSize: 12 }}>
                  <strong>Fecha de Inicio de Actividades:</strong> 01/01/2024
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                p: 1,
              }}
            >
              <Box
                sx={{
                  width: 70,
                  height: 70,
                  border: "1.5px solid #000",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 1,
                }}
              >
                <Typography
                  sx={{
                    fontSize: 34,
                    fontWeight: 800,
                    lineHeight: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    height: "100%",
                    textAlign: "center",
                  }}
                >
                  {tipoComprobante}
                </Typography>
              </Box>

              <Typography
                sx={{
                  fontSize: 11,
                  fontWeight: 700,
                  textAlign: "center",
                }}
              >
                COD. 006
              </Typography>
            </Box>

            <Box
              sx={{
                p: 2,
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-start",
              }}
            >
              <Typography
                sx={{
                  fontSize: 24,
                  fontWeight: 800,
                  textAlign: "center",
                  mb: 2,
                }}
              >
                REMITO
              </Typography>

              <Typography sx={{ fontSize: 13, mb: 0.6 }}>
                <strong>Punto de Venta:</strong>{" "}
                {String(puntoVenta).padStart(4, "0")}
              </Typography>

              <Typography sx={{ fontSize: 13, mb: 0.6 }}>
                <strong>Comp. Nro:</strong>{" "}
                {formatearNumeroFactura(puntoVenta, numeroFactura)}
              </Typography>

              <Typography sx={{ fontSize: 13, mb: 0.6 }}>
                <strong>Fecha de Emisión:</strong> {fecha}
              </Typography>

              <Typography sx={{ fontSize: 13, mb: 0.6 }}>
                <strong>CUIT:</strong> 00-00000000-0
              </Typography>

              <Typography sx={{ fontSize: 13, mb: 0.6 }}>
                <strong>Forma de Pago:</strong> {formaPago || "-"}
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              border: "1.5px solid #000",
              p: 2,
              mb: 2,
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1.2fr 1fr",
                gap: 1.2,
              }}
            >
              <Typography sx={{ fontSize: 13 }}>
                <strong>Apellido y Nombre / Razón Social:</strong>{" "}
                {clienteSeleccionado?.nombre || "-"}
              </Typography>

              <Typography sx={{ fontSize: 13 }}>
                <strong>CUIT / DNI:</strong>{" "}
                {clienteSeleccionado?.cuit
                  ? formatearCuit(clienteSeleccionado.cuit)
                  : "-"}
              </Typography>

              <Typography sx={{ fontSize: 13 }}>
                <strong>Domicilio:</strong>{" "}
                {clienteSeleccionado?.direccion || "-"}
              </Typography>

              <Typography sx={{ fontSize: 13 }}>
                <strong>Ciudad:</strong>{" "}
                {clienteSeleccionado?.ciudades?.nombre || "-"}
              </Typography>

              <Typography sx={{ fontSize: 13 }}>
                <strong>Condición frente al IVA:</strong> Consumidor Final
              </Typography>

              <Typography sx={{ fontSize: 13 }}>
                <strong>Condición de venta:</strong> {formaPago || "-"}
              </Typography>
            </Box>
          </Box>

          <Table
            size="small"
            sx={{
              mb: 2,
              border: "1.5px solid #000",
              "& .MuiTableCell-root": {
                border: "none",
                fontSize: 12.5,
                py: 0.8,
                px: 1,
              },
              "& .MuiTableHead-root .MuiTableCell-root": {
                borderBottom: "1.5px solid #000",
                fontWeight: 700,
              },
              "& tbody tr:last-child td": {
                borderBottom: "1px solid #000",
              },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell>Producto / Servicio</TableCell>
                <TableCell align="right">Cantidad</TableCell>
                <TableCell align="right">Precio Unit.</TableCell>
                <TableCell align="right">Subtotal</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {detalle.map((item, index) => {
                return (
                  <TableRow key={item.id || index}>
                    <TableCell>
                      {item.articulo ||
                        item.descripcion ||
                        item.articulos?.descripcion ||
                        ""}
                    </TableCell>

                    <TableCell align="right">
                      {Number(item.cantidad || 0)}
                    </TableCell>

                    <TableCell align="right">
                      {Number(item.precio || 0).toLocaleString("es-AR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>

                    <TableCell align="right">
                      $
                      {Number(item.subtotal || 0).toLocaleString("es-AR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                  </TableRow>
                );
              })}

              {detalle.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    Sin artículos cargados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <Box
            sx={{
              display: "flex",
              border: "1.5px solid #000",
              minHeight: 130,
              mt: "auto",
              mb: 2,
            }}
          >
            <Box
              sx={{
                flex: 1,
                p: 2,
                borderRight: "1.5px solid #000",
              }}
            >
              <Typography sx={{ fontSize: 12.5, fontWeight: 700, mb: 1 }}>
                Observaciones
              </Typography>

              <Typography sx={{ fontSize: 12, whiteSpace: "pre-line" }}>
                {observaciones || "Sin observaciones."}
              </Typography>
            </Box>

            <Box sx={{ width: 290 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  p: 1.2,
                  borderBottom: "1px solid #000",
                }}
              >
                <Typography sx={{ fontSize: 12.5 }}>
                  Importe Neto Gravado:
                </Typography>
                <Typography sx={{ fontSize: 12.5 }}>
                  $ {formatoMoneda(totalFactura)}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  p: 1.2,
                  borderBottom: "1px solid #000",
                }}
              >
                <Typography sx={{ fontSize: 12.5 }}>IVA 21%:</Typography>
                <Typography sx={{ fontSize: 12.5 }}>$ 0,00</Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  p: 1.2,
                  borderBottom: "1px solid #000",
                }}
              >
                <Typography sx={{ fontSize: 12.5 }}>
                  Importe Otros Tributos:
                </Typography>
                <Typography sx={{ fontSize: 12.5 }}>$ 0,00</Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  p: 1.4,
                  backgroundColor: "#f5f5f5",
                }}
              >
                <Typography sx={{ fontSize: 14, fontWeight: 800 }}>
                  IMPORTE TOTAL
                </Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 800 }}>
                  $ {formatoMoneda(totalFactura)}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
              border: "1.5px solid #000",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              p: 1.5,
              mb: 4,
            }}
          >
            <Box>
              <Typography sx={{ fontSize: 12.5 }}>
                <strong>CAE N°:</strong> {cae}
              </Typography>
              <Typography sx={{ fontSize: 12.5 }}>
                <strong>Fecha de Vto. de CAE:</strong> {vencimientoCae}
              </Typography>
            </Box>

            <Box
              sx={{
                width: 84,
                height: 84,
                border: "1px solid #000",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                textAlign: "center",
                p: 1,
              }}
            >
              QR
            </Box>
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mt: 4,
            }}
          >
            <Box sx={{ width: 220, textAlign: "center" }}>
              <Divider sx={{ borderColor: "#000", mb: 0.8 }} />
              <Typography sx={{ fontSize: 12 }}>Firma cliente</Typography>
            </Box>

            <Box sx={{ width: 220, textAlign: "center" }}>
              <Divider sx={{ borderColor: "#000", mb: 0.8 }} />
              <Typography sx={{ fontSize: 12 }}>Firma responsable</Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    );
  },
);

export default GenerarPdf;
