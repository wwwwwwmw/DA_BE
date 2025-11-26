const bcrypt = require('bcryptjs');
const {
  Department,
  User,
  Room,
  Event,
  EventDepartment,
  Participant,
  Notification,
  Project,
  Task,
  TaskAssignment,
  Label,
  TaskLabel,
  TaskComment
} = require('../models');

async function runSeed() {
  const count = await User.count();
  if (count > 0) return false; // already seeded

  // ===== DEPARTMENTS =====
  const [dep1, dep2, dep3, dep4, dep5] = await Promise.all([
    Department.create({ name: 'Hành chính', description: 'Phòng hành chính - Quản lý văn phòng và nhân sự' }),
    Department.create({ name: 'Kỹ thuật', description: 'Phòng kỹ thuật - Phát triển sản phẩm và công nghệ' }),
    Department.create({ name: 'Kinh doanh', description: 'Phòng kinh doanh - Bán hàng và chăm sóc khách hàng' }),
    Department.create({ name: 'Marketing', description: 'Phòng Marketing - Truyền thông và quảng cáo' }),
    Department.create({ name: 'Tài chính', description: 'Phòng Tài chính - Kế toán và quản lý ngân sách' }),
  ]);

  // ===== USERS =====
  const pass = await bcrypt.hash('password123', 10);
  const admin = await User.create({ name: 'Nguyễn Văn An', email: 'admin1@tempmail.vn', password: pass, role: 'admin', departmentId: dep1.id });
  const manager1 = await User.create({ name: 'Trần Thị Bình', email: 'manager1@tempmail.vn', password: pass, role: 'manager', departmentId: dep2.id });
  const manager2 = await User.create({ name: 'Lê Văn Cường', email: 'manager2@tempmail.vn', password: pass, role: 'manager', departmentId: dep3.id });
  const emp1 = await User.create({ name: 'Phạm Thị Dung', email: 'emp1@tempmail.vn', password: pass, role: 'employee', departmentId: dep2.id });
  const emp2 = await User.create({ name: 'Hoàng Văn Em', email: 'emp2@tempmail.vn', password: pass, role: 'employee', departmentId: dep2.id });
  const emp3 = await User.create({ name: 'Võ Thị Phương', email: 'emp3@tempmail.vn', password: pass, role: 'employee', departmentId: dep3.id });
  const emp4 = await User.create({ name: 'Đặng Văn Giang', email: 'emp4@tempmail.vn', password: pass, role: 'employee', departmentId: dep3.id });
  const emp5 = await User.create({ name: 'Bùi Thị Hoa', email: 'emp5@tempmail.vn', password: pass, role: 'employee', departmentId: dep4.id });
  const emp6 = await User.create({ name: 'Ngô Văn Hùng', email: 'emp6@tempmail.vn', password: pass, role: 'employee', departmentId: dep4.id });
  const emp7 = await User.create({ name: 'Trương Thị Lan', email: 'emp7@tempmail.vn', password: pass, role: 'employee', departmentId: dep5.id });

  // ===== ROOMS =====
  const [r1, r2, r3, r4, r5] = await Promise.all([
    Room.create({ name: 'Phòng họp 101', location: 'Tầng 1', capacity: 10 }),
    Room.create({ name: 'Phòng họp 202', location: 'Tầng 2', capacity: 20 }),
    Room.create({ name: 'Phòng họp 303', location: 'Tầng 3', capacity: 15 }),
    Room.create({ name: 'Phòng họp VIP', location: 'Tầng 5', capacity: 8 }),
    Room.create({ name: 'Hội trường lớn', location: 'Tầng 1', capacity: 50 }),
  ]);

  // ===== EVENTS =====
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 86400000);
  const nextWeek = new Date(now.getTime() + 7 * 86400000);

  const e1 = await Event.create({
    title: 'Họp dự án Website',
    description: 'Trao đổi tiến độ phát triển website công ty',
    start_time: now,
    end_time: new Date(now.getTime() + 3600000),
    roomId: r1.id,
    createdById: emp1.id,
    departmentId: dep2.id
  });

  const e2 = await Event.create({
    title: 'Kế hoạch Q4 2024',
    description: 'Lập kế hoạch kinh doanh quý 4',
    start_time: tomorrow,
    end_time: new Date(tomorrow.getTime() + 7200000),
    roomId: r2.id,
    createdById: manager2.id,
    departmentId: dep3.id
  });

  const e3 = await Event.create({
    title: 'Đào tạo kỹ năng mềm',
    description: 'Khóa đào tạo kỹ năng giao tiếp và làm việc nhóm',
    start_time: nextWeek,
    end_time: new Date(nextWeek.getTime() + 10800000),
    roomId: r5.id,
    createdById: admin.id,
    departmentId: dep1.id
  });

  const e4 = await Event.create({
    title: 'Báo cáo tuần',
    description: 'Tổng kết công việc tuần qua',
    start_time: new Date(now.getTime() + 2 * 86400000),
    end_time: new Date(now.getTime() + 2 * 86400000 + 3600000),
    roomId: r1.id,
    createdById: manager1.id,
    departmentId: dep2.id
  });

  const e5 = await Event.create({
    title: 'Phỏng vấn ứng viên',
    description: 'Phỏng vấn vị trí Developer',
    start_time: new Date(now.getTime() + 3 * 86400000),
    end_time: new Date(now.getTime() + 3 * 86400000 + 5400000),
    roomId: r4.id,
    createdById: admin.id,
    departmentId: dep1.id
  });

  const e6 = await Event.create({
    title: 'Họp chiến lược Marketing',
    description: 'Xây dựng chiến lược marketing cho sản phẩm mới',
    start_time: new Date(now.getTime() + 4 * 86400000),
    end_time: new Date(now.getTime() + 4 * 86400000 + 7200000),
    roomId: r3.id,
    createdById: emp5.id,
    departmentId: dep4.id
  });

  const e7 = await Event.create({
    title: 'Review tài chính tháng',
    description: 'Đánh giá tình hình tài chính tháng 11',
    start_time: new Date(now.getTime() + 5 * 86400000),
    end_time: new Date(now.getTime() + 5 * 86400000 + 3600000),
    roomId: r4.id,
    createdById: emp7.id,
    departmentId: dep5.id
  });

  const e8 = await Event.create({
    title: 'Kickoff dự án Mobile App',
    description: 'Khởi động dự án phát triển ứng dụng di động',
    start_time: new Date(now.getTime() + 6 * 86400000),
    end_time: new Date(now.getTime() + 6 * 86400000 + 5400000),
    roomId: r2.id,
    createdById: manager1.id,
    departmentId: dep2.id
  });

  const e9 = await Event.create({
    title: 'Họp tổng kết quý',
    description: 'Tổng kết kết quả kinh doanh quý 3',
    start_time: new Date(now.getTime() + 7 * 86400000),
    end_time: new Date(now.getTime() + 7 * 86400000 + 7200000),
    roomId: r5.id,
    createdById: admin.id,
    departmentId: dep1.id
  });

  const e10 = await Event.create({
    title: 'Workshop UX/UI Design',
    description: 'Hội thảo thiết kế trải nghiệm người dùng',
    start_time: new Date(now.getTime() + 8 * 86400000),
    end_time: new Date(now.getTime() + 8 * 86400000 + 10800000),
    roomId: r3.id,
    createdById: emp1.id,
    departmentId: dep2.id
  });

  const e11 = await Event.create({
    title: 'Đào tạo quy trình bán hàng',
    description: 'Đào tạo quy trình bán hàng mới cho nhân viên',
    start_time: new Date(now.getTime() + 9 * 86400000),
    end_time: new Date(now.getTime() + 9 * 86400000 + 7200000),
    roomId: r2.id,
    createdById: manager2.id,
    departmentId: dep3.id
  });

  const e12 = await Event.create({
    title: 'Họp an toàn lao động',
    description: 'Hướng dẫn an toàn lao động và phòng cháy chữa cháy',
    start_time: new Date(now.getTime() + 10 * 86400000),
    end_time: new Date(now.getTime() + 10 * 86400000 + 5400000),
    roomId: r5.id,
    createdById: admin.id,
    departmentId: dep1.id
  });

  // ===== EVENT DEPARTMENTS (Multi-department events) =====
  await EventDepartment.bulkCreate([
    { eventId: e3.id, departmentId: dep2.id }, // Đào tạo cho cả phòng Kỹ thuật
    { eventId: e3.id, departmentId: dep3.id }, // và Kinh doanh
    { eventId: e3.id, departmentId: dep4.id }, // và Marketing
    { eventId: e9.id, departmentId: dep2.id }, // Họp tổng kết cho tất cả phòng ban
    { eventId: e9.id, departmentId: dep3.id },
    { eventId: e9.id, departmentId: dep4.id },
    { eventId: e9.id, departmentId: dep5.id },
    { eventId: e12.id, departmentId: dep2.id }, // An toàn lao động cho tất cả
    { eventId: e12.id, departmentId: dep3.id },
    { eventId: e12.id, departmentId: dep4.id },
    { eventId: e12.id, departmentId: dep5.id },
  ]);

  // ===== PARTICIPANTS =====
  await Participant.bulkCreate([
    { eventId: e1.id, userId: manager1.id },
    { eventId: e1.id, userId: emp2.id },
    { eventId: e1.id, userId: emp1.id },
    { eventId: e2.id, userId: manager2.id },
    { eventId: e2.id, userId: emp3.id },
    { eventId: e2.id, userId: emp4.id },
    { eventId: e3.id, userId: emp1.id },
    { eventId: e3.id, userId: emp2.id },
    { eventId: e3.id, userId: emp3.id },
    { eventId: e3.id, userId: emp4.id },
    { eventId: e3.id, userId: emp5.id },
    { eventId: e3.id, userId: emp6.id },
    { eventId: e4.id, userId: emp1.id },
    { eventId: e4.id, userId: emp2.id },
    { eventId: e5.id, userId: manager1.id },
    { eventId: e5.id, userId: emp1.id },
    { eventId: e6.id, userId: emp6.id },
    { eventId: e6.id, userId: manager2.id },
    { eventId: e7.id, userId: admin.id },
    { eventId: e8.id, userId: emp1.id },
    { eventId: e8.id, userId: emp2.id },
    { eventId: e8.id, userId: manager1.id },
    { eventId: e9.id, userId: admin.id },
    { eventId: e9.id, userId: manager1.id },
    { eventId: e9.id, userId: manager2.id },
    { eventId: e10.id, userId: emp1.id },
    { eventId: e10.id, userId: emp2.id },
    { eventId: e10.id, userId: emp5.id },
    { eventId: e11.id, userId: emp3.id },
    { eventId: e11.id, userId: emp4.id },
    { eventId: e12.id, userId: admin.id },
    { eventId: e12.id, userId: manager1.id },
    { eventId: e12.id, userId: manager2.id },
  ]);

  // ===== NOTIFICATIONS =====
  await Notification.bulkCreate([
    { userId: admin.id, title: 'Chào mừng', message: 'Hệ thống quản lý lịch làm việc đã sẵn sàng', isRead: true },
    { userId: admin.id, title: 'Sự kiện mới', message: 'Bạn được mời tham gia "Họp tổng kết quý"', isRead: false },
    { userId: manager1.id, title: 'Công việc', message: 'Kiểm tra lịch họp tuần này', isRead: true },
    { userId: manager1.id, title: 'Nhắc nhở', message: 'Họp báo cáo tuần sẽ diễn ra vào ngày mai', isRead: false },
    { userId: manager2.id, title: 'Thông báo', message: 'Kế hoạch Q4 cần được hoàn thiện trước cuối tuần', isRead: false },
    { userId: emp1.id, title: 'Lịch mới', message: 'Bạn có lịch họp "Họp dự án Website" hôm nay', isRead: false },
    { userId: emp1.id, title: 'Task mới', message: 'Bạn được giao task "Thiết kế giao diện trang chủ"', isRead: false },
    { userId: emp2.id, title: 'Lịch mới', message: 'Bạn được mời tham gia "Kickoff dự án Mobile App"', isRead: false },
    { userId: emp3.id, title: 'Thông báo', message: 'Đào tạo kỹ năng mềm sẽ diễn ra tuần sau', isRead: true },
    { userId: emp4.id, title: 'Nhắc nhở', message: 'Hoàn thành báo cáo bán hàng tháng 11', isRead: false },
    { userId: emp5.id, title: 'Lịch họp', message: 'Họp chiến lược Marketing vào thứ 5 tuần này', isRead: false },
    { userId: emp6.id, title: 'Task', message: 'Task "Viết content Facebook" đã quá hạn', isRead: false },
    { userId: emp7.id, title: 'Tài chính', message: 'Cần review báo cáo tài chính tháng 11', isRead: false },
  ]);

  // ===== PROJECTS =====
  const proj1 = await Project.create({
    name: 'Website Công ty',
    description: 'Phát triển website giới thiệu công ty và sản phẩm',
    departmentId: dep2.id,
    status: 'in_progress',
    startDate: new Date(now.getTime() - 30 * 86400000),
    endDate: new Date(now.getTime() + 60 * 86400000)
  });

  const proj2 = await Project.create({
    name: 'Mobile App CRM',
    description: 'Ứng dụng quản lý quan hệ khách hàng trên di động',
    departmentId: dep2.id,
    status: 'planning',
    startDate: new Date(now.getTime() + 7 * 86400000),
    endDate: new Date(now.getTime() + 120 * 86400000)
  });

  const proj3 = await Project.create({
    name: 'Chiến dịch Marketing Q4',
    description: 'Chiến dịch quảng cáo và marketing quý 4',
    departmentId: dep4.id,
    status: 'in_progress',
    startDate: new Date(now.getTime() - 15 * 86400000),
    endDate: new Date(now.getTime() + 45 * 86400000)
  });

  const proj4 = await Project.create({
    name: 'Tối ưu quy trình bán hàng',
    description: 'Cải thiện và tự động hóa quy trình bán hàng',
    departmentId: dep3.id,
    status: 'in_progress',
    startDate: new Date(now.getTime() - 20 * 86400000),
    endDate: new Date(now.getTime() + 40 * 86400000)
  });

  const proj5 = await Project.create({
    name: 'Hệ thống quản lý nội bộ',
    description: 'Phát triển hệ thống quản lý nhân sự và tài chính nội bộ',
    departmentId: dep1.id,
    status: 'planning',
    startDate: new Date(now.getTime() + 14 * 86400000),
    endDate: new Date(now.getTime() + 180 * 86400000)
  });

  // ===== LABELS =====
  const label1 = await Label.create({ name: 'Urgent', color: '#FF0000' });
  const label2 = await Label.create({ name: 'Bug', color: '#DC143C' });
  const label3 = await Label.create({ name: 'Feature', color: '#1E90FF' });
  const label4 = await Label.create({ name: 'Design', color: '#9370DB' });
  const label5 = await Label.create({ name: 'Backend', color: '#32CD32' });
  const label6 = await Label.create({ name: 'Frontend', color: '#FFD700' });
  const label7 = await Label.create({ name: 'Testing', color: '#FF8C00' });
  const label8 = await Label.create({ name: 'Documentation', color: '#808080' });

  // ===== TASKS =====
  const task1 = await Task.create({
    title: 'Thiết kế giao diện trang chủ',
    description: 'Thiết kế UI/UX cho trang chủ website công ty',
    projectId: proj1.id,
    createdById: manager1.id,
    status: 'in_progress',
    priority: 'high',
    dueDate: new Date(now.getTime() + 7 * 86400000)
  });

  const task2 = await Task.create({
    title: 'Phát triển API đăng nhập',
    description: 'Xây dựng API authentication và authorization',
    projectId: proj1.id,
    createdById: manager1.id,
    status: 'in_progress',
    priority: 'high',
    dueDate: new Date(now.getTime() + 5 * 86400000)
  });

  const task3 = await Task.create({
    title: 'Viết test cases',
    description: 'Viết unit test và integration test cho module user',
    projectId: proj1.id,
    createdById: manager1.id,
    status: 'todo',
    priority: 'medium',
    dueDate: new Date(now.getTime() + 10 * 86400000)
  });

  const task4 = await Task.create({
    title: 'Fix lỗi responsive mobile',
    description: 'Sửa lỗi hiển thị trên màn hình điện thoại',
    projectId: proj1.id,
    createdById: emp1.id,
    status: 'done',
    priority: 'high',
    dueDate: new Date(now.getTime() - 2 * 86400000)
  });

  const task5 = await Task.create({
    title: 'Nghiên cứu công nghệ React Native',
    description: 'Tìm hiểu và đánh giá React Native cho dự án mobile',
    projectId: proj2.id,
    createdById: manager1.id,
    status: 'in_progress',
    priority: 'medium',
    dueDate: new Date(now.getTime() + 14 * 86400000)
  });

  const task6 = await Task.create({
    title: 'Thiết kế database schema',
    description: 'Thiết kế cấu trúc database cho ứng dụng CRM',
    projectId: proj2.id,
    createdById: manager1.id,
    status: 'todo',
    priority: 'high',
    dueDate: new Date(now.getTime() + 20 * 86400000)
  });

  const task7 = await Task.create({
    title: 'Viết content Facebook',
    description: 'Viết nội dung bài đăng Facebook cho chiến dịch',
    projectId: proj3.id,
    createdById: emp5.id,
    status: 'overdue',
    priority: 'urgent',
    dueDate: new Date(now.getTime() - 3 * 86400000)
  });

  const task8 = await Task.create({
    title: 'Thiết kế banner quảng cáo',
    description: 'Thiết kế banner cho Google Ads và Facebook Ads',
    projectId: proj3.id,
    createdById: emp5.id,
    status: 'in_progress',
    priority: 'high',
    dueDate: new Date(now.getTime() + 3 * 86400000)
  });

  const task9 = await Task.create({
    title: 'Phân tích hiệu quả chiến dịch',
    description: 'Đánh giá ROI và hiệu quả của chiến dịch marketing tháng 10',
    projectId: proj3.id,
    createdById: emp6.id,
    status: 'done',
    priority: 'medium',
    dueDate: new Date(now.getTime() - 5 * 86400000)
  });

  const task10 = await Task.create({
    title: 'Xây dựng quy trình chăm sóc khách hàng',
    description: 'Thiết lập quy trình chuẩn cho việc chăm sóc khách hàng sau bán',
    projectId: proj4.id,
    createdById: manager2.id,
    status: 'in_progress',
    priority: 'high',
    dueDate: new Date(now.getTime() + 15 * 86400000)
  });

  const task11 = await Task.create({
    title: 'Đào tạo nhân viên bán hàng',
    description: 'Tổ chức khóa đào tạo kỹ năng bán hàng cho nhân viên mới',
    projectId: proj4.id,
    createdById: manager2.id,
    status: 'todo',
    priority: 'medium',
    dueDate: new Date(now.getTime() + 21 * 86400000)
  });

  const task12 = await Task.create({
    title: 'Tạo template báo cáo bán hàng',
    description: 'Thiết kế template báo cáo bán hàng hàng tháng',
    projectId: proj4.id,
    createdById: emp3.id,
    status: 'done',
    priority: 'low',
    dueDate: new Date(now.getTime() - 7 * 86400000)
  });

  const task13 = await Task.create({
    title: 'Khảo sát yêu cầu hệ thống',
    description: 'Thu thập yêu cầu từ các phòng ban cho hệ thống quản lý nội bộ',
    projectId: proj5.id,
    createdById: admin.id,
    status: 'in_progress',
    priority: 'high',
    dueDate: new Date(now.getTime() + 10 * 86400000)
  });

  const task14 = await Task.create({
    title: 'Viết tài liệu đặc tả',
    description: 'Viết tài liệu đặc tả chi tiết cho hệ thống',
    projectId: proj5.id,
    createdById: admin.id,
    status: 'todo',
    priority: 'medium',
    dueDate: new Date(now.getTime() + 25 * 86400000)
  });

  const task15 = await Task.create({
    title: 'Đánh giá các giải pháp có sẵn',
    description: 'So sánh các phần mềm quản lý nội bộ có sẵn trên thị trường',
    projectId: proj5.id,
    createdById: admin.id,
    status: 'todo',
    priority: 'low',
    dueDate: new Date(now.getTime() + 30 * 86400000)
  });

  // ===== TASK ASSIGNMENTS =====
  await TaskAssignment.bulkCreate([
    { taskId: task1.id, userId: emp1.id },
    { taskId: task1.id, userId: emp5.id },
    { taskId: task2.id, userId: emp2.id },
    { taskId: task3.id, userId: emp2.id },
    { taskId: task4.id, userId: emp1.id },
    { taskId: task5.id, userId: emp1.id },
    { taskId: task5.id, userId: emp2.id },
    { taskId: task6.id, userId: emp2.id },
    { taskId: task7.id, userId: emp5.id },
    { taskId: task8.id, userId: emp5.id },
    { taskId: task8.id, userId: emp6.id },
    { taskId: task9.id, userId: emp6.id },
    { taskId: task10.id, userId: emp3.id },
    { taskId: task10.id, userId: emp4.id },
    { taskId: task11.id, userId: manager2.id },
    { taskId: task12.id, userId: emp3.id },
    { taskId: task13.id, userId: admin.id },
    { taskId: task13.id, userId: manager1.id },
    { taskId: task13.id, userId: manager2.id },
    { taskId: task14.id, userId: emp1.id },
    { taskId: task15.id, userId: emp7.id },
  ]);

  // ===== TASK LABELS =====
  await TaskLabel.bulkCreate([
    { taskId: task1.id, labelId: label4.id }, // Design
    { taskId: task1.id, labelId: label6.id }, // Frontend
    { taskId: task2.id, labelId: label5.id }, // Backend
    { taskId: task2.id, labelId: label3.id }, // Feature
    { taskId: task3.id, labelId: label7.id }, // Testing
    { taskId: task4.id, labelId: label2.id }, // Bug
    { taskId: task4.id, labelId: label6.id }, // Frontend
    { taskId: task5.id, labelId: label3.id }, // Feature
    { taskId: task6.id, labelId: label5.id }, // Backend
    { taskId: task6.id, labelId: label4.id }, // Design
    { taskId: task7.id, labelId: label1.id }, // Urgent
    { taskId: task8.id, labelId: label4.id }, // Design
    { taskId: task8.id, labelId: label1.id }, // Urgent
    { taskId: task10.id, labelId: label3.id }, // Feature
    { taskId: task13.id, labelId: label8.id }, // Documentation
    { taskId: task14.id, labelId: label8.id }, // Documentation
  ]);

  // ===== TASK COMMENTS =====
  await TaskComment.bulkCreate([
    {
      taskId: task1.id,
      userId: emp1.id,
      content: 'Đã hoàn thành phần wireframe, đang chờ feedback từ khách hàng',
      createdAt: new Date(now.getTime() - 2 * 86400000)
    },
    {
      taskId: task1.id,
      userId: manager1.id,
      content: 'Thiết kế trông rất đẹp, nhưng cần điều chỉnh màu sắc cho phù hợp với brand',
      createdAt: new Date(now.getTime() - 1 * 86400000)
    },
    {
      taskId: task2.id,
      userId: emp2.id,
      content: 'API đăng nhập đã hoàn thành 80%, đang implement JWT token',
      createdAt: new Date(now.getTime() - 1 * 86400000)
    },
    {
      taskId: task2.id,
      userId: manager1.id,
      content: 'Nhớ thêm rate limiting để tránh brute force attack nhé',
      createdAt: new Date(now.getTime() - 12 * 3600000)
    },
    {
      taskId: task4.id,
      userId: emp1.id,
      content: 'Đã fix xong lỗi responsive, test trên iPhone và Samsung đều OK',
      createdAt: new Date(now.getTime() - 3 * 86400000)
    },
    {
      taskId: task5.id,
      userId: emp1.id,
      content: 'React Native có vẻ phù hợp cho dự án này, performance tốt và có nhiều thư viện hỗ trợ',
      createdAt: new Date(now.getTime() - 1 * 86400000)
    },
    {
      taskId: task7.id,
      userId: emp5.id,
      content: 'Xin lỗi vì delay, sẽ hoàn thành trong hôm nay',
      createdAt: new Date(now.getTime() - 1 * 86400000)
    },
    {
      taskId: task8.id,
      userId: emp6.id,
      content: 'Đã thiết kế 3 phiên bản banner, gửi anh/chị xem và chọn',
      createdAt: new Date(now.getTime() - 6 * 3600000)
    },
    {
      taskId: task8.id,
      userId: emp5.id,
      content: 'Mình thích phiên bản thứ 2 nhất, màu sắc nổi bật và thu hút',
      createdAt: new Date(now.getTime() - 3 * 3600000)
    },
    {
      taskId: task10.id,
      userId: emp3.id,
      content: 'Đã draft quy trình, cần review từ manager trước khi triển khai',
      createdAt: new Date(now.getTime() - 2 * 86400000)
    },
    {
      taskId: task13.id,
      userId: admin.id,
      content: 'Đã họp với phòng Kỹ thuật và Kinh doanh, còn phòng Marketing và Tài chính',
      createdAt: new Date(now.getTime() - 1 * 86400000)
    },
    {
      taskId: task13.id,
      userId: manager2.id,
      content: 'Phòng Kinh doanh cần thêm tính năng quản lý lead và báo cáo doanh số',
      createdAt: new Date(now.getTime() - 18 * 3600000)
    },
  ]);

  return true;
}

module.exports = runSeed;
