const { Router } = require('express');
const axios = require('axios');
const {paciente} = require('../db')

const router = Router();


router.get('/', async (req,res,next)=>{
    try{
        const pacientes = await paciente.findAll()

        for(let i=0;i<pacientes.length;i++){
            pacientes[i] = pacientes[i].toJSON()
            delete pacientes[i].pw
        }

        res.send(pacientes)
    }catch(error){
        next(error)
    }
})

router.post('/register', async (req,res,next)=>{
    try{
        const {name, lname, dni, email, phone, pw, repw} = req.body

        console.log(name, lname, dni, email, phone, pw, repw)
        
        if(!name || !lname || !dni || !email || !phone || !pw || !repw){
            res.send('Completar todos los campos.')
        }else{
            const dniExiste = await paciente.findAll({
                where: {
                    dni: dni
                }
            })
            const emailExiste = await paciente.findAll({
                where: {
                    email: email
                }
            })
            if(dniExiste.length>0){
                res.send('El DNI ya se encuentra registrado.')
            }else if(emailExiste.length>0){
                res.send('El email ya se encuentra registrado.')
            }else if(pw !== repw){
                res.send('Las contraseñas no coinciden.')
            }else{
                const newPaciente = await paciente.create({
                    name,
                    lname,
                    dni,
                    email,
                    phone,
                    pw
                })
                res.send("Usuario creado")
            }
        }
    }catch(error){
        next(error)
    }
})

router.post('/login', async (req,res,next)=>{
    try{
        console.log("object")
        const {dni, pw} = req.body
        
        if(!dni || !pw){
            res.send('Completar todos los campos.')
        }else{
            const user = await paciente.findAll({
                where: {
                    dni: dni
                }
            })
            if(user.length > 0){ 
                user[0] = user[0].toJSON()
                if(user[0].pw == pw){
                    delete user[0].pw
                    res.send(user[0])
                }else{
                    res.send("Contraseña incorrecta.")
                }
            }else{
                res.send("Usuario no existe")
            }
        }
    }catch(error){
        next(error)
    }
})

router.get('/turnos', async (req,res,next)=>{

    const {dni} = req.query

    const username = "abanegas";
    const password = "Diag123!";

    try{

        const turnos = []

        const turnosPaciente = await axios.get(`https://diagnosticar.alephoo.com/api/v3/admision/turnos?filter[persona.documento]=${dni}`, {
            headers: {
                "Authorization": `Basic YWJhbmVnYXM6RGlhZzEyMyE=`
            }
        })


        const obj = {
            especialidad: "",
            detalle: "",
            fecha: "",
            hora: ""
        }

        turnos.push(obj)
        
        res.send(turnosPaciente.data.included)
    }catch(error){
        next(error)
    }
})

/*

https://diagnosticar.alephoo.com/api/v3/admision/turnos?filter[persona.documento]=40811186

*/

module.exports = router;