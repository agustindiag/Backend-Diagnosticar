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
        const {dni, pw} = req.body

        console.log(dni, pw)
        
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
                    res.send('Credenciales correctas.')
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

module.exports = router;