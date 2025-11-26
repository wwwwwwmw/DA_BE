/**
 * Event DTOs for data transfer between layers
 */

class CreateEventDTO {
  constructor({ title, description, startTime, endTime, type = 'work', repeat = null, roomId = null, departmentId = null, isGlobal = false, participantIds = [] }) {
    this.title = title;
    this.description = description;
    this.startTime = startTime;
    this.endTime = endTime;
    this.type = type;
    this.repeat = repeat;
    this.roomId = roomId;
    this.departmentId = departmentId;
    this.isGlobal = isGlobal;
    this.participantIds = participantIds;
  }
}

class UpdateEventDTO {
  constructor({ title, description, startTime, endTime, type, repeat, roomId, departmentId, isGlobal, status }) {
    this.title = title;
    this.description = description;
    this.startTime = startTime;
    this.endTime = endTime;
    this.type = type;
    this.repeat = repeat;
    this.roomId = roomId;
    this.departmentId = departmentId;
    this.isGlobal = isGlobal;
    this.status = status;
  }
}

class EventResponseDTO {
  constructor(event) {
    this.id = event.id;
    this.title = event.title;
    this.description = event.description;
    this.startTime = event.startTime;
    this.endTime = event.endTime;
    this.status = event.status;
    this.type = event.type;
    this.repeat = event.repeat;
    this.roomId = event.roomId;
    this.createdById = event.createdById;
    this.departmentId = event.departmentId;
    this.isGlobal = event.isGlobal;
    this.createdAt = event.createdAt;
    this.updatedAt = event.updatedAt;
  }
}

class EventFilterDTO {
  constructor({ startDate, endDate, departmentId, status, type, isGlobal, createdById, limit, offset }) {
    this.startDate = startDate;
    this.endDate = endDate;
    this.departmentId = departmentId;
    this.status = status;
    this.type = type;
    this.isGlobal = isGlobal;
    this.createdById = createdById;
    this.limit = limit;
    this.offset = offset;
  }
}

module.exports = {
  CreateEventDTO,
  UpdateEventDTO,
  EventResponseDTO,
  EventFilterDTO
};