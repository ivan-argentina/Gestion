import { Alert, Snackbar } from "@mui/material";

export default function Notificaciones({open, mensaje,tipo,onClose}){
    return(
        <Snackbar
        open={open}
        autoHideDuration={3000}
        onClose={onClose}
        anchorOrigin={{vertical: 'top', horizontal:'center'}}
        >
         <Alert
          severity={tipo}
          variant="filled"
          onClose={onClose}
         >{mensaje}</Alert>
        </Snackbar>
    )

}