const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuración de rutas...\n');

// Verificar que ticket.routes.js existe
const ticketRoutesPath = path.join(__dirname, '../routes/ticket.routes.js');
if (fs.existsSync(ticketRoutesPath)) {
  console.log('✅ routes/ticket.routes.js existe');
} else {
  console.log('❌ routes/ticket.routes.js NO existe');
}

// Verificar que ticket.controller.js exporta sendTicketEmail
const ticketControllerPath = path.join(__dirname, '../controllers/ticket.controller.js');
if (fs.existsSync(ticketControllerPath)) {
  const controllerContent = fs.readFileSync(ticketControllerPath, 'utf8');
  const exportsSendTicketEmail = controllerContent.includes('sendTicketEmail');
  console.log('✅ controllers/ticket.controller.js exporta sendTicketEmail:', exportsSendTicketEmail);
} else {
  console.log('❌ controllers/ticket.controller.js NO existe');
}

// Verificar app.js incluye ticketRoutes
const appPath = path.join(__dirname, '../app.js');
if (fs.existsSync(appPath)) {
  const appContent = fs.readFileSync(appPath, 'utf8');
  const includesTicketRoutes = appContent.includes("const ticketRoutes = require('./routes/ticket.routes');") ||
                              appContent.includes("const ticketRoutes = require('./routes/ticket.routes.js');");
  const usesTicketRoutes = appContent.includes("app.use('/tickets', ticketRoutes);");
  
  console.log('✅ app.js importa ticketRoutes:', includesTicketRoutes);
  console.log('✅ app.js usa ticketRoutes:', usesTicketRoutes);
}

console.log('\n🎯 Para enviar tickets por email ahora usa: POST /tickets/bookings/:id/send-email');