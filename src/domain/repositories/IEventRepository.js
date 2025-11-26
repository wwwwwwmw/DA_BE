/**
 * Event Repository Interface
 * Defines contract for event data access
 */
class IEventRepository {
  async findById(id) {
    throw new Error('Method not implemented');
  }

  async findAll(options = {}) {
    throw new Error('Method not implemented');
  }

  async findByDateRange(startDate, endDate, options = {}) {
    throw new Error('Method not implemented');
  }

  async findByDepartment(departmentId, options = {}) {
    throw new Error('Method not implemented');
  }

  async findByCreator(createdById, options = {}) {
    throw new Error('Method not implemented');
  }

  async findActiveEvents(userId = null) {
    throw new Error('Method not implemented');
  }

  async findConflictingEvents(startTime, endTime, excludeEventId = null) {
    throw new Error('Method not implemented');
  }

  async create(eventData) {
    throw new Error('Method not implemented');
  }

  async update(id, eventData) {
    throw new Error('Method not implemented');
  }

  async delete(id) {
    throw new Error('Method not implemented');
  }

  async updateStatus(id, status) {
    throw new Error('Method not implemented');
  }

  async findByStatus(status, options = {}) {
    throw new Error('Method not implemented');
  }
}

module.exports = IEventRepository;