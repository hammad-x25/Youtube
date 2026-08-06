import dotenv from "dotenv"
import { DBconnect } from "./db/index.js"
import { app } from "./app.js"

dotenv.config()
DBconnect();
app.listen(8000,()=>{
  console.log(`app is listening on port 8000`)
})

