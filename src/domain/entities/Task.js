/**
 * Task Entity - Business domain model
 */
class Task {
  constructor({
    id,
    title,
    description,
    startTime = null,
    endTime = null,
    status = 'todo',
    projectId = null,
    createdById,
    priority = 'normal',
    departmentId = null,
    assignmentType = 'open',
    capacity = 1,
    weight = null,
    createdAt = null,
    updatedAt = null
  }) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.startTime = startTime;
    this.endTime = endTime;
    this.status = status;
    this.projectId = projectId;
    this.createdById = createdById;
    this.priority = priority;
    this.departmentId = departmentId;
    this.assignmentType = assignmentType;
    this.capacity = capacity;
    this.weight = weight;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  // Business logic methods
  isTodo() {
    return this.status === 'todo';
  }

  isInProgress() {
    return this.status === 'in_progress';
  }

  isCompleted() {
    return this.status === 'completed';
  }

  start() {
    if (this.status === 'todo') {
      this.status = 'in_progress';
      return true;
    }
    return false;
  }

  complete() {
    if (this.status === 'in_progress') {
      this.status = 'completed';
      return true;
    }
    return false;
  }

  reset() {
    this.status = 'todo';
  }

  // Priority methods
  isUrgent() {
    return this.priority === 'urgent';
  }

  isHigh() {
    return this.priority === 'high';
  }

  isNormal() {
    return this.priority === 'normal';
  }

  isLow() {
    return this.priority === 'low';
  }

  // Assignment methods
  isDirectAssignment() {
    return this.assignmentType === 'direct';
  }

  isOpenAssignment() {
    return this.assignmentType === 'open';
  }

  // Get priority score for sorting
  getPriorityScore() {
    const scores = { urgent: 4, high: 3, normal: 2, low: 1 };
    return scores[this.priority] || 2;
  }

  // Check if task has time conflict
  conflictsWith(startTime, endTime) {
    if (!this.startTime || !this.endTime) return false;
    return (
      ((this.startTime <= startTime && startTime < this.endTime) ||
        (this.startTime < endTime && endTime <= this.endTime) ||
        (startTime <= this.startTime && this.endTime <= endTime))
    );
  }

  // Get duration in hours
  getDuration() {
    if (!this.startTime || !this.endTime) return 0;
    return Math.floor((this.endTime - this.startTime) / (1000 * 60 * 60));
  }

  // Validation methods
  static validateStatus(status) {
    return ['todo', 'in_progress', 'completed'].includes(status);
  }

  static validatePriority(priority) {
    return ['low', 'normal', 'high', 'urgent'].includes(priority);
  }

  static validateAssignmentType(type) {
    return ['open', 'direct'].includes(type);
  }

  static validateWeight(weight) {
    return weight === null || (Number.isInteger(weight) && weight >= 0 && weight <= 100);
  }

  static validateCapacity(capacity) {
    return Number.isInteger(capacity) && capacity >= 1;
  }

  // Factory method
  static create(taskData) {
    if (!taskData.title || !taskData.createdById) {
      throw new Error('Title and creator are required');
    }
    if (taskData.status && !this.validateStatus(taskData.status)) {
      throw new Error('Invalid status');
    }
    if (taskData.priority && !this.validatePriority(taskData.priority)) {
      throw new Error('Invalid priority');
    }
    if (taskData.assignmentType && !this.validateAssignmentType(taskData.assignmentType)) {
      throw new Error('Invalid assignment type');
    }
    if (taskData.weight !== undefined && !this.validateWeight(taskData.weight)) {
      throw new Error('Invalid weight (must be 0-100 or null)');
    }
    if (taskData.capacity !== undefined && !this.validateCapacity(taskData.capacity)) {
      throw new Error('Invalid capacity (must be positive integer)');
    }
    
    return new Task(taskData);
  }

  toJSON() {
    return { ...this };
  }
}

module.exports = Task;