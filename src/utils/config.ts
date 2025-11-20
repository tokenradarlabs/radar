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
