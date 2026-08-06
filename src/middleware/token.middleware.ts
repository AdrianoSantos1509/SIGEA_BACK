import { User } from "../entities/user";
const jwt = require("jsonwebtoken");
require("dotenv").config({path : __dirname + "/../../.env"});

export function generateToken(user : any) : string{
       	return jwt.sign(user, process.env.TK_PASS);
}

export function verifyToken(token : string) : string{
       	return jwt.verify(token, process.env.TK_PASS);
}