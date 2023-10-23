var cors = require("cors")
var express = require("express")
var app = express()


const { Pool } = require('pg')
const pool = new Pool({
  connectionString: "postgres://qxybxezzfhmdvk:701483b1359b1f4a04c3d12cfa4d0fdb0fc3337c9b2bfd187615bf62d6907366@ec2-44-213-228-107.compute-1.amazonaws.com:5432/da4e0tc0hd77ch",
  ssl: {
    rejectUnauthorized: false
  }
})

var bodyParser = require("body-parser");

app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var HTTP_PORT = 5000
app.listen(process.env.PORT || 5000, () => {
    console.log("Server running on port %PORT%".replace("%PORT%",HTTP_PORT))
});



app.post('/api/login', async (req, res) => {
  try {
    const data = {
      email: req.body.email,
      password : req.body.password
    }

    const client = await pool.connect();
    const result = await client.query("SELECT * FROM users WHERE email = '" + data.email + "' AND password = MD5('" + data.password + "')  LIMIT 1");
    const results = result.rows;

    let result_vehicles = [];
    if (results.length != 0) {
      const result_vehicle = await client.query("SELECT * FROM vehicles WHERE driver_id = '" + result.rows[0].id + "'");
      result_vehicles = result_vehicle.rows;
    }
    
    client.release();

    if (results.length != 0) {
      res.json({
        "message":"Success",
        "data": {
          "user" :results,
          "vehicle": result_vehicles
        }
      })
    } else {
      res.json({
        "message":"Invalid Username and Password",
        "data": 0
      })
    }

    } catch (err) {
      console.error(err);
      res.json({
        "message":"Error",
        "data": err
      })
    }
})


app.post('/api/signup', async (req, res) => {
  try {
    const data = {
      name: req.body.name,
      email: req.body.email,
      password : req.body.password,
      birthday : req.body.birthday,
      gender : req.body.gender,
      phone : req.body.phone,
      address : req.body.address,
    }

    const client = await pool.connect();
    const result = await client.query("INSERT INTO users (name, email, password, birthday, gender, phone, address) VALUES ('" + data.name +"', '"+ data.email +"', MD5('" + data.password +"') , '"+ data.birthday +"', '"+ data.gender +"' , '"+ data.phone +"' , '"+ data.address +"')");
    const results = { 'results': (result) ? result.rows : null};
    client.release();

    res.json({
      "message":"success",
      "data": results
    })

    } catch (err) {
      console.error(err);
      res.json({
        "message":"Error",
        "data": err
      })
    }
})


app.post('/api/book_ride', async (req, res) => {
  try {
    const data = {
      ride_id: req.body.ride_id,
      passenger_id : req.body.passenger_id,
      pax: req.body.pax,
      driver_id: req.body.driver_id
    }

    const client = await pool.connect();
    const result = await client.query("INSERT INTO bookings (ride_id, passenger_id, driver_id) VALUES ('" + data.ride_id +"', '"+ data.passenger_id +"', '"+ data.driver_id +"')");
    const results = { 'results': (result) ? result.rows : null};

    await client.query("UPDATE rides SET pax = '" + data.pax + "' WHERE id = '" + data.ride_id + "'");
    client.release();

    res.json({
      "message":"success",
      "data": results
    })

    } catch (err) {
      console.error(err);
      res.json({
        "message":"Error",
        "data": err
      })
    }
})

app.post('/api/update_ride', async (req, res) => {
  try {
    const data = {
      ride_id: req.body.ride_id,
      status : req.body.status
    }

    const client = await pool.connect();

    const result = await client.query("UPDATE rides SET status = '" + data.status + "' WHERE id = '" + data.ride_id + "'");
    const results = { 'results': (result) ? result.rows : null};
    client.release();

    res.json({
      "message":"success",
      "data": results
    })

    } catch (err) {
      console.error(err);
      res.json({
        "message":"Error",
        "data": err
      })
    }
})


app.post('/api/create_ride', async (req, res) => {
  try {
    const data = {
      start_location: req.body.start_location,
      end_location: req.body.end_location,
      date: req.body.date,
      time: req.body.time,
      driver_id: req.body.driver_id,
      vehicle_id: req.body.vehicle_id,
      status: req.body.status,
      start_google_place_id: req.body.start_google_place_id,
      end_google_place_id: req.body.end_google_place_id,
      price: req.body.price,
      distance: req.body.distance,
      pax: req.body.pax,
      estimated_travel: req.body.estimated_travel,
    }

    const client = await pool.connect();
    const result = await client.query(
      "INSERT INTO rides (start_location, end_location, date, time, driver_id, vehicle_id, status, start_google_place_id, end_google_place_id, price, distance, pax, estimated_travel) VALUES ('" + data.start_location +"', '"+ data.end_location + "', '" + data.date + "', '"+ data.time + "', '"+ data.driver_id + "', '"+ data.vehicle_id + "', '"+ data.status + "' , '"+ data.start_google_place_id + "' , '"+ data.end_google_place_id + "' , '"+ data.price + "' , '"+ data.distance + "' , '"+ data.pax + "', '" + data.estimated_travel + "' )"
    );
    const results = { 'results': (result) ? result.rows : null};
    client.release();

    res.json({
      "message":"success",
      "data": results
    })

    } catch (err) {
      console.error(err);
      res.json({
        "message":"Error",
        "data": err
      })
    }
})


