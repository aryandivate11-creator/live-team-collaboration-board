import { Router } from "express";
import { searchUsers } from "../controllers/user.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";
const router =  Router();

router.use(verifyJWT);
router.get("/search",searchUsers);

export default router;