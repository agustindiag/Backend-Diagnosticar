const { default: axios } = require('axios');
const { Sequelize, Op } = require('sequelize');
const Pacientes = require('./models/Pacientes.js')

require('dotenv').config();

const {
  DB_USER, DB_PASSWORD, DB_NAME, DB_HOST, DB_DEPLOY
} = process.env


let sequelize = new Sequelize({ 
  database: DB_NAME,
  dialect: "postgres",
  host: DB_HOST,
  port: 5432,
  username: DB_USER,
  password: DB_PASSWORD,
  pool: {
    max: 3,
    min: 1,
    idle: 10000,
  },
  dialectOptions: {
    /* ssl: {
      require: true,
      rejectUnauthorized: false,
    }, */
    keepAlive: true,
  },
  /* ssl: true */
})

console.log(sequelize.models)

Pacientes(sequelize)

console.log(sequelize.models)

const { paciente } = sequelize.models

/* const fn = async () => {
  await paciente.create({
    name: "Agus",
    lname: "Banegas",
    dni: "40811186",
    email: "agus@mail.com",
    phone: "1123456789",
    pw: "Agus123!",
  })
  console.log("object")
}

fn() */

module.exports = {
  ...sequelize.models,
  sequelize,
  Op
}