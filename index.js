const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
const port = process.env.PORT || 5000;

const app = express();
const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions)); // Pass the corsOptions object directly here
app.use(express.json()); // Call express.json() as a function

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ml8mugs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    //   await client.connect();


     // Connect to the "insertDB" database and access its "haiku" collection
     const productsCollection = client.db('productsDB').collection('product')

     app.get('/products', async(req, res) => {
      const result = await productsCollection.find().toArray()
      res.send(result)
     })

     // Insert the defined document into the "haiku" collection
    // const result = await haiku.insertOne(doc);

    // save queries
    app.post('/add-queries', async(req, res)=> {
      const addQueriesData = req.body;
      const result = await productsCollection.insertOne(addQueriesData);
      res.send(result)
      
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    //   await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello APIS Server!");
});

app.listen(port, () => {
  console.log(`APIS app listening on port ${port}`);
});
