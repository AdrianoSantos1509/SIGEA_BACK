import { UserService } from "../services/user";

const userService = new UserService();

export class UserController {
  async create(req: any, res: any) {
    try {
      const { name, email, password, regNumber, role } = req.body;
      return res.status(201).json(await userService.create(name, password, email, regNumber, role));
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  async checkUser(req: any, res: any) {
    const result = await userService.checkUser(req.body.email, req.body.password);
    if (!result) return res.status(401).json({ message: "E-mail ou senha incorretos" });
    return res.json(result);
  }

  async changePassword(req: any, res: any) {
    try {
      const result = await userService.changePassword(Number(req.user.id), req.body.currentPassword, req.body.newPassword);
      return res.json(result);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }
}
