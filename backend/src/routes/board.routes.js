import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import {
    createBoard,
    getBoards,
    getBoardById,
    deleteBoard
} from "../controllers/board.controller.js";

const router = Router();

router.use(verifyJWT);

router.post("/",createBoard);
router.get("/",getBoards);
router.get("/:boardId",getBoardById);
router.delete("/:boardId",deleteBoard);

export default router 