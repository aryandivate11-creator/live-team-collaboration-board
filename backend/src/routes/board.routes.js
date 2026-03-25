import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import {
    createBoard,
    getBoards,
    getBoardById,
    deleteBoard,
    updateBoard,
    addMember,
    updateMemberRole,
    removeMember
} from "../controllers/board.controller.js";

const router = Router();

router.use(verifyJWT);

router.post("/",createBoard);
router.get("/",getBoards);
router.get("/:boardId",getBoardById);
router.delete("/:boardId",deleteBoard);
router.patch("/:boardId", updateBoard);
router.post("/:boardId/members",addMember);
router.patch("/:boardId/members/:userId",updateMemberRole);
router.delete("/:boardId/members/:userId",removeMember);

export default router 