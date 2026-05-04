const { request } = require('@playwright/test');

class APIClient {
  async init() {
    const apiKey = process.env.REQRES_API_KEY || 'reqres_68e44b83490b4ef0a71204a2dd9a340e';

    this.context = await request.newContext({
      baseURL: 'https://reqres.in',
      extraHTTPHeaders: {
        'x-api-key': apiKey
      }
    });
  }

  getRequest() {
    return this.context;
  }
}

module.exports = new APIClient();