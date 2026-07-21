import dotenv from "dotenv";
dotenv.config({path:'./.env'});
import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
import connectDB from "./db/index.js";
import { app } from "./app.js";

connectDB()
.then(() =>{
    app.on("error",(error)=>{
        console.log("App Error:",error)
        throw error
    })
    app.listen(process.env.PORT || 8000,() =>{
        console.log(`Server running on port ${process.env.PORT}`)
    });
}).catch((err) =>{
    console.log("MongoDb connection failed!!!! ",err)
})