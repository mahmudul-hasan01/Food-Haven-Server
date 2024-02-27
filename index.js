const express = require('express')
const app = express()
const cors = require('cors')
const jwt = require('jsonwebtoken')
require('dotenv').config()
const stripe = require('stripe')(process.env.Stripe_Secret_key)
const port = process.env.PORT || 5000

app.use(cors({
  origin: [
    'http://localhost:5173'
  ],
  credentials: true,
}))
app.use(express.json())



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { default: Stripe } = require('stripe')
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
    const payments = client.db("BistroDB").collection("payments");

    // jwt
    app.post('/jwt', async (req, res) => {
      const user = req.body
      const token = jwt.sign(user, process.env.JWT_TOKEN, { expiresIn: '1h' })
      res.send({ token })
    })
    // verify token
    const verifyToken = (req, res, next) => {
      if (!req.headers.authorization) {
        return res.status(401).send({ massege: 'unauthorized access' })
      }
      const token = req.headers.authorization.split(' ')[1]
      jwt.verify(token, process.env.JWT_TOKEN, (err, decoded) => {
        if (err) {
          return res.status(401).send({ massege: 'unauthorized access' })
        }
        req.decoded = decoded
        next()
      })
    }

    // verify admin 
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email
      const query = { email: email }
      const user = await users.findOne(query)
      const isAdmin = user?.role === 'admin'
      if (!isAdmin) {
        return res.status(403).send({ massege: 'forbidden access' })
      }
      next()
    }

    // Users
    app.get('/users', verifyToken, verifyAdmin, async (req, res) => {
      const result = await users.find().toArray()
      res.send(result)
    })

    app.get('/users/admin/:email', verifyToken, async (req, res) => {
      const email = req.params.email
      if (email !== req.decoded.email) {
        return res.status(403).send({ massege: 'forbidden access' })
      }
      const query = { email: email }
      const user = await users.findOne(query)
      const admin = user?.role === 'admin'
      res.send({ admin })
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

    app.patch('/users/admin/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set: {
          role: 'admin'
        }
      }
      const result = await users.updateOne(query, updatedDoc)
      res.send(result)
    })

    app.delete('/users/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await users.deleteOne(query)
      res.send(result)
    })

    //menu
    app.get('/menu', async (req, res) => {
      const result = await menu.find().toArray()
      res.send(result)
    })

    app.get('/menu/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await menu.findOne(query)
      res.send(result)
    })

    app.post('/menu', verifyToken, verifyAdmin, async (req, res) => {
      const body = req.body
      const result = await menu.insertOne(body)
      res.send(result)
    })

    app.delete('/menu/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await menu.deleteOne(query)
      res.send(result)
    })

    app.patch('/menu/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set: {
          name: item.name,
          category: item.category,
          price: item.price,
          recipe: item.recipe,
          image: item.image
        }
      }
      const result = await menu.updateOne(query, updatedDoc)
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

    // PayMent

    app.post('/payment', async (req, res) => {
      const payment = req.body
      const paymentResult = await payments.insertOne(payment)
      const query = {
        _id: {
          $in: payment.cartIds.map(id => new ObjectId(id))
        }
      }
      const deleteResult = await cart.deleteMany(query)
      res.send({paymentResult,deleteResult})
    })

    app.post('/payment-intent', async (req, res) => {
      const { price } = req.body
      const amount = parseInt(price * 100)
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ['card']
      })
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
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