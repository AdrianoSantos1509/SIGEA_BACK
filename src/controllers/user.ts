import { UserService } from "../services/user";

const userService = new UserService();

export class UserController{

       async create(req: any, res: any) : Promise<any>{
       	     const {name, email, password, reg_number} = req.body;
	     const user = await userService.create(name, password, email, reg_number);
	     return res.json(user);
       }

       async checkUser(req: any, res: any) : Promise<any>{
       	     const { email, password } = req.body;
       	     const token = await userService.checkUser(email, password);
	     return res.json({token: token});
       }
}