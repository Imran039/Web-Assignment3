const promClient = require("prom-client");

// Create a Registry to register the metrics
const register = new promClient.Registry();

// Enable the collection of default metrics
promClient.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.1, 0.5, 1, 2, 5],
});

const httpRequestTotal = new promClient.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
});

const httpRequestErrors = new promClient.Counter({
  name: "http_request_errors_total",
  help: "Total number of HTTP request errors",
  labelNames: ["method", "route", "error_type"],
});

const activeConnections = new promClient.Gauge({
  name: "active_connections",
  help: "Number of active connections",
});

const databaseOperations = new promClient.Counter({
  name: "database_operations_total",
  help: "Total number of database operations",
  labelNames: ["operation", "collection", "status"],
});

const cacheHits = new promClient.Counter({
  name: "cache_hits_total",
  help: "Total number of cache hits",
});

const cacheMisses = new promClient.Counter({
  name: "cache_misses_total",
  help: "Total number of cache misses",
});

// Register all metrics
register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(httpRequestTotal);
register.registerMetric(httpRequestErrors);
register.registerMetric(activeConnections);
register.registerMetric(databaseOperations);
register.registerMetric(cacheHits);
register.registerMetric(cacheMisses);

// Middleware to collect request metrics
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();

  // Track active connections
  activeConnections.inc();

  res.on("finish", () => {
    const duration = (Date.now() - start) / 1000; // Convert to seconds
    const route = req.route ? req.route.path : req.path;

    // Record request duration
    httpRequestDurationMicroseconds
      .labels(req.method, route, res.statusCode)
      .observe(duration);

    // Record request total
    httpRequestTotal.labels(req.method, route, res.statusCode).inc();

    // Record errors
    if (res.statusCode >= 400) {
      httpRequestErrors
        .labels(
          req.method,
          route,
          res.statusCode >= 500 ? "server_error" : "client_error"
        )
        .inc();
    }

    // Decrease active connections
    activeConnections.dec();
  });

  next();
};

// Function to record database operations
const recordDatabaseOperation = (operation, collection, status) => {
  databaseOperations.labels(operation, collection, status).inc();
};

// Function to record cache operations
const recordCacheHit = () => {
  cacheHits.inc();
};

const recordCacheMiss = () => {
  cacheMisses.inc();
};

// Get metrics endpoint
const getMetrics = async () => {
  return await register.metrics();
};

module.exports = {
  register,
  metricsMiddleware,
  recordDatabaseOperation,
  recordCacheHit,
  recordCacheMiss,
  getMetrics,
  httpRequestDurationMicroseconds,
  httpRequestTotal,
  httpRequestErrors,
  activeConnections,
  databaseOperations,
  cacheHits,
  cacheMisses,
};
