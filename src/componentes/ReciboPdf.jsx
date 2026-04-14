import { Box, Typography } from "@mui/material";
import { forwardRef } from "react";

const ReciboPdf = forwardRef(({ pago, detalles, cliente }, ref) => {
  return (
    <Box
      ref={ref}
      sx={{
        width: 800,
        padding: 4,
        fontFamily: "Arial",
        backgroundColor: "#fff",
      }}
    >
      <Typography variant="h5" align="center" fontWeight="bold">
        RECIBO
      </Typography>
      <Divider sx={{ my: 2 }} />
      <Typography>
        <strong>Fecha:</strong> {pago.fecha}
      </Typography>
      <Typography>
        <strong>Cliente:</strong> {cliente?.nombre}
      </Typography>
      <Typography>
        <strong>Importe:</strong>${pago.importe}
      </Typography>
      <Typography>
        <strong>Forma de pago:</strong>${pago.forma_pago}
      </Typography>
      <Divider sx={{ my: 2 }} />
      <Typography variant="h6">Detalle aplicado</Typography>
      {detalles.map((d, i) => (
        <Typography key={i}>
          Factura: {d.idFactura} - ${d.importe_aplicado}
        </Typography>
      ))}
      <Divider sx={{ my: 2 }} />
      <Typography align="right" fontWeight="bold">
        Total: ${pago.importe}
      </Typography>
    </Box>
  );
});
export default ReciboPdf;
