const Joi = require('joi')

if (process.env.NODE_ENV !== 'test') {
  require('dotenv').config()
}

const schema = Joi.object({
  env: Joi.string().valid('development', 'test', 'production').required(),
  appInsightsKey: Joi.string().optional(),

  version: Joi.string().required(),
  logLevel: Joi.string().default('error'),

  auth: Joi.object({
    authUser: Joi.string().required(),
    authPassword: Joi.string().required(),
    authVerification: Joi.string().required()
  }).required(),

  cookie: Joi.object({
    cookieNameCookiePolicy: Joi.string().default('ffa_cookie_policy'),
    cookieNameAuth: Joi.string().default('ffa_auth'),
    cookieNameSession: Joi.string().default('ffa_session'),
    useRedis: Joi.boolean().default(true),
    isSameSite: Joi.string().valid('Strict', 'Lax', 'None').default('Strict'),
    isSecure: Joi.boolean().default(process.env.NODE_ENV === 'production'),
    password: Joi.string().required(),
    ttl: Joi.number().integer().default(8640000)
  }).required(),

  cookiePolicy: Joi.object({
    clearInvalid: Joi.boolean().default(false),
    encoding: Joi.string().valid('base64json', 'none').default('base64json'),
    isSameSite: Joi.string().valid('Strict', 'Lax', 'None').default('Strict'),
    isSecure: Joi.boolean().default(process.env.NODE_ENV === 'production'),
    password: Joi.string().required()
  }).required(),

  redis: Joi.object({
    host: Joi.string().default(''),
    password: Joi.string().default(''),
    port: Joi.number().integer().default(''),
    tls: Joi.any()
  }).required(),

  useFakeLlm: Joi.boolean().default(false),

  azureOpenAI: Joi.object({
    searchUrl: Joi.string().uri().required(),
    searchApiKey: Joi.string().required(),
    indexName: Joi.string().required(),
    summaryIndexName: Joi.string().required(),
    cacheEnabled: Joi.boolean().default(true),
    cacheIndexName: Joi.string().required(),
    cacheTarget: Joi.number().required(),

    openAiInstanceName: Joi.string().required(),
    openAiEndpoint: Joi.string().uri().required(),
    openAiKey: Joi.string().required(),
    openAiDeploymentName: Joi.string().required(),
    openAiModelName: Joi.string().required(),

    tokenBudget: Joi.number()
      .integer()
      .default(16384 - 1024)
  }).required(),

  featureSummaryEnabled: Joi.boolean().default(false),

  googleAnalytics: Joi.object({
    key: Joi.string().default('')
  }).required(),

  endpointTestingEnabled: Joi.boolean().default(false)
})

const config = {
  env: process.env.NODE_ENV,
  appInsightsKey: process.env.APPINSIGHTS_CONNECTIONSTRING,
  version: '0.1.53',
  logLevel: process.env.LOG_LEVEL || 'error',

  auth: {
    authUser: process.env.AUTH_USER,
    authPassword: process.env.AUTH_PASSWORD,
    authVerification: process.env.AUTH_VERIFICATION
  },

  cookie: {
    cookieNameCookiePolicy: 'ffa_cookie_policy',
    cookieNameAuth: 'ffa_auth',
    cookieNameSession: 'ffa_session',
    useRedis: process.env.USE_REDIS !== 'false',
    isSameSite: 'Strict',
    isSecure: process.env.NODE_ENV === 'production',
    password: process.env.COOKIE_PASSWORD,
    ttl: Number(process.env.COOKIE_TTL) || 8640000
  },

  cookiePolicy: {
    clearInvalid: false,
    encoding: 'base64json',
    isSameSite: 'Strict',
    isSecure: process.env.NODE_ENV === 'production',
    password: process.env.COOKIE_PASSWORD
  },

  redis: {
    host: process.env.REDIS_HOST || '',
    password: process.env.REDIS_PASSWORD || '',
    port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : '',
    tls: process.env.NODE_ENV === 'production' ? {} : undefined
  },

  useFakeLlm: process.env.LLM === 'FAKE',

  azureOpenAI: {
    searchUrl: process.env.AZURE_AISEARCH_ENDPOINT,
    searchApiKey: process.env.AZURE_AISEARCH_KEY,
    indexName: process.env.AZURE_SEARCH_INDEX_NAME,
    summaryIndexName: process.env.AZURE_SEARCH_SUMMARIES_INDEX_NAME,
    cacheEnabled: process.env.AZURE_SEARCH_CACHE_ENABLED !== 'false',
    cacheIndexName: process.env.AZURE_SEARCH_CACHE_INDEX_NAME,
    cacheTarget: Number(process.env.AZURE_SEARCH_CACHE_TARGET),

    openAiInstanceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME,
    openAiEndpoint: process.env.AZURE_OPENAI_API_ENDPOINT,
    openAiKey: process.env.AZURE_OPENAI_API_KEY,
    openAiDeploymentName: process.env.AZURE_OPENAI_API_EMBEDDING_DEPLOYMENT_NAME,
    openAiModelName: process.env.AZURE_OPENAI_API_MODEL_NAME,

    tokenBudget: 16384 - 1024
  },

  featureSummaryEnabled: process.env.FEATURE_SUMMARY_ENABLED === 'true',

  googleAnalytics: {
    key: process.env.GOOGLE_TAG_MANAGER_KEY || ''
  },

  endpointTestingEnabled: process.env.ENDPOINT_TESTING_ENABLED === 'true'
}

const result = schema.validate(config, {
  abortEarly: false
})

if (result.error) {
  throw new Error(`The app config is invalid. ${result.error.message}`)
}

module.exports = config
