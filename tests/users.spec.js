const { test, expect, request } = require('@playwright/test');

test('ReqRes API - Create, Get, Update User', async () => {
  const apiKey = process.env.REQRES_API_KEY || 'reqres_68e44b83490b4ef0a71204a2dd9a340e';
  const api = await request.newContext({
    baseURL: 'https://reqres.in'
  });

  const requestHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'x-api-key': apiKey
  };

  const createRes = await api.post('/api/users', {
    headers: requestHeaders,
    data: JSON.stringify({
      name: 'Surya',
      job: 'QA Engineer'
    })
  });

  const createBody = await createRes.json();
  const userId = createBody.id;

  const getRes = await api.get('/api/users?page=2', {
    headers: requestHeaders
  });
  expect(getRes.status()).toBe(200);

  const getBody = await getRes.json();
  expect(getBody.data.length).toBeGreaterThan(0);

  const updateRes = await api.put(`/api/users/${userId}`, {
    headers: requestHeaders,
    data: JSON.stringify({
      name: 'Surya Updated',
      job: 'Senior QA Engineer'
    })
  });

  expect(updateRes.status()).toBe(200);

  const updateBody = await updateRes.json();
  expect(updateBody.name).toBe('Surya Updated');
  expect(updateBody.job).toBe('Senior QA Engineer');
});