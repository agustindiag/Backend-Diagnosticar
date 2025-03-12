const app = require('./src/app');
const { sequelize } = require('./src/db');
const { loadDb } = require('./src/db')

app.listen(process.env.PORT, () => {
  console.log(`Server listening on port ${process.env.PORT}`);
  sequelize.sync({ force: false}).then(() => {
    console.log('Modelos sincronizados');
  })
});