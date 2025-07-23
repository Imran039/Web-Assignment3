const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    seatNumber: {
      type: String,
      required: true,
    },
    ticketPrice: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "cancelled"],
      default: "pending",
    },
    qrCode: {
      type: String,
      required: true,
      unique: true,
    },
    bookingDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["active", "cancelled", "refunded"],
      default: "active",
    },
  },
  { timestamps: true }
);

// Generate QR code
bookingSchema.methods.generateQRCode = function () {
  const bookingData = {
    bookingId: this._id,
    eventId: this.eventId,
    userId: this.userId,
    seatNumber: this.seatNumber,
  };
  this.qrCode = Buffer.from(JSON.stringify(bookingData)).toString("base64");
  return this.qrCode;
};

// Pre-save middleware to generate QR code if not exists
bookingSchema.pre("save", function (next) {
  if (!this.qrCode) {
    this.generateQRCode();
  }
  next();
});

// Database Indexes for Performance Optimization
// Single field indexes for common queries
bookingSchema.index({ eventId: 1 }); // For event-specific bookings
bookingSchema.index({ userId: 1 }); // For user's bookings
bookingSchema.index({ seatNumber: 1 }); // For seat availability checks
bookingSchema.index({ paymentStatus: 1 }); // For payment status filtering
bookingSchema.index({ status: 1 }); // For booking status filtering
bookingSchema.index({ qrCode: 1 }); // For QR code lookups (unique)

// Compound indexes for complex queries
bookingSchema.index({ eventId: 1, seatNumber: 1 }); // For seat availability per event
bookingSchema.index({ eventId: 1, status: 1 }); // For active bookings per event
bookingSchema.index({ userId: 1, status: 1 }); // For user's active bookings
bookingSchema.index({ eventId: 1, paymentStatus: 1 }); // For payment status per event
bookingSchema.index({ userId: 1, createdAt: -1 }); // For user's bookings by date

// Index for timestamps
bookingSchema.index({ createdAt: -1 });
bookingSchema.index({ updatedAt: -1 });
bookingSchema.index({ bookingDate: -1 });

module.exports = mongoose.model("Booking", bookingSchema);
