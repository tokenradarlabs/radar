export const corsConfig = {
  origin:
    process.env.NODE_ENV === 'production'
      ? [
          process.env.ALLOWED_ORIGINS?.split(',') || 'https://tokenradar.com',
        ].flat()
      : true, // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: true,
};

export const PRICE_CACHE_MAX_AGE: number = (() => {
  const parsed = parseInt(process.env.PRICE_CACHE_MAX_AGE || '', 10);
  return Number.isFinite(parsed) && Number.isInteger(parsed) && parsed >= 0
    ? parsed
    : 60;
})();
