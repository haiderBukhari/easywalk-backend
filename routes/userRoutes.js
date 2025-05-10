import express from "express";
import {
  addUser,
} from "../controllers/userController.js";
import { verifyOTP, loginUser } from "../services/userService.js";

const router = express.Router();

// User routes
router.post("/", addUser);

router.get("/login", async (req, res) => {
  try {
    const { email, password } = req.query;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await loginUser(email, password);
    res.status(200).json(user);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const { userId, otp } = req.body;
    if (!userId || !otp) {
      return res.status(400).json({ error: "userId and otp are required" });
    }
    const result = await verifyOTP(userId, otp);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.message === "User not found" ? 404 : 
               error.message === "Invalid OTP" ? 400 : 500)
       .json({ error: error.message });
  }
});

export default router;