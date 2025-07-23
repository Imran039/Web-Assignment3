const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    date: { type: String, required: true }, // ISO or yyyy-mm-dd
    time: { type: String, required: true }, // HH:mm
    venue: { type: String, required: true },
    category: { type: String, required: true },
    totalSeats: { type: Number, required: true },
    imageUrl: { type: String }, // optional
    // Ticket pricing fields
    ticketPrice: {
      type: Number,
      required: true,
      min: [0, "Ticket price cannot be negative"],
      default: 0,
    },
    dynamicPricing: {
      enabled: { type: Boolean, default: false },
      rules: [
        {
          threshold: { type: Number, required: true }, // seats remaining threshold
          percentage: { type: Number, required: true }, // price increase percentage
          description: { type: String },
        },
      ],
    },
    soldTickets: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    createdBy: {
      // linkage to User
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Virtual for available seats
eventSchema.virtual("availableSeats").get(function () {
  return this.totalSeats - this.soldTickets;
});

// Virtual for current ticket price based on dynamic pricing
eventSchema.virtual("currentTicketPrice").get(function () {
  if (!this.dynamicPricing.enabled) {
    return this.ticketPrice;
  }

  const availableSeats = this.availableSeats;
  let currentPrice = this.ticketPrice;

  // Apply dynamic pricing rules in order
  for (const rule of this.dynamicPricing.rules) {
    if (availableSeats <= rule.threshold) {
      currentPrice = currentPrice * (1 + rule.percentage / 100);
    }
  }

  return Math.round(currentPrice * 100) / 100; // Round to 2 decimal places
});

// Method to calculate revenue
eventSchema.methods.calculateRevenue = function () {
  return this.soldTickets * this.ticketPrice;
};

// Method to update revenue
eventSchema.methods.updateRevenue = function () {
  this.revenue = this.calculateRevenue();
  return this.save();
};

// Database Indexes for Performance Optimization
// Single field indexes for common queries
eventSchema.index({ date: 1 }); // For date-based filtering
eventSchema.index({ category: 1 }); // For category filtering
eventSchema.index({ createdBy: 1 }); // For organizer-specific queries
eventSchema.index({ soldTickets: 1 }); // For availability queries

// Compound indexes for complex queries
eventSchema.index({ date: 1, time: 1 }); // For date+time sorting
eventSchema.index({ createdBy: 1, date: 1 }); // For organizer's events by date
eventSchema.index({ category: 1, date: 1 }); // For category + date filtering
eventSchema.index({ soldTickets: 1, totalSeats: 1 }); // For availability calculations

// Text index for search functionality
eventSchema.index(
  {
    name: "text",
    description: "text",
    venue: "text",
  },
  {
    weights: {
      name: 10, // Highest priority for name matches
      description: 5, // Medium priority for description
      venue: 3, // Lower priority for venue
    },
    name: "event_search_index",
  }
);

// Index for timestamps (useful for sorting by creation/update time)
eventSchema.index({ createdAt: -1 });
eventSchema.index({ updatedAt: -1 });

module.exports = mongoose.model("Event", eventSchema);
