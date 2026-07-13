require('dotenv').config();
const express = require('express');

const app = express();

app.get("/",(req,res)=>{
    res.send("Welocome !");
})

const PORT = process.env.PORT || 5000;
const ENVIRONMENT = process.env.NODE_ENV || 'development';

app.listen(5000,()=>{
    console.log(`server is running on port no ${5000}`);
});