if (process.env.NODE_ENV !== 'test') {
  require('dotenv').config()
}

const config = {
  env: process.env.NODE_ENV,

  fundingFarmingApiUri: process.env.FARMING_FUNDING_API_URI,
  fundingFarmingApiKey: process.env.FARMING_FUNDING_API_KEY,
  appInsightsKey: process.env.APPINSIGHTS_CONNECTIONSTRING,

  version: '0.1.32-message-events-convs',

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
    useRedis: false,
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

    openAiInstanceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME,
    openAiEndpoint: process.env.AZURE_OPENAI_API_ENDPOINT,
    openAiKey: process.env.AZURE_OPENAI_API_KEY,
    openAiDeploymentName: process.env.AZURE_OPENAI_API_EMBEDDING_DEPLOYMENT_NAME,
    openAiModelName: process.env.AZURE_OPENAI_API_MODEL_NAME,

    tokenBudget: 16384 - 1024
  },

  googleAnalytics: {
    key: process.env.GOOGLE_TAG_MANAGER_KEY || ''
  }
}

module.exports = config
