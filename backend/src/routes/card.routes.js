import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import { createCard , moveCard , deleteCard , updateCard , getCards, unassignUser} from "../controllers/card.controller.js";

const router = Router();

router.use(verifyJWT);

// create card
router.post("/", createCard);

// move card (drag & drop)
router.patch("/move", moveCard);

router.delete("/:cardId",deleteCard);

router.patch("/:cardId",  updateCard);

router.get("/list/:listId", getCards); 

router.patch("/:cardId/unassign",unassignUser);

export default router;