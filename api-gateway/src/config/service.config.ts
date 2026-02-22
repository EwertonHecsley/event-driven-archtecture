export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  internalApiKey: process.env.INTERNAL_API_KEY,
  services: {
    products: process.env.PRODUCTS_SERVICE_URL,
  },
});