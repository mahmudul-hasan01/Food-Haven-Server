const express =require('express')
const app =express()
const cors =require('cors')
require('dotenv').config()
const port =process.env.PORT || 5000

app.use(cors({
  origin: [
    'http://localhost:5173'
],
  credentials:true,
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

    const menu = client.db("BistroDB").collection("Menu");
    const reviews = client.db("BistroDB").collection("Reviews");

    app.get('/menu',async(req,res) => {
       const result = await menu.find().toArray()
       res.send(result)
    })
    app.get('/reviews',async(req,res) => {
       const result = await reviews.find().toArray()
       res.send(result)
    })


    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    
  }
}
run().catch(console.dir);


app.get('/',(req,res)=>{
    res.send('Food Haven')
})

app.listen(port,()=>{
    console.log(`Food Haven || ${port}`)
})