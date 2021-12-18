

// mod.cjs
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const express = require('express');
const redis = require('redis');

const swaggerJSDoc =  require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express'); 




const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.env.REDIS_PORT || 6379;


const client = redis.createClient(REDIS_PORT);

const app = express();

const setResponse = (username, repos) => {
    return `<h1> ${username} has ${repos} </h1>`
}


const cashed = (req, res, next) => {
    const {username} = req.params;

    client.get(username, (err, data) => {
        if (err) throw err;
        if (data !== null){
            res.status(200).send(setResponse(username, data));
        }else{
            next();
        }
    })
}

const swaggerOptions = {
    swaggerDefinition : {
        info : {
            title : "REDIS-TUTS",
            description : "fetching data from github and cash in redis",
            contact : {
                name : "Amr"
            },
            servers : ["http://localhost:5000"],
        }
    },
    apis : ['index.js']
};

const swaggerDocs = swaggerJSDoc(swaggerOptions);

app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs));









// Routes
/**
 * @swagger
 * /repos/{username}:
 *  get:
 *    parameters:
 *      - in: path
 *        name: username
 *        required: true
 *        type: string
 *        description: The UserName
 *    description: Use to request all customers
 *    responses:
 *      '200':
 *        description: A successful response
 *      '500':
 *        description: Internal Server Error
 */ 
app.get('/repos/:username', cashed,async(req, res, next) => {
    try{
        const {username} = req.params;
        const response = await fetch(`https://api.github.com/users/${username}`);
        const data = await response.json();
        const repos = data["public_repos"];
        //console.log(repos);
        client.setex(username, 60 * 60, repos);  // (key, expiredAt, value)   
        res.status(200).send(setResponse(username, repos));
    }catch(err){
        console.log(err);
        res.status(500);
    }
})



app.listen(PORT, () => {
    console.log(`server is listening to port ${PORT}`)
})


