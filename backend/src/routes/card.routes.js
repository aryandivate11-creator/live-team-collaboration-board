import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import { createCard , moveCard , deleteCard , updateCard , getCards, unassignUser} from "../controllers/card.controller.js";

const router = Router();

router.use(verifyJWT);

// create card
router.post("/", createCard);

// move card (drag & drop)
router.patch("/move", moveCard);

// must be before /:cardId so "unassign" is not captured as cardId
router.patch("/:cardId/unassign", unassignUser);

router.delete("/:cardId", deleteCard);

router.patch("/:cardId", updateCard);

router.get("/list/:listId", getCards);

export default router;