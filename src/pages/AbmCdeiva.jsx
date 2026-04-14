import { Grid, TextField, Typography } from '@mui/material';

export default function AbmCdeiva(){    

return(
// ... dentro de tu componente
<Grid container spacing={2}>
    
  <Grid size={4} >
    <TextField fullWidth label="Ocupa 8" />
  </Grid>
  <Grid size={2}>
    <TextField fullWidth label="Ocupa 4" />
  </Grid>
</Grid>

)
}
