const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { UserResponseDTO } = require('../dtos/UserDTOs');

/**
 * Use Case: Login
 * Handle user authentication
 */
class LoginUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(loginDTO) {
    const { email, password } = loginDTO;

    // Find user by email
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if account is locked
    if (user.isLocked) {
      throw new Error('Account is locked due to too many failed login attempts');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      // Increment failed attempts
      await this.userRepository.incrementFailedAttempts(user.id);
      throw new Error('Invalid credentials');
    }

    // Reset failed attempts on successful login
    if (user.failedLoginAttempts > 0) {
      await this.userRepository.resetFailedAttempts(user.id);
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        departmentId: user.departmentId 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    return {
      token,
      user: new UserResponseDTO(user)
    };
  }
}

/**
 * Use Case: Change Password
 */
class ChangePasswordUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(userId, changePasswordDTO) {
    const { currentPassword, newPassword } = changePasswordDTO;

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await this.userRepository.update(userId, { password: hashedNewPassword });

    return { message: 'Password changed successfully' };
  }
}

/**
 * Use Case: Admin Reset Password
 */
class AdminResetPasswordUseCase {
  constructor(userRepository, emailService) {
    this.userRepository = userRepository;
    this.emailService = emailService;
  }

  async execute(targetUserId, currentUser) {
    if (currentUser.role !== 'admin') {
      throw new Error('Only admin can reset passwords');
    }

    const user = await this.userRepository.findById(targetUserId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate temporary password
    const tempPassword = this.generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Update user password
    await this.userRepository.update(targetUserId, { password: hashedPassword });

    // Send email with temporary password
    try {
      await this.emailService.sendMail({
        to: user.email,
        subject: 'Mật khẩu tạm thời mới',
        html: `<p>Mật khẩu tạm thời của bạn: <strong>${tempPassword}</strong></p><p>Vui lòng đăng nhập và đổi mật khẩu ngay.</p>`
      });
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      // Don't throw here, password was already reset
    }

    return { message: 'Password reset successfully and email sent' };
  }

  generateTempPassword() {
    const crypto = require('crypto');
    return crypto.randomBytes(12).toString('base64url');
  }
}

/**
 * Use Case: Unlock Account
 */
class UnlockAccountUseCase {
  constructor(userRepository, notificationService, emailService) {
    this.userRepository = userRepository;
    this.notificationService = notificationService;
    this.emailService = emailService;
  }

  async execute(targetUserId, currentUser) {
    if (currentUser.role !== 'admin') {
      throw new Error('Only admin can unlock accounts');
    }

    const user = await this.userRepository.findById(targetUserId);
    if (!user) {
      throw new Error('User not found');
    }

    // Unlock account
    await this.userRepository.unlockAccount(targetUserId);

    // Send notifications
    try {
      await this.notificationService.notifyUsers(
        user.id,
        'Tài khoản đã được mở khóa',
        'Quản trị viên đã mở khóa tài khoản của bạn. Bạn có thể đăng nhập lại.',
        { ref_type: 'user', ref_id: user.id }
      );
    } catch (error) {
      console.error('Failed to send unlock notification:', error);
    }

    try {
      await this.emailService.sendMail({
        to: user.email,
        subject: 'Tài khoản đã được mở khóa',
        html: `<p>Xin chào <strong>${user.name}</strong>,</p><p>Tài khoản của bạn đã được quản trị viên mở khóa. Bạn có thể đăng nhập lại ngay bây giờ.</p>`
      });
    } catch (error) {
      console.error('Failed to send unlock email:', error);
    }

    return { message: 'Account unlocked successfully' };
  }
}

module.exports = {
  LoginUseCase,
  ChangePasswordUseCase,
  AdminResetPasswordUseCase,
  UnlockAccountUseCase
};