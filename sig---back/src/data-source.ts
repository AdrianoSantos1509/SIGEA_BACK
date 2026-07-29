import "reflect-metadata";
import { DataSource } from "typeorm";

import { User } from "./entities/user";
import { Classroom } from "./entities/classroom"
import { Course } from "./entities/course"
import { Occupancy } from "./entities/occupancy"
import { Coordinator } from "./entities/coordinator"
import { Building } from "./entities/building"

require("dotenv").config();

export const AppDataSource = new DataSource({
    type: "mysql",
    host: process.env.DB_HOST,
    port: 3306,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    synchronize: true,
    logging: false,
    entities: [User, Classroom, Course, Occupancy, Coordinator, Building],
    migrations: [],
    subscribers: [],
})