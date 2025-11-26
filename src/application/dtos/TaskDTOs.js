/**
 * Task DTOs for data transfer between layers
 */

class CreateTaskDTO {
  constructor({ title, description, startTime = null, endTime = null, priority = 'normal', projectId = null, departmentId = null, assignmentType = 'open', capacity = 1, weight = null }) {
    this.title = title;
    this.description = description;
    this.startTime = startTime;
    this.endTime = endTime;
    this.priority = priority;
    this.projectId = projectId;
    this.departmentId = departmentId;
    this.assignmentType = assignmentType;
    this.capacity = capacity;
    this.weight = weight;
  }
}

class UpdateTaskDTO {
  constructor({ title, description, startTime, endTime, status, priority, projectId, departmentId, assignmentType, capacity, weight }) {
    this.title = title;
    this.description = description;
    this.startTime = startTime;
    this.endTime = endTime;
    this.status = status;
    this.priority = priority;
    this.projectId = projectId;
    this.departmentId = departmentId;
    this.assignmentType = assignmentType;
    this.capacity = capacity;
    this.weight = weight;
  }
}

class TaskResponseDTO {
  constructor(task) {
    this.id = task.id;
    this.title = task.title;
    this.description = task.description;
    this.startTime = task.startTime;
    this.endTime = task.endTime;
    this.status = task.status;
    this.priority = task.priority;
    this.projectId = task.projectId;
    this.createdById = task.createdById;
    this.departmentId = task.departmentId;
    this.assignmentType = task.assignmentType;
    this.capacity = task.capacity;
    this.weight = task.weight;
    this.createdAt = task.createdAt;
    this.updatedAt = task.updatedAt;
  }
}

class TaskFilterDTO {
  constructor({ projectId, status, priority, departmentId, assigneeId, createdById, assignmentType, limit, offset }) {
    this.projectId = projectId;
    this.status = status;
    this.priority = priority;
    this.departmentId = departmentId;
    this.assigneeId = assigneeId;
    this.createdById = createdById;
    this.assignmentType = assignmentType;
    this.limit = limit;
    this.offset = offset;
  }
}

class AssignTaskDTO {
  constructor({ taskId, userId }) {
    this.taskId = taskId;
    this.userId = userId;
  }
}

module.exports = {
  CreateTaskDTO,
  UpdateTaskDTO,
  TaskResponseDTO,
  TaskFilterDTO,
  AssignTaskDTO
};