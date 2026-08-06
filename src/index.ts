import { UserRoutes } from "./routes/user";

import { AppDataSource } from "./data-source";
const express = require("express");
const app = express();

app.use(express.json());
app.use("/users", UserRoutes);

AppDataSource.initialize().then(async () => {
	console.log("database connected");
}).catch(error => console.log(error))

app.listen(3300, ()=>{console.log("server running on 3300")});
