import express from "express";
import { getTeacherPerformance } from "../services/teacherService.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/performance", verifyToken, async (req, res) => {
  try {
    const { range } = req.query;
    const teacherId = req.user.id;

    if (!range || !['week', 'month'].includes(range)) {
      return res.status(400).json({ error: "Invalid time range. Use 'week' or 'month'" });
    }

    const performance = await getTeacherPerformance(teacherId, range);
    res.status(200).json(performance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router; 