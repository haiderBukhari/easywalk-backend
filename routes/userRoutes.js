import express from "express";
import {
  addUser,
  getUserProfile,
  updateUserProfile,
} from "../controllers/userController.js";
import { verifyOTP, loginUser, sendOtpAgain, updateUserDetails, updateUserPassword } from "../services/userService.js";
import { verifyToken } from '../middleware/auth.js';
import bcrypt from "bcrypt";
import { configDotenv } from "dotenv";

configDotenv();

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
    if (error.userId) {
      return res.status(error.status || 403).json({ 
        error: error.message,
        userId: error?.userId 
      });
    }
    res.status(401).json({ error: error.message });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const { userId, otp, email } = req.body;
    if (!otp) {
      return res.status(400).json({ error: "userId and otp are required" });
    }
    const result = await verifyOTP(userId, otp, email);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.message === "User not found" ? 404 : 
               error.message === "Invalid OTP" ? 400 : 500)
       .json({ error: error.message });
  }
});


router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "email is required" });
    }
    const result = await sendOtpAgain(email);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.message === "User not found" ? 404 : 
               error.message === "Invalid OTP" ? 400 : 500)
       .json({ error: error.message });
  }
});

//update the user details
router.put("/update-user", async (req, res) => {
  try {
    const { email, contact_number } = req.body;
    if (!email || !contact_number) {
      return res.status(400).json({ error: "email and contact_number are required" });
    }
    const result = await updateUserDetails(email, contact_number);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//update the user password
router.put("/update-user-password", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
  

    const result = await updateUserPassword(email, hashedPassword);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



router.get("/user-profile", verifyToken, async (req, res) => {
  try {
    const id = req.user.id;

    if (!id) {
      return res.status(400).json({ error: "id is required" });
    }

    const profile = await getUserProfile(id);
    res.status(200).json(profile);
  } catch (error) {
    res.status(error.message === "User not found" ? 404 : 500).json({ error: error.message });
  }
});


router.put("/user-profile", verifyToken, async (req, res) => {
  try {
    const id = req.user.id;
    const { display_name, full_name, contact_number, profile_image } = req.body;

    if (!display_name && !full_name && !contact_number && !profile_image) {
      return res.status(400).json({ error: "No update fields provided" });
    }

    const updates = { display_name, full_name, contact_number, profile_image };
    const filteredUpdates = Object.fromEntries(Object.entries(updates).filter(([_, v]) => v !== undefined));

    const updatedProfile = await updateUserProfile(id, filteredUpdates);
    res.status(200).json(updatedProfile);
  } catch (error) {
    res.status(error.message === "Failed to update profile" ? 400 : 500).json({ error: error.message });
  }
});

// Get user role
router.get("/role", verifyToken, async (req, res) => {
  try {
    const role = req.user.role || 'user';
    res.status(200).json({ 
      role,
      userId: req.user.id,
      email: req.user.email 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
