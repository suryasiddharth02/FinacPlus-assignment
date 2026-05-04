class UsersAPI {
  constructor(request) {
    this.request = request;
  }

  async createUser(payload) {
    return await this.request.post('/users', {
      data: payload
    });
  }
}

module.exports = UsersAPI;