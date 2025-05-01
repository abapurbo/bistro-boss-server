require('dotenv').config()
const express = require('express')
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000;

app.use(express.json())
app.use(cors())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kggqf0n.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`

const client = new MongoClient(uri,{
    serverAPI: {
        version: ServerApiVersion.v1,
        stric: true,
        deprecationErrors: true,
    }
})

const run = async () => {
    try {
        await client.connect()
        const  orderCellection=client.db('bistroDB').collection("menu")
        app.get('/menu',async(req,res)=>{
            const menu=await orderCellection.find().toArray()
            res.send(menu)
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
