import { Box, Button, Container, IconButton, List, ListItem, ListItemText, TextField, Typography } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete"
import Notificaciones from "./Notificaciones";
import { useEffect, useState } from "react";
import { supabase } from "../hook/supabaseClient"

export default function AbmCiudades(){
    const [ciudad, setCiudad]= useState('')
    const [ciudades, setCiudades] = useState([])
    const [mensaje, setMensaje] = useState('')
    const [tipo, setTipo] = useState('success')
    const [open,setOpen] = useState(false)
    const [error, setError] = useState('')
    
    //cargar ciudad
    const cargarCiudades = async () => { 
        const {data} = await supabase
        .from('ciudades')
        .select('*')
        .order('nombre')
        if(error){
            console.log(error)
            return
        }
        setCiudades(data)
    }
    //guardar ciudad
    const guardarCiudad = async(e) =>{
         if(!ciudad ){
          setError('Complete los campos obligatorios')
          setMensaje('')
          return
        }else {
        e.preventDefault()
        const{data,error}=await supabase
        .from('ciudades')
        .insert([{nombre: ciudad}])
        setMensaje('Ciudad Guardada correctamente')
        setTipo('success')
        setOpen(true)
        if(error) console.log(error)
        setCiudad('')
        cargarCiudades()
        setMensaje(error.message)
        setTipo('error')
        setOpen(true)
        }
    }

    const eliminarCiudad = async(id) =>{
        if(!confirm('Eliminar Ciudad?'))return
        await supabase
        .from('ciudades')
        .delete()
        .eq('id', id)
        cargarCiudades()
        setMensaje('Ciudad Eliminada')
        setTipo('info')
        setOpen(true)
    }

    useEffect(() => {
        cargarCiudades()
    },[])
    return(
    <Container maxWidth='sm'>
     <Typography variant="h4" sx={{mt:4, mb:3}}>
        ABM Ciudades
     </Typography>
     <Notificaciones
        open={open}
        mensaje={mensaje}
        tipo={tipo}
        onClose={()=> setOpen(false)}
     />
     <Box 
      component='form'
      onSubmit={guardarCiudad}
      sx={{display:'flex',gap:2,mb:3}}
     >
        <TextField
         label='Ciudad'
         value={ciudad}
         onChange={(e) => setCiudad(e.target.value)}
         fullWidth
        />
        <Button disabled={!ciudad}type="submit" variant="contained">Guardar</Button>
     </Box>
     <List>
        {ciudades.map((c) =>(
            <ListItem
             key={c.id}
             secondaryAction={
                <IconButton
                 edge='end'
                 color="error"
                 onClick={() => eliminarCiudad(c.id)}
                > <DeleteIcon />  </IconButton>
             }
            >
            <ListItemText primary={c.nombre} />
            </ListItem>
        ))}
     </List>
    </Container>
    )
}