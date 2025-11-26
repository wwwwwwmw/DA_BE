/**
 * User Repository Interface
 * Defines contract for user data access
 */
class IUserRepository {
  async findById(id) {
    throw new Error('Method not implemented');
  }

  async findByEmail(email) {
    throw new Error('Method not implemented');
  }

  async findAll(options = {}) {
    throw new Error('Method not implemented');
  }

  async findByDepartment(departmentId, options = {}) {
    throw new Error('Method not implemented');
  }

  async create(userData) {
    throw new Error('Method not implemented');
  }

  async update(id, userData) {
    throw new Error('Method not implemented');
  }

  async delete(id) {
    throw new Error('Method not implemented');
  }

  async incrementFailedAttempts(id) {
    throw new Error('Method not implemented');
  }

  async resetFailedAttempts(id) {
    throw new Error('Method not implemented');
  }

  async lockAccount(id) {
    throw new Error('Method not implemented');
  }

  async unlockAccount(id) {
    throw new Error('Method not implemented');
  }
}

module.exports = IUserRepository;