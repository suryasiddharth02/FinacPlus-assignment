const { test, expect, request } = require('@playwright/test');
const { REQRES } = require('../test-config');

const API = `${REQRES.BASE_URL}/api`; 

let apiContext;
let userId;                             

const NEW_USER = {
  name: 'Jane Automation',
  job:  'QA Engineer',
};

test.describe('reqres.in — API Tests', () => {

  test.beforeAll(async () => {
    if (!REQRES.API_KEY || REQRES.API_KEY === 'your_reqres_api_key_here') {
      throw new Error(
        '\n\nreqres.in API key not configured!\n' +
        '   1. Sign up free at https://app.reqres.in\n' +
        '   2. Copy your API key\n' +
        '   3. Set REQRES.API_KEY in test-config.js\n'
      );
    }

    apiContext = await request.newContext({
      baseURL: REQRES.BASE_URL,
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
        'x-api-key':    REQRES.API_KEY,
      },
    });
  });

  test.afterAll(async () => {
    await apiContext?.dispose();
  });

  async function logAndParse(label, response) {
    let body;
    try   { body = await response.json(); }
    catch { body = await response.text(); }
    console.log(`\n[${label}] HTTP ${response.status()}`);
    console.log(JSON.stringify(body, null, 2));
    return body;
  }

  test('POST /users — create a user and validate 201 status', async () => {
    const response = await apiContext.post(`${API}/users`, {
      data: NEW_USER,
    });

    const body = await logAndParse('CREATE USER', response);

    expect(response.status()).toBe(201);

    expect(body.name).toBe(NEW_USER.name);
    expect(body.job).toBe(NEW_USER.job);

    expect(body.id).toBeTruthy();
    expect(body.createdAt).toBeTruthy();
    userId = body.id;

    console.log(`User created — id: ${userId}`);
  });

  test('GET /users/{id} — fetch user and validate response structure', async () => {
    const knownId  = 1;
    const response = await apiContext.get(`${API}/users/${knownId}`);
    const body     = await logAndParse('GET USER', response);

    expect(response.status()).toBe(200);

    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('support');

    const { data } = body;
    expect(data.id).toBe(knownId);
    expect(data.email).toBeTruthy();
    expect(data.first_name).toBeTruthy();
    expect(data.last_name).toBeTruthy();
    expect(data.avatar).toBeTruthy();

    console.log(`GET validated — ${data.first_name} ${data.last_name} (${data.email})`);
  });

  test('PUT /users/{id} — update name and validate response', async () => {
    const targetId = 2;
    const payload  = { name: 'Jane Updated', job: 'Lead QA Engineer' };

    const response = await apiContext.put(`${API}/users/${targetId}`, {
      data: payload,
    });
    const body = await logAndParse('UPDATE USER (PUT)', response);

    expect(response.status()).toBe(200);
    expect(body.name).toBe(payload.name);
    expect(body.job).toBe(payload.job);
    expect(body.updatedAt).toBeTruthy();

    console.log(`PUT — name: "${body.name}", updatedAt: ${body.updatedAt}`);
  });

  test('PATCH /users/{id} — partial update of name only', async () => {
    const targetId = 2;
    const payload  = { name: 'Jane Patched' };

    const response = await apiContext.patch(`${API}/users/${targetId}`, {
      data: payload,
    });
    const body = await logAndParse('UPDATE USER (PATCH)', response);

    expect(response.status()).toBe(200);
    expect(body.name).toBe(payload.name);
    expect(body.updatedAt).toBeTruthy();

    console.log(`PATCH — name: "${body.name}"`);
  });

});
