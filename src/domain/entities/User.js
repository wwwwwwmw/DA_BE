/**
 * User Entity - Business domain model
 * Contains business logic and domain rules
 */
class User {
  constructor({
    id,
    name,
    email,
    password,
    role = 'employee',
    departmentId = null,
    contact = null,
    employeePin = null,
    avatarUrl = null,
    failedLoginAttempts = 0,
    isLocked = false,
    createdAt = null,
    updatedAt = null
  }) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.password = password;
    this.role = role;
    this.departmentId = departmentId;
    this.contact = contact;
    this.employeePin = employeePin;
    this.avatarUrl = avatarUrl;
    this.failedLoginAttempts = failedLoginAttempts;
    this.isLocked = isLocked;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  // Business logic methods
  isAdmin() {
    return this.role === 'admin';
  }

  isManager() {
    return this.role === 'manager';
  }

  isEmployee() {
    return this.role === 'employee';
  }

  canManageUser(targetUser) {
    if (this.isAdmin()) return true;
    if (this.isManager() && targetUser.departmentId === this.departmentId) return true;
    return this.id === targetUser.id; // Self management
  }

  incrementFailedAttempts() {
    this.failedLoginAttempts++;
    if (this.failedLoginAttempts >= 5) {
      this.isLocked = true;
    }
  }

  resetFailedAttempts() {
    this.failedLoginAttempts = 0;
    this.isLocked = false;
  }

  unlock() {
    this.isLocked = false;
    this.failedLoginAttempts = 0;
  }

  // Validation methods
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validateRole(role) {
    return ['admin', 'manager', 'employee'].includes(role);
  }

  // Factory method
  static create(userData) {
    if (!userData.name || !userData.email || !userData.password) {
      throw new Error('Name, email, and password are required');
    }
    if (!this.validateEmail(userData.email)) {
      throw new Error('Invalid email format');
    }
    if (!this.validateRole(userData.role)) {
      throw new Error('Invalid role');
    }
    return new User(userData);
  }

  toJSON() {
    const json = { ...this };
    delete json.password; // Never expose password in JSON
    return json;
  }
}

module.exports = User;