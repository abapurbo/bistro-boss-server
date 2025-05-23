require('dotenv').config()
const stripe = require('stripe')(process.env.STRIPE_PAYMENT_SECRETE)
const jwt = require('jsonwebtoken');
const express = require('express')
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000;

app.use(express.json())
app.use(cors())

// jwt verify token
const verifyToken = (req, res, next) => {
    if (!req.headers.authorization) {
        return res.status(401).send({ message: 'Unauthorized access' })
    }
    const token = req.headers.authorization.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'Unauthorized access' })
        }
        req.decoded = decoded
        next()
    })

}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kggqf0n.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`

const client = new MongoClient(uri, {
    serverAPI: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
})

const run = async () => {
    try {
        await client.connect()
        const userCollection = client.db('bistroDB').collection("users")
        const orderCollection = client.db('bistroDB').collection("menu")
        const reviewCollection = client.db('bistroDB').collection("reviews")
        const CartCollection = client.db('bistroDB').collection('carts')
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({ token })
        })
        app.post('/create-payment-intent', async (req, res) => {
            const {price}= req.body;
            const amount = parseInt(price * 100);
            const paymentIntent=await stripe.paymentIntent.create({
                amount:amount,
                currency:'usd',
                payment_method_types:['card']
            });
            res.send({
                clientSecret:paymentIntent.client_secret
            })
        })
        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email };
            const user = await userCollection.findOne(query);
            const isAdmin = user?.role === 'admin';
            if (!isAdmin) {
                return res.status(403).send({ message: 'Forbidden access' })
            }
            next()
        }

        app.get('/menus', async (req, res) => {
            const menu = await orderCollection.find().toArray()
            res.send(menu)
        })

        app.post('/menus', verifyToken, verifyAdmin, async (req, res) => {
            const item = req.body;
            const result = await orderCollection.insertOne(item);
            res.send(result);
        })
        app.get('/reviews', async (req, res) => {
            const review = await reviewCollection.find().toArray()
            res.send(review)
        })
        app.get('/carts', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const result = await CartCollection.find(query).toArray()
            res.send(result)
        })
        app.get('/users', verifyToken, async (req, res) => {
            const result = await userCollection.find().toArray();
            res.send(result)
        })
        app.get('/users/admin/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            let admin = false;
            if (email !== req.decoded.email) {
                return res.status(403).send({ message: 'Forbidden access' });
            }
            const user = await userCollection.findOne(query)
            if (user) {
                admin = user?.role === 'admin'
            }
            res.send({ admin });
        })
        app.get('/menus/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: id };
            const result = await orderCollection.findOne(query);
            res.send(result)
        })
        // insert users database
        app.post('/users', async (req, res) => {
            const user = req.body
            const query = { email: user.email };
            const existingUser = await userCollection.findOne(query)
            if (existingUser) {
                return res.send({ message: 'User already exists', insertedId: null })
            }
            const result = await userCollection.insertOne(user)
            res.send(result)
        })
        app.patch('/menus/:id', verifyToken, verifyAdmin, async (req, res) => {
            const id = req.params.id
            console.log(id)
            const menu = req.body;
            console.log(menu)
            const filter = { _id: id };
            const updateDoc = {
                $set: {
                    name: menu.name,
                    recipe: menu.recipe,
                    image: menu.image,
                    price: menu.price,
                    category: menu.category
                }
            }
            const result = await orderCollection.updateOne(filter, updateDoc);
            res.send(result);
        })
        app.patch('/users/admin/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updateAdmin = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await userCollection.updateOne(filter, updateAdmin);
            res.send(result)
        })
        app.delete('/menus/:id', verifyToken, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const query = { _id: id };;
            const result = await orderCollection.deleteOne(query)
            res.send(result)
        })

        app.delete('/users/:id', verifyToken, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await userCollection.deleteOne(query);
            console.log(result)
            res.send(result)
        })
        // cart section
        app.post('/cart', async (req, res) => {
            const menuCart = req.body;
            const result = await CartCollection.insertOne(menuCart)
            res.send(result)
        })
        app.delete('/carts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await CartCollection.deleteOne(query)
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
