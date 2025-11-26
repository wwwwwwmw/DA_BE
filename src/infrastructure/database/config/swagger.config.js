const swaggerJsdoc = require('swagger-jsdoc');

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';
// Determine LAN IP for swagger servers list when HOST is 0.0.0.0
const os = require('os');
function getLanIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}
const lanIp = HOST === '0.0.0.0' ? getLanIp() : HOST;

const servers = [
  { url: `http://localhost:${PORT}`, description: 'Local HTTP' },
  { url: `http://${lanIp}:${PORT}`, description: 'LAN HTTP' },
];
const httpsPort = process.env.HTTPS_PORT;
if (httpsPort) {
  servers.push({ url: `https://localhost:${httpsPort}`, description: 'Local HTTPS' });
  servers.push({ url: `https://${lanIp}:${httpsPort}`, description: 'LAN HTTPS' });
}

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Lịch Công Tác API',
      version: '1.0.0',
      description: 'API Backend cho ứng dụng quản lý lịch công tác (Express + PostgreSQL + Sequelize + Socket.IO)'
    },
    servers,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      {
        name: 'Xác thực & Bảo mật',
        description: 'APIs liên quan đến đăng nhập, đăng ký và xác thực người dùng'
      },
      {
        name: 'Quản lý người dùng',
        description: 'APIs quản lý thông tin người dùng, tài khoản và phân quyền'
      },
      {
        name: 'Quản lý dự án & nhiệm vụ',
        description: 'APIs quản lý dự án, nhiệm vụ và phân công công việc'
      },
      {
        name: 'Quản lý lịch trình',
        description: 'APIs quản lý lịch họp, lịch công tác và các sự kiện'
      },
      {
        name: 'Thông báo',
        description: 'APIs quản lý thông báo và tin nhắn hệ thống'
      },
      {
        name: 'Báo cáo & thống kê',
        description: 'APIs tạo báo cáo và thống kê dữ liệu'
      },
      {
        name: 'Quản trị hệ thống',
        description: 'APIs quản lý phòng ban, phòng họp và cấu hình hệ thống'
      },
      {
        name: 'Sao lưu & khôi phục',
        description: 'APIs sao lưu và khôi phục dữ liệu'
      }
    ]
  },
  apis: [
    'src/presentation/routes/*.routes.js',
    'src/presentation/controllers/*.controller.js'
  ],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
