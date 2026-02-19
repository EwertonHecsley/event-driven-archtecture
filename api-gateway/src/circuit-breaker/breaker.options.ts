import CircuitBreaker, {} from 'opossum';

export const defaultBreakerOptions:CircuitBreaker.Options = {
    timeout: 3000, // If our function takes longer than 5 seconds, trigger a failure
    errorThresholdPercentage:50, // When 50% of requests fail, trip the circuit
    resetTimeout: 10000, // After 10 seconds, try again.
    rollingCountTimeout: 10000, // Time in milliseconds for the statistical rolling window.
    rollingCountBuckets: 10, // Number of buckets the rolling statistical window is divided into.
    volumeThreshold: 5, // Minimum number of requests before the circuit breaker can trip.
}