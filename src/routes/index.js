const { Router } = require('express');
// Importar todos los routers;
// Ejemplo: const authRouter = require('./auth.js');
const pacienteRoute = require('./paciente');
const { default: axios } = require('axios');

const router = Router();

// Configurar los routers
// Ejemplo: router.use('/auth', authRouter);

router.get('/', async (req, res, next) => {
    try {
        const pacientes = await paciente.findAll()

        for (let i = 0; i < pacientes.length; i++) {
            pacientes[i] = pacientes[i].toJSON()
            delete pacientes[i].pw
        }

        res.send(pacientes)
    } catch (error) {
        next(error)
    }
})

router.post('/register', async (req, res, next) => {
    try {
        const { name, lname, dni, email, phone, pw, repw } = req.body

        console.log(name, lname, dni, email, phone, pw, repw)

        if (!name || !lname || !dni || !email || !phone || !pw || !repw) {
            res.send('Completar todos los campos.')
        } else {
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
            if (dniExiste.length > 0) {
                res.send('El DNI ya se encuentra registrado.')
            } else if (emailExiste.length > 0) {
                res.send('El email ya se encuentra registrado.')
            } else if (pw !== repw) {
                res.send('Las contraseñas no coinciden.')
            } else {
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
    } catch (error) {
        next(error)
    }
})

router.post('/login', async (req, res, next) => {
    try {
        console.log("object")
        const { dni, pw } = req.body

        if (!dni || !pw) {
            res.send('Completar todos los campos.')
        } else {
            const user = await paciente.findAll({
                where: {
                    dni: dni
                }
            })
            if (user.length > 0) {
                user[0] = user[0].toJSON()
                if (user[0].pw == pw) {
                    delete user[0].pw
                    res.send(user[0])
                } else {
                    res.send("Contraseña incorrecta.")
                }
            } else {
                res.send("Usuario no existe")
            }
        }
    } catch (error) {
        next(error)
    }
})



/*  */



router.get('/turnos', async (req, res, next) => {

    const { dni, idTurno } = req.query

    try {

        if (dni) {
            const turnos = []

            const turnosPaciente = await axios.get(`https://diagnosticar.alephoo.com/api/v3/admision/turnos?filter[persona.documento]=${dni}`, {
                headers: {
                    "Authorization": `Basic YWJhbmVnYXM6RGlhZzEyMyE=`
                }
            })

            const filtroTurnos = turnosPaciente.data.data.filter(e => e.type === "Admision\\Turnoprogramado")

            for (let i = 0; i < filtroTurnos.length; i++) {

                const especialidad = await axios.get(`${filtroTurnos[i].relationships.agenda.links.self}`, {
                    headers: {
                        "Authorization": `Basic YWJhbmVnYXM6RGlhZzEyMyE=`
                    }
                })

                const obj = {
                    especialidad: especialidad.data.included.filter(e => e.type === "Admin\\Especialidad")[0].attributes.nombre,
                    detalle: "",
                    fecha: filtroTurnos[i].attributes.fecha,
                    hora: filtroTurnos[i].attributes.hora
                }

                turnos.push(obj)
            }

            res.send(turnos)
        } else {
            const turno = []
            let estudiosString = ""

            const turnoPaciente = await axios.get(`https://diagnosticar.alephoo.com/api/v3/admision/turnos/${idTurno}`, {
                headers: {
                    "Authorization": `Basic YWJhbmVnYXM6RGlhZzEyMyE=`
                }
            })

            if (turnoPaciente.data.data.type === "Admision\\Turnoprogramado") {

                const especialidad = await axios.get(`${turnoPaciente.data.data.relationships.agenda.links.self}`, {
                    headers: {
                        "Authorization": `Basic YWJhbmVnYXM6RGlhZzEyMyE=`
                    }
                })

                let estudios = turnoPaciente.data.included.filter(e => e.type === "Admin\\Estudio")

                for (let i = 0; i < estudios.length; i++) {
                    if(i == 0){
                        estudiosString = estudiosString + estudios[i].attributes.nombre
                    }else{
                        estudiosString = estudiosString + ", " + estudios[i].attributes.nombre
                    }
                }

                const obj = {
                    especialidad: especialidad.data.included.filter(e => e.type === "Admin\\Especialidad")[0].attributes.nombre,
                    detalle: estudiosString,
                    fecha: turnoPaciente.data.data.attributes.fecha,
                    hora: turnoPaciente.data.data.attributes.hora
                }

                turno.push(obj)
            }

            res.send(turno)
        }

    } catch (error) {
        next(error)
    }
})





router.get('/instituciones', async (req, res, next) => {

    try {

        const instituciones = []

        const institucionesRes = await axios.get(`https://diagnosticar.alephoo.com/api/v3/admin/instituciones`, {
            headers: {
                "Authorization": `Basic YWJhbmVnYXM6RGlhZzEyMyE=`
            }
        })

        for (let i = 0; i < institucionesRes.data.data.length; i++) {
            const obj = {
                id: institucionesRes.data.data[i].id,
                nombre: institucionesRes.data.data[i].attributes.nombre,
            }

            instituciones.push(obj)
        }

        res.send(instituciones)

    } catch (error) {
        next(error)
    }
})

router.get('/especialidades', async (req, res, next) => {

    try {

        const especialidades = []

        const especialidadesRes = await axios.get(`https://diagnosticar.alephoo.com/api/v3/admin/especialidades`, {
            headers: {
                "Authorization": `Basic YWJhbmVnYXM6RGlhZzEyMyE=`
            }
        })

        for (let i = 0; i < especialidadesRes.data.data.length; i++) {
            if (especialidadesRes.data.data[i].relationships.institucionesActivas) {
                const obj = {
                    nombre: especialidadesRes.data.data[i].attributes.nombre,
                    id: especialidadesRes.data.data[i].id
                }

                especialidades.push(obj)
            }
        }

        res.send(especialidades)

    } catch (error) {
        next(error)
    }
})

router.get('/profesionales', async (req, res, next) => {

    const { idEspecialidad } = req.query

    try {

        const profesionales = []

        const profesionalesRes = await axios.get(`https://diagnosticar.alephoo.com/api/v3/admin/profesionales?filter[especialidades]=${idEspecialidad}`, {
            headers: {
                "Authorization": `Basic YWJhbmVnYXM6RGlhZzEyMyE=`
            }
        })

        for (let i = 0; i < profesionalesRes.data.data.length; i++) {
            const obj = {
                id: profesionalesRes.data.data[i].id,
                apellido: profesionalesRes.data.included[i].attributes.apellidos,
                nombre: profesionalesRes.data.included[i].attributes.nombres,
                legajo: profesionalesRes.data.data[i].attributes.legajo
            }

            profesionales.push(obj)
        }

        res.send(profesionales)

    } catch (error) {
        next(error)
    }
})

/* agendas */

router.get('/agendas', async (req, res, next) => {

    const { idProfesional } = req.query

    try {

        const agenda = []
        
        function obtenerFechas(fechaInicio, fechaFin, diaSemanal) {
            const fechas = [];
            const inicio = new Date(fechaInicio);
            const fin = new Date(fechaFin);
            
            if (diaSemanal < 1 || diaSemanal > 7) {
                throw new Error("El día de la semana debe estar entre 1 (domingo) y 7 (sábado)");
            }
            
            let fechaActual = new Date(inicio);
            
            while (fechaActual <= fin) {
                if (fechaActual.getDay() === (diaSemanal % 7)) {
                    fechas.push(new Date(fechaActual));
                }
                fechaActual.setDate(fechaActual.getDate() + 1);
            }
            
            return fechas.map(date => date.toISOString().split('T')[0]);
        }

        const agendaProfesional = await axios.get(`https://diagnosticar.alephoo.com/api/v3/admision/agendas?filter[personal]=${idProfesional}`, {
            headers: {
                "Authorization": `Basic YWJhbmVnYXM6RGlhZzEyMyE=`
            }
        })

        for (let i = 0; i < agendaProfesional.data.data.length; i++) {
            const obj = {
            }

            agenda.push(obj)
        }

        res.send(agendaProfesional)

    } catch (error) {
        next(error)
    }
})


router.get('/turnosdisponibles', async (req, res, next) => {

    const {
        institucion,
        especialidad,
        profesional,
        fechaInicio
    } = req.query

    try {

        const turnos = []

        const turnosRes = await axios.get(`https://diagnosticar.alephoo.com/api/v3/admision/turnos/disponibles?filter[instituciones]=${institucion}&filter[especialidades]=${especialidad}&filter[profesionales]=${profesional}&filter[fecha]=${fechaInicio}&filter[incluirAdHoc]=false&offset=1&meta[incluirAgendasSinTurnosDisponibles]=0&meta[ignorarReglas]=0`, {
            headers: {
                "Authorization": `Basic YWJhbmVnYXM6RGlhZzEyMyE=`
            }
        })

        for (let i = 0; i < turnosRes.data.data.length; i++) {
            const obj = {
                id: i,
                fecha: turnosRes.data.data[i].attributes.fecha,
                hora: turnosRes.data.data[i].attributes.hora
            }

            turnos.push(obj)
        }

        res.send(turnosRes.data.data)

    } catch (error) {
        next(error)
    }
})

router.post('/turno', async (req, res, next) => {
    try {
        const { dni, pw } = req.body

        const body = {
            "data": {
                "type": "Admision\\Turnoprogramado",
                "id": null,
                "attributes": {
                    "hora": "09:40",
                    "fecha": "2025-04-01",
                    "orden": 2,
                    "sobreturno": false,
                    "observacion": null
                },
                "relationships": {
                    "agenda": {
                        "data": {
                            "type": "Admision\\Agenda",
                            "id": 2981
                        },
                        "links": {
                            "self": "https://diagnosticar.alephoo.com/api/v3/admision/agendas/2981"
                        }
                    },
                    "persona": {
                        "data": {
                            "id": 145533,
                            "type": "Admin\\Persona"
                        }
                    },
                    "consulta": {
                        "data": null
                    },
                    "institucion": {
                        "data": null
                    },
                    "estadoTurno": {
                        "data": null
                    },
                    "bonos": [],
                    "estudios": [],
                    "especialidad": {
                        "type": "Admin\\Especialidad",
                        "id":36,
                        "attributes": {
                            "nombre":"Odontología",
                            "esGrupal":false,
                            "esUrgencia":false,
                            "esEquipo":false
                        }
                    }
                }
            }
        }

        if (!dni || !pw) {
            res.send('Completar todos los campos.')
        } else {
            const user = await axios.post(`https://diagnosticar.alephoo.com/api/v3/admin/profesionales?filter[especialidades]=${idEspecialidad}`, body, {
                headers: {
                    "Authorization": `Basic YWJhbmVnYXM6RGlhZzEyMyE=`
                }
            })
            if (user.length > 0) {
                user[0] = user[0].toJSON()
                if (user[0].pw == pw) {
                    delete user[0].pw
                    res.send(user[0])
                } else {
                    res.send("Contraseña incorrecta.")
                }
            } else {
                res.send("Usuario no existe")
            }
        }
    } catch (error) {
        next(error)
    }
})

/* put turnos */

/* delete turnos */


module.exports = router;