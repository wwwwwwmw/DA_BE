const bcrypt = require('bcryptjs');
const User = require('../../domain/entities/User');
const { UserResponseDTO } = require('../dtos/UserDTOs');

/**
 * Use Case: Create User
 * Business logic for creating a new user
 */
class CreateUserUseCase {
  constructor(userRepository, authService) {
    this.userRepository = userRepository;
    this.authService = authService;
  }

  async execute(createUserDTO, currentUser) {
    // Authorization checks
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'manager')) {
      throw new Error('Unauthorized to create users');
    }

    // Manager restrictions
    if (currentUser.role === 'manager') {
      if (createUserDTO.role !== 'employee') {
        throw new Error('Managers can only create employees');
      }
      if (createUserDTO.departmentId && createUserDTO.departmentId !== currentUser.departmentId) {
        throw new Error('Cannot create user for another department');
      }
    }

    // Check if email already exists
    const existingUser = await this.userRepository.findByEmail(createUserDTO.email);
    if (existingUser) {
      throw new Error('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDTO.password, 10);
    
    // Create user entity
    const userData = {
      ...createUserDTO,
      password: hashedPassword,
      departmentId: createUserDTO.departmentId || (currentUser.role === 'manager' ? currentUser.departmentId : null)
    };
    
    const user = User.create(userData);

    // Save to repository
    const createdUser = await this.userRepository.create(user);
    
    return new UserResponseDTO(createdUser);
  }
}

/**
 * Use Case: Get User
 */
class GetUserUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(userId, currentUser) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Authorization: self, admin, or manager of same department
    if (!user.canManageUser(user) && !currentUser.canManageUser(user)) {
      throw new Error('Unauthorized to view this user');
    }

    return new UserResponseDTO(user);
  }
}

/**
 * Use Case: Update User
 */
class UpdateUserUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(userId, updateUserDTO, currentUser) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Authorization checks
    if (!currentUser.canManageUser(user)) {
      throw new Error('Unauthorized to update this user');
    }

    // Only admin can change roles
    if (updateUserDTO.role && currentUser.role !== 'admin') {
      throw new Error('Only admin can change user roles');
    }

    // Hash password if provided
    if (updateUserDTO.password) {
      updateUserDTO.password = await bcrypt.hash(updateUserDTO.password, 10);
    }

    const updatedUser = await this.userRepository.update(userId, updateUserDTO);
    return new UserResponseDTO(updatedUser);
  }
}

/**
 * Use Case: List Users
 */
class ListUsersUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(options = {}, currentUser) {
    let users;

    if (currentUser.role === 'admin') {
      users = await this.userRepository.findAll(options);
    } else if (currentUser.role === 'manager') {
      users = await this.userRepository.findByDepartment(currentUser.departmentId, options);
    } else {
      // Employees can only see themselves
      users = [await this.userRepository.findById(currentUser.id)].filter(Boolean);
    }

    return users.map(user => new UserResponseDTO(user));
  }
}

/**
 * Use Case: Delete User
 */
class DeleteUserUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(userId, currentUser) {
    if (currentUser.role !== 'admin') {
      throw new Error('Only admin can delete users');
    }

    if (userId === currentUser.id) {
      throw new Error('Cannot delete yourself');
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    await this.userRepository.delete(userId);
    return { message: 'User deleted successfully' };
  }
}

module.exports = {
  CreateUserUseCase,
  GetUserUseCase,
  UpdateUserUseCase,
  ListUsersUseCase,
  DeleteUserUseCase
};