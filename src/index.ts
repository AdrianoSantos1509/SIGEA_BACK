import { UserRoutes } from "./routes/user";
// import { ClassroomRoutes } from "./routes/classroom";

import { AppDataSource } from "./data-source";
const express = require("express");
const app = express();

app.use(express.json());
app.use("/users", UserRoutes);
// app.use("/classroom",ClassroomRoutes)

<<<<<<< HEAD
import { generateToken, verifyToken } from "./middleware/token.middleware";
import { Classroom } from "./entities/classroom";

=======
>>>>>>> 32f76044120a14f7181739d0e4e9d70a990c5528
AppDataSource.initialize().then(async () => {
	console.log("database connected");
}).catch(error => console.log(error))

app.listen(3300, ()=>{console.log("server running on 3300")});
