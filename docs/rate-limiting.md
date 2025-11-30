# Rate Limiting

To ensure fair usage and maintain API stability, all requests are subject to rate limiting. When a client exceeds the allocated rate limit, the API will respond with a `429 Too Many Requests` status code.

The API provides the following rate limit headers in its responses:

- `X-RateLimit-Limit`: The maximum number of requests allowed in the current time window.
- `X-RateLimit-Remaining`: The number of requests remaining in the current time window.
- `X-RateLimit-Reset`: The time (in UTC epoch seconds) at which the current rate limit window resets.

### Example Rate Limit Headers

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1678886400
```

Clients should monitor these headers and adjust their request rate accordingly to avoid hitting the rate limits.