app.get('/api/search_rides', async (req, res) => {
  try {
    const data = {
      origin_city: req.query.origin_city, 
      destination_city: req.query.destination_city,
      date: req.query.date,
      pax: req.query.pax,
    }
    console.log(data)

    const client = await pool.connect();
    const result = await client.query(
      "SELECT *, rides.id AS ride_id FROM rides LEFT JOIN vehicles ON rides.vehicle_id = vehicles.id LEFT JOIN users AS users ON rides.driver_id = users.id WHERE date = '" + data.date + "' AND start_google_place_id LIKE '%" + data.origin_city + "%' AND end_google_place_id LIKE '%" + data.destination_city + "%' AND pax >='" + data.pax + "' AND status = 'published' ORDER BY rides.id DESC"
    );
    const results = { 'results': (result) ? result.rows : null};
    client.release();

    res.json({
      "message":"success",
      "data": results
    })

    } catch (err) {
      console.error(err);
      res.json({
        "message":"Error",
        "data": err
      })
    }
})


app.get('/api/get_rides_status_passenger', async (req, res) => {
  try {
    const data = {
      passenger_id: req.query.passenger_id,
      status: req.query.status
    }
    console.log(data)

    const client = await pool.connect();
    const result = await client.query("SELECT *, users.name AS driver_name  FROM rides LEFT JOIN bookings ON bookings.ride_id = rides.id LEFT JOIN vehicles ON vehicles.id = rides.vehicle_id LEFT JOIN users ON rides.driver_id = users.id  WHERE rides.status = '" + data.status + "' AND passenger_id = '" + data.passenger_id + "' ORDER BY rides.id DESC");
    const results = { 'results': (result) ? result.rows : null};
    client.release();

    res.json({
      "message":"success",
      "data": results
    })

    } catch (err) {
      console.error(err);
      res.json({
        "message":"Error",
        "data": err
      })
    }
})


app.get('/api/get_rides_status_driver', async (req, res) => {
  try {
    const data = {
      driver_id: req.query.driver_id,
      status: req.query.status
    }

    const client = await pool.connect();
    const rides = await client.query("SELECT * FROM rides WHERE status = '" + data.status + "' AND driver_id = '" + data.driver_id + "' ORDER BY id DESC");

    const bookings = await client.query("SELECT * FROM users LEFT JOIN bookings ON users.id = bookings.passenger_id WHERE bookings.driver_id = '" + data.driver_id + "' ORDER BY bookings.id DESC");
    client.release();

    console.log(bookings.rows)
    const results = rides.rows.map((ride) => {
      return {
        "id": ride.id,
        "start_location": ride.start_location,
        "end_location": ride.end_location,
        "date": ride.date,
        "time": ride.time,
        "status": ride.status,
        "start_google_place_id": ride.start_google_place_id,
        "end_google_place_id": ride.end_google_place_id,
        "price": ride.price,
        "distance": ride.distance,
        "pax": ride.pax,
        "vehicle_id": ride.vehicle_id,
        "driver_id": ride.driver_id,
        "bookings": bookings.rows.filter((booking) => {
          if (ride.id == booking.ride_id) {
            return {
              id: booking.id,
              email: booking.email,
              name: booking.name,
              birthday: booking.birthday,
              gender: booking.gender,
              phone: booking.phone,
              address: booking.address,
              ride_id: booking.ride_id,
              passenger_id: booking.passenger_id,
              driver_id: booking.driver_id
            }
          }
        })
    }
    });

    res.json({
      "message":"success",
      "data": results
    })

    } catch (err) {
      console.error(err);
      res.json({
        "message":"Error",
        "data": err
      })
    }
})

app.post('/api/create_vehicle', async (req, res) => {
  try {
    const data = {
      name: req.body.name,
      type: req.body.type,
      seats: req.body.seats,
      driver_id: req.body.driver_id,
    }

    console.log(data)

    const client = await pool.connect();
    const result = await client.query(
      "INSERT INTO vehicles (name, type, seats, driver_id) VALUES ('" + data.name +"', '"+ data.type + "', '" + data.seats + "', '"+ data.driver_id + "')"
    );
    const result_vehicles = await client.query(
      "SELECT * FROM vehicles WHERE driver_id = '"+ data.driver_id +"'"
    );
    const results = { 'results': (result_vehicles) ? result_vehicles.rows : null};
    client.release();

    res.json({
      "message":"success",
      "data": results
    })

    } catch (err) {
      console.error(err);
      res.json({
        "message":"Error",
        "data": err
      })
    }
})

app.get('/api/get_vehicle', async (req, res) => {
  try {
    const data = {
      driver_id: req.query.driver_id,
    }

    console.log(data)

    const client = await pool.connect();
    const result = await client.query(
      "SELECT * FROM vehicles WHERE driver_id = '"+ data.driver_id +"'"
    );
    const results = { 'results': (result) ? result.rows : null};
    client.release();

    res.json({
      "message":"success",
      "data": results
    })

    } catch (err) {
      console.error(err);
      res.json({
        "message":"Error",
        "data": err
      })
    }
})

app.post('/api/update_users', async (req, res) => {
  try {
    const data = {
      user_id: req.body.user_id,
      email: req.body.email,
      name: req.body.name,
      birthday: req.body.birthday,
      gender: req.body.gender,
      phone: req.body.phone,
      address: req.body.address,
    }

    console.log(data)

    const client = await pool.connect();
    const result = await client.query(
      "UPDATE users SET email =  '" + data.email +"', name = '" + data.name +"', gender = '" + data.gender +"', phone = '" + data.phone +"', birthday = '" + data.birthday +"', address = '" + data.address +"' WHERE id = '" + data.user_id +"'"
    );
    const result_users = await client.query(
      "SELECT * FROM users WHERE id = '"+ data.user_id +"'"
    );
    const results = { 'results': (result_users) ? result_users.rows : null};
    client.release();

    res.json({
      "message":"success",
      "data": results
    })

    } catch (err) {
      console.error(err);
      res.json({
        "message":"Error",
        "data": err
      })
    }
})


// Root path
app.get("/", (req, res, next) => {
    res.json({"message":"Ok"})
});