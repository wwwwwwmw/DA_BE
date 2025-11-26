/**
 * Event Entity - Business domain model
 */
class Event {
  constructor({
    id,
    title,
    description,
    startTime,
    endTime,
    status = 'pending',
    type = 'work',
    repeat = null,
    roomId = null,
    createdById,
    departmentId = null,
    isGlobal = false,
    createdAt = null,
    updatedAt = null
  }) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.startTime = startTime;
    this.endTime = endTime;
    this.status = status;
    this.type = type;
    this.repeat = repeat;
    this.roomId = roomId;
    this.createdById = createdById;
    this.departmentId = departmentId;
    this.isGlobal = isGlobal;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  // Business logic methods
  isPending() {
    return this.status === 'pending';
  }

  isApproved() {
    return this.status === 'approved';
  }

  isRejected() {
    return this.status === 'rejected';
  }

  isCompleted() {
    return this.status === 'completed';
  }

  approve() {
    if (this.status === 'pending') {
      this.status = 'approved';
      return true;
    }
    return false;
  }

  reject() {
    if (this.status === 'pending') {
      this.status = 'rejected';
      return true;
    }
    return false;
  }

  complete() {
    if (this.status === 'approved') {
      this.status = 'completed';
      return true;
    }
    return false;
  }

  // Check if event is happening now
  isActive() {
    const now = new Date();
    return this.startTime <= now && now <= this.endTime && this.isApproved();
  }

  // Check if event conflicts with given time range
  conflictsWith(startTime, endTime) {
    return (
      this.isApproved() &&
      ((this.startTime <= startTime && startTime < this.endTime) ||
        (this.startTime < endTime && endTime <= this.endTime) ||
        (startTime <= this.startTime && this.endTime <= endTime))
    );
  }

  // Get duration in minutes
  getDuration() {
    return Math.floor((this.endTime - this.startTime) / (1000 * 60));
  }

  // Validation methods
  static validateStatus(status) {
    return ['pending', 'approved', 'rejected', 'completed'].includes(status);
  }

  static validateType(type) {
    return ['work', 'meeting'].includes(type);
  }

  static validateTimeRange(startTime, endTime) {
    return startTime < endTime;
  }

  // Factory method
  static create(eventData) {
    if (!eventData.title || !eventData.startTime || !eventData.endTime || !eventData.createdById) {
      throw new Error('Title, start time, end time, and creator are required');
    }
    if (!this.validateTimeRange(eventData.startTime, eventData.endTime)) {
      throw new Error('End time must be after start time');
    }
    if (eventData.status && !this.validateStatus(eventData.status)) {
      throw new Error('Invalid status');
    }
    if (eventData.type && !this.validateType(eventData.type)) {
      throw new Error('Invalid type');
    }
    
    return new Event(eventData);
  }

  toJSON() {
    return { ...this };
  }
}

module.exports = Event;