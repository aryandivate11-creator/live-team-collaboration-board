import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import { createList , getLists , deleteList} from "../controllers/list.controller.js";

const router = Router();

router.use(verifyJWT);

// create list
router.post("/", createList);

// get lists of a board
router.get("/:boardId", getLists);

router.delete("/:listId",deleteList);

export default router;