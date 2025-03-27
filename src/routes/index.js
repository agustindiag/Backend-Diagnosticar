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

router.get('/turnos', async (req, res, next) => {

    const { dni } = req.query

    try {

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

        res.send(turnosPaciente.data.data[3])

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

router.get('/turnosdisponibles', async (req, res, next) => {

    const { 
        institucion,
        especialidad,
        profesional,

     } = req.query

    try {

        const turnos = []

        const turnosRes = await axios.get(`https://diagnosticar.alephoo.com/api/v3/admision/turnos/disponibles?filter[instituciones]=${institucion}&filter[especialidades]=${especialidad}&filter[profesionales]=${profesional}&filter[fecha]=2025-03-27&filter[incluirAdHoc]=false&offset=1&meta[incluirAgendasSinTurnosDisponibles]=0&meta[ignorarReglas]=0`, {
            headers: {
                "Authorization": `Basic YWJhbmVnYXM6RGlhZzEyMyE=`
            }
        })

        /* for (let i = 0; i < profesionalesRes.data.data.length; i++) {
            const obj = {
                id: profesionalesRes.data.data[i].id,
                apellido: profesionalesRes.data.included[i].attributes.apellidos,
                nombre: profesionalesRes.data.included[i].attributes.nombres,
                legajo: profesionalesRes.data.data[i].attributes.legajo
            }

            profesionales.push(obj)
        } */

        res.send(`${turnosRes.data.data.length}`)

    } catch (error) {
        next(error)
    }
})

module.exports = router;