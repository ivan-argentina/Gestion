import InicioFactu from "./pages/InicioFactu";
import { createTheme, ThemeProvider } from "@mui/material/styles";

const theme = createTheme({
  typography: {
    fontSize: 12,
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <InicioFactu />
    </ThemeProvider>
  );
}

export default App;
