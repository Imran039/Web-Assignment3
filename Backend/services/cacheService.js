const NodeCache = require("node-cache");

// Create cache instances for different types of data
const eventCache = new NodeCache({
  stdTTL: 300, // 5 minutes default TTL
  checkperiod: 60, // Check for expired keys every minute
  useClones: false, // Don't clone objects for better performance
});

const bookingCache = new NodeCache({
  stdTTL: 180, // 3 minutes default TTL
  checkperiod: 60,
  useClones: false,
});

const userCache = new NodeCache({
  stdTTL: 600, // 10 minutes default TTL
  checkperiod: 120,
  useClones: false,
});

// Cache keys generator
const cacheKeys = {
  // Event-related keys
  allEvents: (filters = "") => `events:all:${filters}`,
  eventById: (id) => `event:${id}`,
  eventsByOrganizer: (organizerId) => `events:organizer:${organizerId}`,
  eventsByCategory: (category) => `events:category:${category}`,
  upcomingEvents: () => "events:upcoming",

  // Booking-related keys
  userBookings: (userId) => `bookings:user:${userId}`,
  eventBookings: (eventId) => `bookings:event:${eventId}`,
  availableSeats: (eventId) => `seats:available:${eventId}`,

  // User-related keys
  userProfile: (userId) => `user:${userId}`,
  userStats: (userId) => `user:stats:${userId}`,
};

// Cache service methods
class CacheService {
  // Event caching methods
  static async getEvents(filters = "") {
    const key = cacheKeys.allEvents(filters);
    return eventCache.get(key);
  }

  static async setEvents(events, filters = "", ttl = 300) {
    const key = cacheKeys.allEvents(filters);
    eventCache.set(key, events, ttl);
  }

  static async getEventById(eventId) {
    const key = cacheKeys.eventById(eventId);
    return eventCache.get(key);
  }

  static async setEventById(eventId, event, ttl = 300) {
    const key = cacheKeys.eventById(eventId);
    eventCache.set(key, event, ttl);
  }

  static async getEventsByOrganizer(organizerId) {
    const key = cacheKeys.eventsByOrganizer(organizerId);
    return eventCache.get(key);
  }

  static async setEventsByOrganizer(organizerId, events, ttl = 300) {
    const key = cacheKeys.eventsByOrganizer(organizerId);
    eventCache.set(key, events, ttl);
  }

  static async getUpcomingEvents() {
    const key = cacheKeys.upcomingEvents();
    return eventCache.get(key);
  }

  static async setUpcomingEvents(events, ttl = 300) {
    const key = cacheKeys.upcomingEvents();
    eventCache.set(key, events, ttl);
  }

  // Booking caching methods
  static async getUserBookings(userId) {
    const key = cacheKeys.userBookings(userId);
    return bookingCache.get(key);
  }

  static async setUserBookings(userId, bookings, ttl = 180) {
    const key = cacheKeys.userBookings(userId);
    bookingCache.set(key, bookings, ttl);
  }

  static async getEventBookings(eventId) {
    const key = cacheKeys.eventBookings(eventId);
    return bookingCache.get(key);
  }

  static async setEventBookings(eventId, bookings, ttl = 180) {
    const key = cacheKeys.eventBookings(eventId);
    bookingCache.set(key, bookings, ttl);
  }

  static async getAvailableSeats(eventId) {
    const key = cacheKeys.availableSeats(eventId);
    return bookingCache.get(key);
  }

  static async setAvailableSeats(eventId, seats, ttl = 120) {
    const key = cacheKeys.availableSeats(eventId);
    bookingCache.set(key, seats, ttl);
  }

  // User caching methods
  static async getUserProfile(userId) {
    const key = cacheKeys.userProfile(userId);
    return userCache.get(key);
  }

  static async setUserProfile(userId, profile, ttl = 600) {
    const key = cacheKeys.userProfile(userId);
    userCache.set(key, profile, ttl);
  }

  // Cache invalidation methods
  static async invalidateEvent(eventId) {
    // Invalidate all event-related caches
    eventCache.del(cacheKeys.eventById(eventId));
    eventCache.del(cacheKeys.upcomingEvents());

    // Invalidate booking caches for this event
    bookingCache.del(cacheKeys.eventBookings(eventId));
    bookingCache.del(cacheKeys.availableSeats(eventId));

    // Invalidate all events cache (since event list might change)
    eventCache.flushAll();
  }

  static async invalidateUserBookings(userId) {
    bookingCache.del(cacheKeys.userBookings(userId));
  }

  static async invalidateUserProfile(userId) {
    userCache.del(cacheKeys.userProfile(userId));
    userCache.del(cacheKeys.userStats(userId));
  }

  static async invalidateOrganizerEvents(organizerId) {
    eventCache.del(cacheKeys.eventsByOrganizer(organizerId));
    eventCache.del(cacheKeys.upcomingEvents());
  }

  // Cache statistics
  static getStats() {
    return {
      events: {
        keys: eventCache.keys().length,
        hits: eventCache.getStats().hits,
        misses: eventCache.getStats().misses,
        hitRate:
          eventCache.getStats().hits /
            (eventCache.getStats().hits + eventCache.getStats().misses) || 0,
      },
      bookings: {
        keys: bookingCache.keys().length,
        hits: bookingCache.getStats().hits,
        misses: bookingCache.getStats().misses,
        hitRate:
          bookingCache.getStats().hits /
            (bookingCache.getStats().hits + bookingCache.getStats().misses) ||
          0,
      },
      users: {
        keys: userCache.keys().length,
        hits: userCache.getStats().hits,
        misses: userCache.getStats().misses,
        hitRate:
          userCache.getStats().hits /
            (userCache.getStats().hits + userCache.getStats().misses) || 0,
      },
    };
  }

  // Clear all caches (useful for testing or maintenance)
  static clearAll() {
    eventCache.flushAll();
    bookingCache.flushAll();
    userCache.flushAll();
  }

  // Cache middleware for Express routes
  static cacheMiddleware(ttl = 300) {
    return (req, res, next) => {
      const key = `route:${req.originalUrl}`;
      const cachedResponse = eventCache.get(key);

      if (cachedResponse) {
        return res.json(cachedResponse);
      }

      // Store original send method
      const originalSend = res.json;

      // Override send method to cache response
      res.json = function (data) {
        eventCache.set(key, data, ttl);
        originalSend.call(this, data);
      };

      next();
    };
  }
}

module.exports = CacheService;
