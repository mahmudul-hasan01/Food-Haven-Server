const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const port = process.env.PORT || 5000

app.use(cors({
  origin: [
    'http://localhost:5173'
  ],
  credentials: true,
}))
app.use(express.json())



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.USER_ID}:${process.env.USER_PASS}@cluster0.uoehazd.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const users = client.db("BistroDB").collection("Users");
    const menu = client.db("BistroDB").collection("Menu");
    const reviews = client.db("BistroDB").collection("Reviews");
    const cart = client.db("BistroDB").collection("Cart");

    // Users

    app.get('/users', async (req, res) => {
      const result = await users.find().toArray()
      res.send(result)
    })
    app.post('/users', async (req, res) => {
      const user = req.body
      const query = { email: user.email }
      const existingUser = await users.findOne(query)
      if (existingUser) {
        return res.send({ message: 'user already exists', insertedId: null })
      }
      const result = await users.insertOne(user)
      res.send(result)
    })

    //menu
    app.get('/menu', async (req, res) => {
      const result = await menu.find().toArray()
      res.send(result)
    })

    //review
    app.get('/reviews', async (req, res) => {
      const result = await reviews.find().toArray()
      res.send(result)
    })

    //  Cart
    app.get('/carts', async (req, res) => {
      const email = req.query.email
      const query = { email: email }
      const result = await cart.find(query).toArray()
      res.send(result)
    })
    app.post('/carts', async (req, res) => {
      const body = req.body
      const result = await cart.insertOne(body)
      res.send(result)
    })
    app.delete('/carts/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await cart.deleteOne(query)
      res.send(result)
    })


    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {

  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Food Haven')
})

app.listen(port, () => {
  console.log(`Food Haven || ${port}`)
})