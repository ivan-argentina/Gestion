import { Routes, Route, Link, useLocation } from "react-router-dom";
import {
  Box,
  Collapse,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import AbmClientes from "./AbmClientes";
import AbmCiudades from "./AbmCiudades";
import AbmArticulos from "./AbmArticulos";
import FrmFamilias from "./AbmFamilias";
import Factura from "./Factura";
import Facturas from "./Facturas";
import ResumenClientes from "./ResumenClientes";
import { useEffect, useState } from "react";

import ResumenCliente from "./ResumenClientes";
import ResumenProveedores from "./ResumenProveedores";

const drawerWidth = 200;

export default function InicioFactu() {
  const location = useLocation();
  const [openReportes, setOpenReportes] = useState(false);

  const [openResumen, setOpenResumen] = useState(false);

  useEffect(() => {
    if (location.pathname.includes("/facturas")) {
      setOpenReportes(true);
    }

    if (
      location.pathname.includes("/resumen-clientes") ||
      location.pathname.includes("/resumen-proveedores")
    ) {
      setOpenResumen(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname.includes("/facturas")) {
      setOpenReportes(true);
    }
  }, [location.pathname]);

  const menuItems = [
    { text: "Factura", path: "/" },
    { text: "Articulos", path: "/articulos" },
    { text: "Clientes", path: "/clientes" },
    { text: "Ciudades", path: "/ciudades" },
    { text: "Familias", path: "/familias" },
    { text: "Facturas", path: "/facturas" },
  ];

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            background: "linear-gradient(180deg, #1976d2, #0d47a1)",
            color: "white",
          },
        }}
      >
        <List>
          <Box sx={{ p: 2, fontWeight: "bold" }}>Gestion</Box>
          {menuItems.map((item) => (
            <ListItemButton
              key={item.text}
              component={Link}
              to={item.path}
              selected={location.pathname === item.path}
              sx={{
                color: "white",
                transition: "all 0.25s ease",
                position: "relative",

                "&::before": {
                  content: '""',
                  position: "absolute",
                  left: 0,
                  top: 0,
                  height: "100%",
                  width: "4px",
                  backgroundColor: "transparent",
                  transition: "all 0.25s ease",
                },

                "&:hover::before": {
                  backgroundColor: "#fff",
                },

                "&:hover": {
                  backgroundColor: "#1565c0",
                  transform: "translateX(6px)",
                },

                "&.Mui-selected": {
                  backgroundColor: "#0d47a1",
                },
              }}
            >
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{ color: "white" }}
              />
            </ListItemButton>
          ))}
          {/* Reportes */}
          <ListItemButton
            onClick={() => setOpenReportes(!openReportes)}
            sx={{
              color: "white",
              mt: 1,
              position: "relative",
            }}
          >
            <ListItemText primary="Reportes" />
            {openReportes ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
          {/* SubMenu  */}
          <Collapse in={openReportes} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              <ListItemButton
                component={Link}
                to="/facturas"
                selected={location.pathname === "/facturas"}
                sx={{
                  pl: 4,
                  color: "white",
                  "&:hover": {
                    backgroundColor: "#1565c0",
                  },
                  "&.Mui-selected": {
                    backgroundColor: "#0d47a1",
                  },
                }}
              >
                <ListItemText primary="Facturas" />
              </ListItemButton>
            </List>
          </Collapse>

          {/*Resumen */}
          <ListItemButton
            onClick={() => setOpenResumen(!openResumen)}
            sx={{
              color: "white",
              mt: 1,
              position: "relative",
            }}
          >
            <ListItemText primary="Resumen" />
            {openResumen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
          <Collapse in={openResumen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              <ListItemButton
                component={Link}
                to="resumen-clientes"
                selected={location.pathname === "/resumen-clientes"}
                sx={{
                  pl: 4,
                  color: "white",
                  "&:hover": {
                    backgroundColor: "#1565c0",
                  },
                  "&.Mui-selected": {
                    backgroundColor: "#0d47a1",
                  },
                }}
              >
                <ListItemText primary="Clientes" />
              </ListItemButton>
              <ListItemButton
                component={Link}
                to="/resumen-proveedores"
                selected={location.pathname === "/resumen-proveedores"}
                sx={{
                  pl: 4,
                  color: "white",
                  "&:hover": {
                    backgroundColor: "#1565c0",
                  },
                  "&.Mui-selected": {
                    backgroundColor: "#0d47a1",
                  },
                }}
              >
                <ListItemText primary="proveedores" />
              </ListItemButton>
            </List>
          </Collapse>
        </List>
      </Drawer>

      {/* Contenido*/}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden", // 👈 clave
        }}
      >
        <Box sx={{ flexGrow: 1, minHeight: 0 }}>
          <Routes>
            <Route
              path="/"
              //element={<h2>Pantalla Factura</h2>}
              element={<Factura />}
            />
            <Route path="/clientes" element={<AbmClientes />} />
            <Route path="/ciudades" element={<AbmCiudades />} />
            <Route path="/articulos" element={<AbmArticulos />} />
            <Route path="/familias" element={<FrmFamilias />} />
            <Route path="/facturas" element={<Facturas />} />
            <Route path="/resumen-clientes" element={<ResumenClientes />} />
          </Routes>
        </Box>
      </Box>
    </Box>
  );
}
