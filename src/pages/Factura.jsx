import { useRef, useEffect, useState } from "react";
import { supabase } from "../hook/supabaseClient";
import { obtenerEmpresa } from "../utils/obtenerEmpresa";

import {
  Grid,
  MenuItem,
  TextField,
  Button,
  Typography,
  Box,
  IconButton,
  Paper,
  Autocomplete,
} from "@mui/material";

import { DataGrid } from "@mui/x-data-grid";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import VisibilityIcon from "@mui/icons-material/Visibility";

import GenerarPdf from "../componentes/GenerarPdf";
import { generarpdfU } from "../utils/generarpdfu";
import ModalImagen from "../componentes/ModalImagen";

export default function Factura() {
  const [clientes, setClientes] = useState([]);
  const [articulos, setArticulos] = useState([]);

  const [clienteId, setClienteId] = useState("");
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);

  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [tipoComprobante, setTipoComprobante] = useState("factura");
  const [formaPago, setFormaPago] = useState("Contado");
  const [medioPago, setMedioPago] = useState("efectivo");
  const [observaciones, setObservaciones] = useState("");

  const [articuloId, setArticuloId] = useState("");
  const [articuloSeleccionado, setArticuloSeleccionado] = useState(null);
  const [inputArticulo, setInputArticulo] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [precio, setPrecio] = useState("");
  const [detalle, setDetalle] = useState([]);

  const [openFoto, setOpenFoto] = useState(false);
  const [fotoSeleccionada, setFotoSeleccionada] = useState("");

  const [numeroFactura, setNumeroFactura] = useState("");
  const [letraComprobante, setLetraComprobante] = useState("");
  const [empresa, setEmpresa] = useState(null);
  const [pdfData, setPdfData] = useState(null);
  const [condicionIva, setCondicionIva] = useState("");
  const [ciudad, setCiudad] = useState("");

  const inputArticuloRef = useRef(null);
  const facturaPdfRef = useRef(null);

  const drawerWidth = 200;

  const obtenerLetraComprobante = (tipoComprobante, clienteSeleccionado) => {
    const tipo = tipoComprobante || "factura";
    const condicionIva = clienteSeleccionado?.condicionIva || "";

    if (tipo === "remito") return "X";
    if (tipo === "presupuesto") return "X";

    if (tipo === "factura" || tipo === "nota_de_credito") {
      return condicionIva === "Responsable Inscripto" ? "A" : "B";
    }

    return "";
  };

  useEffect(() => {
    const letra = obtenerLetraComprobante(tipoComprobante, clienteSeleccionado);
    setLetraComprobante(letra);
  }, [tipoComprobante, clienteSeleccionado]);

  const seleccionarArticulo = (articulo) => {
    if (!articulo) return;

    setArticuloId(articulo.id);
    setArticuloSeleccionado(articulo);
    setInputArticulo(articulo.descripcion || "");
    setPrecio(Number(articulo.precio) || 0);
    setCantidad(1);
  };

  const buscarPorCodigoODescripcion = (valor) => {
    const texto = String(valor || "")
      .trim()
      .toLowerCase();

    if (!texto) return null;

    const encontrado = articulos.find((a) => {
      const codigo = String(a.codigo || "")
        .trim()
        .toLowerCase();
      const descripcion = String(a.descripcion || "")
        .trim()
        .toLowerCase();

      return codigo === texto || descripcion.includes(texto);
    });

    return encontrado || null;
  };

  const obtenerUrlImagen = (path) => {
    if (!path) return "";
    const { data } = supabase.storage.from("articulos").getPublicUrl(path);
    return data?.publicUrl || "";
  };

  const abrirFoto = (foto) => {
    const url = obtenerUrlImagen(foto);
    setFotoSeleccionada(url);
    setOpenFoto(true);
  };

  const cerrarFoto = () => {
    setOpenFoto(false);
    setFotoSeleccionada("");
  };

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
         ciudades (
         id,
         nombre),
         condicion_iva(id,
         descripcion)   
        `,
      )
      .order("nombre");

    if (error) {
      console.log("Error al cargar clientes:", error);
      return;
    }

    setClientes(data || []);
  };

  const cargarArticulos = async () => {
    const { data, error } = await supabase
      .from("articulos")
      .select("*")
      .order("descripcion", { ascending: true });

    if (error) {
      console.log("Error al cargar artículos:", error);
      return;
    }

    setArticulos(data || []);
  };

  const manejarCliente = (id) => {
    setClienteId(id);

    const cli = clientes.find((c) => String(c.id) === String(id));
    setClienteSeleccionado(cli || null);
  };

  const agregarDetalle = () => {
    const art =
      articuloSeleccionado || articulos.find((a) => a.id === articuloId);

    if (!art) {
      alert("Seleccione un artículo");
      return;
    }

    if (Number(cantidad) <= 0) {
      alert("Ingrese una cantidad válida");
      return;
    }

    const nuevoItem = {
      id: Date.now(),
      idarticulo: art.id,
      articulo: art.descripcion,
      descripcion: art.descripcion,
      cantidad: Number(cantidad),
      precio: Number(precio),
      subtotal: Number(cantidad) * Number(precio),
      imagen_url: art.imagen_url || "",
      codigo: art.codigo || "",
    };

    setDetalle((prev) => [...prev, nuevoItem]);

    setArticuloId("");
    setArticuloSeleccionado(null);
    setInputArticulo("");
    setCantidad(1);
    setPrecio("");

    setTimeout(() => {
      inputArticuloRef.current?.focus();
    }, 0);
  };

  const eliminarDetalle = (id) => {
    setDetalle((prev) => prev.filter((item) => item.id !== id));
  };

  const totalFactura = detalle.reduce(
    (acc, item) => acc + Number(item.subtotal || 0),
    0,
  );

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
      letra_comprobante: letraComprobante,
      forma_pago: formaPago,
      medio_pago: formaPago === "Contado" ? medioPago : null,
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
      console.error("Error al guardar factura:", error);
      alert("Error al guardar factura");
      return;
    }

    const facturaId = data.id;
    const numeroGenerado = data.numero;

    const detalleInsert = detalle.map((item) => ({
      idfactura: facturaId,
      idarticulo: item.idarticulo,
      descripcion: item.descripcion || item.articulo || "",
      cantidad: Number(item.cantidad),
      precio: Number(item.precio),
      subtotal: Number(item.subtotal),
    }));

    const { error: errorDetalle } = await supabase
      .from("detalle_factura")
      .insert(detalleInsert);

    if (errorDetalle) {
      console.log("Error al guardar detalle:", errorDetalle);
      alert("Error al guardar detalle");
      return;
    }

    //Descuento el stock
    if (tipoComprobante === "factura" || tipoComprobante === "remito") {
      const itemsStock = detalle.map((item) => ({
        idarticulo: item.idarticulo,
        cantidad: Number(item.cantidad),
      }));

      console.log("Items para descontar:", itemsStock);

      const { error: errorStock } = await supabase.rpc(
        "descontar_stock_multiple",
        {
          items: itemsStock,
        },
      );

      if (errorStock) {
        console.log("Error al descontar stock:", errorStock);
        alert("Error al descontar stock");
        return;
      }
    }

    setNumeroFactura(numeroGenerado);

    const datosPdf = {
      numeroFactura: numeroGenerado,
      fecha,
      tipoComprobante,
      letraComprobante,
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

    setClienteId("");
    setClienteSeleccionado(null);
    setFecha(new Date().toISOString().slice(0, 10));
    setTipoComprobante("factura");
    setFormaPago("Contado");
    setMedioPago("efectivo");
    setObservaciones("");
    setArticuloId("");
    setArticuloSeleccionado(null);
    setInputArticulo("");
    setCantidad(1);
    setPrecio("");
    setDetalle([]);
  };

  useEffect(() => {
    const cargarEmpresa = async () => {
      const data = await obtenerEmpresa();
      //console.log("Empresa cargada:", data);
      setEmpresa(data);
    };

    cargarEmpresa();
  }, []);

  useEffect(() => {
    cargarClientes();
    cargarArticulos();
  }, []);

  useEffect(() => {
    const cargarEmpresa = async () => {
      const data = await obtenerEmpresa();
      setEmpresa(data);
    };
    cargarEmpresa();
  }, []);

  const columnasDetalle = [
    { field: "articulo", headerName: "Artículo", flex: 5 },
    {
      field: "cantidad",
      headerName: "Cantidad",
      flex: 1.5,
      align: "right",
      headerAlign: "right",
    },
    {
      field: "precio",
      headerName: "Precio",
      flex: 2,
      align: "right",
      headerAlign: "right",
      renderCell: (params) =>
        `$ ${new Intl.NumberFormat("es-AR").format(
          Number(params.row.precio) || 0,
        )}`,
    },
    {
      field: "subtotal",
      headerName: "Subtotal",
      flex: 2,
      align: "right",
      headerAlign: "right",
      renderCell: (params) =>
        `$ ${new Intl.NumberFormat("es-AR").format(
          Number(params.row.subtotal) || 0,
        )}`,
    },
    {
      field: "acciones",
      headerName: "Acciones",
      flex: 1.5,
      sortable: false,
      filterable: false,
      align: "center",
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <IconButton
            size="small"
            color="primary"
            onClick={() => abrirFoto(params.row.imagen_url)}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>

          <IconButton
            color="error"
            onClick={() => eliminarDetalle(params.row.id)}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
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
          flexShrink: 0,
        }}
      >
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              select
              label="Cliente"
              fullWidth
              size="small"
              value={clienteId}
              onChange={(e) => manejarCliente(e.target.value)}
            >
              {clientes.map((c) => (
                <MenuItem key={c.id} value={String(c.id)}>
                  {c.nombre}
                </MenuItem>
              ))}
            </TextField>
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
              <MenuItem value="debito">Débito</MenuItem>
              <MenuItem value="credito">Crédito</MenuItem>
              <MenuItem value="transferencia">Transferencia</MenuItem>
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, md: 2 }}>
            <TextField
              select
              label="Comprobante"
              fullWidth
              size="small"
              value={tipoComprobante}
              onChange={(e) => setTipoComprobante(e.target.value)}
            >
              <MenuItem value="factura">Factura</MenuItem>
              <MenuItem value="nota_de_credito">Nota de crédito</MenuItem>
              <MenuItem value="remito">Remito</MenuItem>
              <MenuItem value="presupuesto">Presupuesto</MenuItem>
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, md: 2 }}>
            <TextField
              label="Letra"
              fullWidth
              size="small"
              value={letraComprobante}
              InputProps={{ readOnly: true }}
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
                    <strong>Dirección:</strong>{" "}
                    {clienteSeleccionado?.direccion || "-"}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="body2">
                    <strong>
                      Ciudad: {clienteSeleccionado?.ciudades.nombre || "-"}
                    </strong>{" "}
                  </Typography>
                </Grid>
                <Typography variant="body2">
                  Condición IVA:{" "}
                  {clienteSeleccionado?.condicion_iva?.descripcion || "-"}
                </Typography>

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
            borderBottom: "1px solid #e0e0e0",
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
                  if (newValue) {
                    seleccionarArticulo(newValue);
                  }
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
                label="Precio"
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
            localeText={{ noRowsLabel: "No hay artículos cargados" }}
          />

          <ModalImagen
            open={openFoto}
            onClose={cerrarFoto}
            imagen={fotoSeleccionada}
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

      {pdfData && empresa && (
        <div style={{ position: "absolute", left: "-9999px" }}>
          <GenerarPdf
            ref={facturaPdfRef}
            empresa={empresa}
            numeroFactura={pdfData.numeroFactura}
            fecha={pdfData.fecha}
            tipoComprobante={pdfData.tipoComprobante}
            letraComprobante={pdfData.letraComprobante}
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
