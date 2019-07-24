const app = require('./app');
const knex = require('knex');
const { PORT, NODE_ENV, DB_URL } = require('./config');

//instantiates database
const db = knex({
  client: 'pg',
  connection: DB_URL,
});

//sets db for global availability
app.set('db', db);

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT} running in ${NODE_ENV} mode`);
});