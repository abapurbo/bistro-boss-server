require('dotenv').config()
const express = require('express')
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000;

app.use(express.json())
app.use(cors())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kggqf0n.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`

const client = new MongoClient(uri, {
    serverAPI: {
        version: ServerApiVersion.v1,
        stric: true,
        deprecationErrors: true,
    }
})

const run = async () => {
    try {
        await client.connect()
        const orderCollection = client.db('bistroDB').collection("menu")
        const reviewCollection = client.db('bistroDB').collection("reviews")
        const CartCollection = client.db('bistroDB').collection('carts')
        app.get('/menus', async (req, res) => {
            const menu = await orderCollection.find().toArray()
            res.send(menu)
        })
        app.get('/reviews', async (req, res) => {
            const review = await reviewCollection.find().toArray()
            res.send(review)
        })
        app.get('/carts', async(req,res)=>{
            const result=await CartCollection.find().toArray()
            res.send(result)
        })
        app.post('/cart', async (req, res) => {
            const menuCart = req.body;
            const result = await CartCollection.insertOne(menuCart)
            res.send(result)
        })
        await client.db("admin").command({ ping: 1 });
        console.log("Mongodb database successfully connected......")
    }

    catch (error) {
        console.log('Error', error)
    }
}
run().catch(console.dir)
app.get('/', (req, res) => {
    res.send('Server side is running');
})
app.listen(port, () => {
    console.log('server side is running', port)
})
