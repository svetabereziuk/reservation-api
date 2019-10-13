
const express = require('express');
const app = express();
const port = 3002;
const knex = require('knex')({
  client: 'mysql',
  connection: {
    host: '127.0.0.1',
    user: 'root',
    password: 'admin',
    database: 'reservation'
  }
});
const bodyParser = require('body-parser');
const moment = require('moment');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json({
  limit: "8mb",
}));

app.get('/', (req, res) => res.send('Table reservation'));

app.post('/api/reservations', async (req, res, next) => {
  try {
    let start_time = req.body.start_time;
    let duration = req.body.duration;
    let guests = req.body.guests;

    let end_time = moment(start_time, 'YYYY-MM-DD HH:mm:ss').add(duration, 'seconds').format('YYYY-MM-DD HH:mm:ss');

    let table_ids = await knex.select('tables.id').from('tables')
      .leftJoin('reservations', function () {
        this.on('tables.id', '=', 'reservations.table_id')
          .andOnVal('reservations.end_time', '>', start_time)
          .andOnVal('reservations.start_time', '<', end_time)
      })
      .whereNull('reservations.table_id')
      .andWhere('tables.capacity', '>=', guests);

    if (table_ids.length) {
      let table_id = table_ids[0].id;
      let id = await knex('reservations').insert({
        "table_id": table_id,
        "start_time": start_time,
        "end_time": end_time,
        "guests": guests
      });

      res.json({
        id: id[0],
        table_id,
        start_time,
        end_time,
        guests
      });
    }
    else {
      throw new Error('No tables available');
    }
  } catch (e) {
    console.log(e);
    next(e)
  }
})

app.get('/api/reservations/:id', async (req, res) => {
  try {
    let id = req.params.id;
    let reservation = await knex('reservations').where('id', id);
    res.json(reservation)
  } catch (e) {
    console.log(e);
  }
});

app.put('/api/reservations/:id', async (req, res) => {
  try {
    let id = req.params.id;
    let start_time = req.body.start_time;
    let duration = req.body.duration;
    let guests = req.body.guests;

    let end_time = moment(start_time, 'YYYY-MM-DD HH:mm:ss').add(duration, 'seconds').format('YYYY-MM-DD HH:mm:ss');

    await knex('reservations').where('id', id).update({
      "table_id": 1,
      "start_time": start_time,
      "end_time": end_time,
      "guests": guests
    });

    res.json({
      id: id[0],
      start_time,
      end_time,
      guests
    })

  } catch (e) {
    console.log(e);
    next(e)
  }
})

app.delete('/api/reservations/:id', async (req, res) => {
  try {
    let id = req.params.id;
    await knex('reservations').where('id', id).del();
    res.json({
      id,
    })
  } catch (e) {
    console.log(e);
    next(e)
  }
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
module.exports = app;
