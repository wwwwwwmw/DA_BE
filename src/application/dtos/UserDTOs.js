/**
 * User DTOs for data transfer between layers
 */

class CreateUserDTO {
  constructor({ name, email, password, role = 'employee', departmentId = null, contact = null, employeePin = null, avatarUrl = null }) {
    this.name = name;
    this.email = email;
    this.password = password;
    this.role = role;
    this.departmentId = departmentId;
    this.contact = contact;
    this.employeePin = employeePin;
    this.avatarUrl = avatarUrl;
  }
}

class UpdateUserDTO {
  constructor({ name, departmentId, contact, employeePin, avatarUrl, role }) {
    this.name = name;
    this.departmentId = departmentId;
    this.contact = contact;
    this.employeePin = employeePin;
    this.avatarUrl = avatarUrl;
    this.role = role;
  }
}

class UserResponseDTO {
  constructor(user) {
    this.id = user.id;
    this.name = user.name;
    this.email = user.email;
    this.role = user.role;
    this.departmentId = user.departmentId;
    this.contact = user.contact;
    this.employeePin = user.employeePin;
    this.avatarUrl = user.avatarUrl;
    this.isLocked = user.isLocked;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }
}

class LoginDTO {
  constructor({ email, password }) {
    this.email = email;
    this.password = password;
  }
}

class ChangePasswordDTO {
  constructor({ currentPassword, newPassword }) {
    this.currentPassword = currentPassword;
    this.newPassword = newPassword;
  }
}

module.exports = {
  CreateUserDTO,
  UpdateUserDTO,
  UserResponseDTO,
  LoginDTO,
  ChangePasswordDTO
};