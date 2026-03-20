import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import { createCard , moveCard } from "../controllers/card.controller.js";

const router = Router();

router.use(verifyJWT);

// create card
router.post("/", createCard);

// move card (drag & drop)
router.patch("/move", moveCard);

export default router;