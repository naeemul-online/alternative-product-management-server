const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;

const app = express();
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "https://apis-client-b6bf1.web.app",
    "https://inspiring-kringle-fae69d.netlify.app",
  ],
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions)); // Pass the corsOptions object directly here
app.use(express.json());
app.use(cookieParser()); // Call express.json() as a function

// verify jwt middleware
const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).send({ message: "Unauthorized access" });
  if (token) {
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        console.log(err);
        return res.status(401).send({ message: "Unauthorized access" });
      }
      // console.log(decoded);
      req.user = decoded;
      next();
    });
  }
};

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
    const productsCollection = client.db("productsDB").collection("product");
    const recommendsCollection = client
      .db("productsDB")
      .collection("recommend");

    // console.log(process.env.ACCESS_TOKEN_SECRET)
    // -------------------------------
    // //creating Token
    // app.post("/jwt", logger, async (req, res) => {
    //   const user = req.body;
    //   console.log("user for token", user);
    //   const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);

    //   res.cookie("token", token, cookieOptions).send({ success: true });
    // });

    // //clearing Token
    // app.post("/logout", async (req, res) => {
    //   const user = req.body;
    //   console.log("logging out", user);
    //   res
    //     .clearCookie("token", { ...cookieOptions, maxAge: 0 })
    //     .send({ success: true });
    // });

    // ---------------------

    // jwt generate
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "30d",
      });

      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    // clear token
    app.get("/logout", (req, res) => {
      res
        .clearCookie("token", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
          maxAge: 0,
        })
        .send({ success: true });
    });

    // save queries from add queries form
    app.post("/add-queries", async (req, res) => {
      const addQueriesData = req.body;
      const result = await productsCollection.insertOne(addQueriesData);
      res.send(result);
    });

    // get all queries in the queries routs
    app.get("/products", async (req, res) => {
      const result = await productsCollection.find().toArray();
      res.send(result);
    });

    // get all queries added by specified user by email
    app.get("/products/:email", verifyToken, async (req, res) => {
      const tokenEmail = req.user.email;

      const email = req.params.email;
      if (tokenEmail !== email) {
        return res.status(403).send({ message: "Forbidden access" });
      }
      const query = { "user.email": email };
      const result = await productsCollection.find(query).toArray();
      res.send(result);
    });

    // update queries added by specified user by email
    app.get("/update/:id", async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await productsCollection.findOne(query);
      res.send(result);
    });

    // update queries added by specified user by email
    app.put("/update/:id", async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };
      const formData = req.body;
      const options = { upsert: true };

      const updateDoc = {
        $set: {
          ...formData,
        },
      };
      const result = await productsCollection.updateOne(
        query,
        updateDoc,
        options
      );
      res.send(result);
    });

    // delete all queries data added by specified user by email
    app.delete("/product/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productsCollection.deleteOne(query);
      res.send(result);
    });

    // save recommend data in database
    app.post("/recommend", verifyToken, async (req, res) => {
      const recommend = req.body;
      const result = await recommendsCollection.insertOne(recommend);
      res.send(result);
    });

    // get all queries added by specified user by email to show in the comment section
    app.get("/recommend/:email", async (req, res) => {
      const email = req.params.email;
      // console.log(email)
      const query = { recommenderEmail: email };
      // console.log(query)
      const result = await recommendsCollection.find(query).toArray();
      // console.log(result)
      res.send(result);
    });

    // get all queries to see recommendation for me page by email
    app.get("/recommendForMe/:email", async (req, res) => {
      const email = req.params.email;
      // console.log(email)
      const query = { userEmail: email };
      // console.log(query)
      const result = await recommendsCollection.find(query).toArray();
      // console.log(result)
      res.send(result);
    });

    // delete recommend data added by specified user by email
    app.delete("/my-recommend/:id", async (req, res) => {
      const id = req.params.id;
      // console.log(id)
      const query = { _id: new ObjectId(id) };
      console.log(query);
      const result = await recommendsCollection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
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
