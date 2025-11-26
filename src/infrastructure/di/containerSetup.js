const DIContainer = require('./DIContainer');

// Import domain repositories interfaces
const IUserRepository = require('../../domain/repositories/IUserRepository');
const IEventRepository = require('../../domain/repositories/IEventRepository');
const ITaskRepository = require('../../domain/repositories/ITaskRepository');

// Import infrastructure implementations
const SequelizeUserRepository = require('../repositories/SequelizeUserRepository');
const { sequelize, User, Department, Event, Task, Participant, Room, Project, Label, Notification } = require('../database/models');

// Import use cases
const { 
  CreateUserUseCase, 
  GetUserUseCase, 
  UpdateUserUseCase, 
  ListUsersUseCase, 
  DeleteUserUseCase 
} = require('../../application/use-cases/UserUseCases');

const {
  LoginUseCase,
  ChangePasswordUseCase,
  AdminResetPasswordUseCase,
  UnlockAccountUseCase
} = require('../../application/use-cases/AuthUseCases');

// Import external services
const emailService = require('../external-services/services/email');
const notificationService = require('../external-services/services/notification.service');

/**
 * Configure and setup dependency injection container
 */
function setupContainer() {
  const container = new DIContainer();

  // Register database models as singletons
  container.registerSingleton('sequelize', () => sequelize);
  container.registerSingleton('UserModel', () => User);
  container.registerSingleton('DepartmentModel', () => Department);
  container.registerSingleton('EventModel', () => Event);
  container.registerSingleton('TaskModel', () => Task);
  container.registerSingleton('ParticipantModel', () => Participant);
  container.registerSingleton('RoomModel', () => Room);
  container.registerSingleton('ProjectModel', () => Project);
  container.registerSingleton('LabelModel', () => Label);
  container.registerSingleton('NotificationModel', () => Notification);

  // Register external services
  container.registerSingleton('emailService', () => emailService);
  container.registerSingleton('notificationService', () => notificationService);

  // Register repository implementations
  container.registerSingleton('userRepository', (container) => {
    const UserModel = container.resolve('UserModel');
    const DepartmentModel = container.resolve('DepartmentModel');
    return new SequelizeUserRepository(UserModel, DepartmentModel);
  });

  // TODO: Register other repositories when implemented
  // container.registerSingleton('eventRepository', (container) => {
  //   const EventModel = container.resolve('EventModel');
  //   return new SequelizeEventRepository(EventModel);
  // });

  // Register use cases
  container.register('createUserUseCase', (container) => {
    const userRepository = container.resolve('userRepository');
    return new CreateUserUseCase(userRepository);
  });

  container.register('getUserUseCase', (container) => {
    const userRepository = container.resolve('userRepository');
    return new GetUserUseCase(userRepository);
  });

  container.register('updateUserUseCase', (container) => {
    const userRepository = container.resolve('userRepository');
    return new UpdateUserUseCase(userRepository);
  });

  container.register('listUsersUseCase', (container) => {
    const userRepository = container.resolve('userRepository');
    return new ListUsersUseCase(userRepository);
  });

  container.register('deleteUserUseCase', (container) => {
    const userRepository = container.resolve('userRepository');
    return new DeleteUserUseCase(userRepository);
  });

  container.register('loginUseCase', (container) => {
    const userRepository = container.resolve('userRepository');
    return new LoginUseCase(userRepository);
  });

  container.register('changePasswordUseCase', (container) => {
    const userRepository = container.resolve('userRepository');
    return new ChangePasswordUseCase(userRepository);
  });

  container.register('adminResetPasswordUseCase', (container) => {
    const userRepository = container.resolve('userRepository');
    const emailService = container.resolve('emailService');
    return new AdminResetPasswordUseCase(userRepository, emailService);
  });

  container.register('unlockAccountUseCase', (container) => {
    const userRepository = container.resolve('userRepository');
    const notificationService = container.resolve('notificationService');
    const emailService = container.resolve('emailService');
    return new UnlockAccountUseCase(userRepository, notificationService, emailService);
  });

  return container;
}

module.exports = { setupContainer };