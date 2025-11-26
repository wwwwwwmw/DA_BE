const IUserRepository = require('../../domain/repositories/IUserRepository');
const User = require('../../domain/entities/User');

/**
 * Sequelize implementation of User Repository
 */
class SequelizeUserRepository extends IUserRepository {
  constructor(userModel, departmentModel) {
    super();
    this.userModel = userModel;
    this.departmentModel = departmentModel;
  }

  async findById(id) {
    const userRecord = await this.userModel.findByPk(id, {
      include: [{ model: this.departmentModel }],
      attributes: { exclude: [] } // Include password for internal use
    });
    
    if (!userRecord) return null;
    
    return this._mapToDomainEntity(userRecord);
  }

  async findByEmail(email) {
    const userRecord = await this.userModel.findOne({
      where: { email },
      include: [{ model: this.departmentModel }],
      attributes: { exclude: [] }
    });
    
    if (!userRecord) return null;
    
    return this._mapToDomainEntity(userRecord);
  }

  async findAll(options = {}) {
    const { limit = 50, offset = 0 } = options;
    
    const userRecords = await this.userModel.findAll({
      attributes: { exclude: ['password'] },
      include: [{ model: this.departmentModel }],
      limit: Number(limit),
      offset: Number(offset),
      order: [['created_at', 'DESC']]
    });
    
    return userRecords.map(record => this._mapToDomainEntity(record, false));
  }

  async findByDepartment(departmentId, options = {}) {
    const { limit = 50, offset = 0 } = options;
    
    const userRecords = await this.userModel.findAll({
      where: { departmentId },
      attributes: { exclude: ['password'] },
      include: [{ model: this.departmentModel }],
      limit: Number(limit),
      offset: Number(offset),
      order: [['created_at', 'DESC']]
    });
    
    return userRecords.map(record => this._mapToDomainEntity(record, false));
  }

  async create(userEntity) {
    const userRecord = await this.userModel.create({
      name: userEntity.name,
      email: userEntity.email,
      password: userEntity.password,
      role: userEntity.role,
      departmentId: userEntity.departmentId,
      contact: userEntity.contact,
      employee_pin: userEntity.employeePin,
      avatar_url: userEntity.avatarUrl
    });
    
    return this._mapToDomainEntity(userRecord, false);
  }

  async update(id, updateData) {
    const updateFields = {};
    
    if (updateData.name !== undefined) updateFields.name = updateData.name;
    if (updateData.departmentId !== undefined) updateFields.departmentId = updateData.departmentId;
    if (updateData.password !== undefined) updateFields.password = updateData.password;
    if (updateData.contact !== undefined) updateFields.contact = updateData.contact;
    if (updateData.employeePin !== undefined) updateFields.employee_pin = updateData.employeePin;
    if (updateData.avatarUrl !== undefined) updateFields.avatar_url = updateData.avatarUrl;
    if (updateData.role !== undefined) updateFields.role = updateData.role;
    
    await this.userModel.update(updateFields, { where: { id } });
    
    const updatedRecord = await this.userModel.findByPk(id, {
      include: [{ model: this.departmentModel }],
      attributes: { exclude: ['password'] }
    });
    
    return this._mapToDomainEntity(updatedRecord, false);
  }

  async delete(id) {
    const result = await this.userModel.destroy({ where: { id } });
    return result > 0;
  }

  async incrementFailedAttempts(id) {
    const user = await this.userModel.findByPk(id);
    if (user) {
      user.failed_login_attempts += 1;
      if (user.failed_login_attempts >= 5) {
        user.is_locked = true;
      }
      await user.save();
    }
  }

  async resetFailedAttempts(id) {
    await this.userModel.update(
      { failed_login_attempts: 0, is_locked: false },
      { where: { id } }
    );
  }

  async lockAccount(id) {
    await this.userModel.update(
      { is_locked: true },
      { where: { id } }
    );
  }

  async unlockAccount(id) {
    await this.userModel.update(
      { is_locked: false, failed_login_attempts: 0 },
      { where: { id } }
    );
  }

  _mapToDomainEntity(userRecord, includePassword = true) {
    if (!userRecord) return null;
    
    const userData = {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      role: userRecord.role,
      departmentId: userRecord.departmentId,
      contact: userRecord.contact,
      employeePin: userRecord.employee_pin,
      avatarUrl: userRecord.avatar_url,
      failedLoginAttempts: userRecord.failed_login_attempts,
      isLocked: userRecord.is_locked,
      createdAt: userRecord.created_at,
      updatedAt: userRecord.updated_at
    };
    
    if (includePassword && userRecord.password) {
      userData.password = userRecord.password;
    }
    
    return new User(userData);
  }
}

module.exports = SequelizeUserRepository;