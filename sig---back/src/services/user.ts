import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { User } from "../entities/user";
import { encryptData, verifyData } from "../middleware/bcrypt.middleware";

export class UserService{
       private readonly userRepo : Repository<User>;

       constructor(){
		this.userRepo = AppDataSource.getRepository(User);
       }

       async create(name : string, password : string, email : string, reg_number : number) : Promise<any>{
       	      const user = new User();
	      
	      const encPass : string = encryptData(password);
	      
	      user.name = name;
	      user.email = email;
	      user.password = encPass;
	      user.reg_number = reg_number;
	      return await this.userRepo.save(user);
       }

       async listOne(id : number) : Promise<any>{
       	     
       }

       async checkUser(_email : string, password : string) : Promise<any>{
       	     const user = await this.userRepo.findOne(
	     	{where:{email: _email}}
	     );

	     if(user){
		if(await verifyData(user.password, password)){
			return user;
		}
	     }
	     return null;
       }
}