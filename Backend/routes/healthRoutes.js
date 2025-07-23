const express = require("express");
const router = express.Router();
const CacheService = require("../services/cacheService");

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "EventSpark Backend is healthy!",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Cache statistics endpoint (for monitoring)
router.get("/cache-stats", (req, res) => {
  try {
    const stats = CacheService.getStats();
    res.json({
      success: true,
      data: {
        cacheStatistics: stats,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get cache statistics",
      error: error.message,
    });
  }
});

// Cache management endpoints (for admin use)
router.post("/cache/clear", (req, res) => {
  try {
    CacheService.clearAll();
    res.json({
      success: true,
      message: "All caches cleared successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to clear caches",
      error: error.message,
    });
  }
});

module.exports = router;
