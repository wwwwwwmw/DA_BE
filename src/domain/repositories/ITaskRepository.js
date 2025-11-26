/**
 * Task Repository Interface
 * Defines contract for task data access
 */
class ITaskRepository {
  async findById(id) {
    throw new Error('Method not implemented');
  }

  async findAll(options = {}) {
    throw new Error('Method not implemented');
  }

  async findByProject(projectId, options = {}) {
    throw new Error('Method not implemented');
  }

  async findByAssignee(userId, options = {}) {
    throw new Error('Method not implemented');
  }

  async findByCreator(createdById, options = {}) {
    throw new Error('Method not implemented');
  }

  async findByDepartment(departmentId, options = {}) {
    throw new Error('Method not implemented');
  }

  async findByStatus(status, options = {}) {
    throw new Error('Method not implemented');
  }

  async findByPriority(priority, options = {}) {
    throw new Error('Method not implemented');
  }

  async findConflictingTasks(startTime, endTime, excludeTaskId = null) {
    throw new Error('Method not implemented');
  }

  async create(taskData) {
    throw new Error('Method not implemented');
  }

  async update(id, taskData) {
    throw new Error('Method not implemented');
  }

  async delete(id) {
    throw new Error('Method not implemented');
  }

  async updateStatus(id, status) {
    throw new Error('Method not implemented');
  }

  async assignToUser(taskId, userId) {
    throw new Error('Method not implemented');
  }

  async unassignFromUser(taskId, userId) {
    throw new Error('Method not implemented');
  }

  async getTaskAssignments(taskId) {
    throw new Error('Method not implemented');
  }

  async getUserTaskLoad(userId, dateRange = null) {
    throw new Error('Method not implemented');
  }
}

module.exports = ITaskRepository;