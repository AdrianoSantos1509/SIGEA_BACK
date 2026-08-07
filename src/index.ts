import { UserRoutes } from "./routes/user";
// import { ClassroomRoutes } from "./routes/classroom";

import { AppDataSource } from "./data-source";
import { encryptData } from "./middleware/bcrypt.middleware";
const express = require("express");
const app = express();

app.use(express.json());
app.use("/users", UserRoutes);
// app.use("/classroom",ClassroomRoutes)

import { generateToken, verifyToken } from "./middleware/token.middleware";
import { Classroom } from "./entities/classroom";

AppDataSource.initialize().then(async () => {
	console.log("database connected");
}).catch(error => console.log(error))

app.listen(3300, ()=>{console.log("server running on 3300")});
