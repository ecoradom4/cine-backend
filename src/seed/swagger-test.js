const swaggerJsdoc = require('swagger-jsdoc');
const fs = require('fs');
const path = require('path');

console.log('🔧 Swagger Test con Rutas Corregidas\n');

// Configuración CORREGIDA
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Cine Connect API',
      version: '1.0.0',
      description: 'API para sistema de cine'
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Servidor local'
      }
    ]
  },
  apis: [
    './src/routes/*.js',      // RUTA CORREGIDA
    './src/routes/**/*.js'    // RUTA CORREGIDA
  ]
};

console.log('📁 Rutas configuradas en Swagger:');
options.apis.forEach(apiPath => {
  console.log(`   ${apiPath}`);
});

try {
  const spec = swaggerJsdoc(options);
  
  console.log('\n✅ Swagger generado exitosamente');
  console.log(`📊 Total de rutas detectadas: ${Object.keys(spec.paths || {}).length}`);
  
  const paths = Object.keys(spec.paths || {});
  if (paths.length > 0) {
    console.log('\n📋 Rutas detectadas:');
    paths.forEach(path => {
      const methods = Object.keys(spec.paths[path]);
      console.log(`   ${path}: ${methods.join(', ')}`);
    });
  } else {
    console.log('\n❌ Aún no se detectan rutas. Verificando archivos individualmente...');
    
    // Verificar cada archivo individualmente
    const routeFiles = [
      'auth.routes.js', 'movie.routes.js', 'room.routes.js',
      'showtime.routes.js', 'booking.routes.js', 'branch.routes.js',
      'seat.routes.js', 'ticket.routes.js'
    ];
    
    routeFiles.forEach(file => {
      const filePath = path.join(__dirname, '../src/routes', file);
      console.log(`\n🔍 Verificando: ${filePath}`);
      
      if (fs.existsSync(filePath)) {
        const singleOptions = {
          definition: options.definition,
          apis: [`./src/routes/${file}`]
        };
        
        try {
          const singleSpec = swaggerJsdoc(singleOptions);
          const singlePaths = Object.keys(singleSpec.paths || {});
          console.log(`   ✅ Procesado - Rutas: ${singlePaths.length}`);
          
          if (singlePaths.length === 0) {
            console.log(`   ⚠️  El archivo existe pero no genera rutas`);
            // Mostrar primeras líneas del archivo para debug
            const content = fs.readFileSync(filePath, 'utf8');
            const firstLines = content.split('\n').slice(0, 5).join('\n');
            console.log(`   📝 Primeras líneas:\n${firstLines}...`);
          }
        } catch (error) {
          console.log(`   ❌ Error procesando: ${error.message}`);
        }
      } else {
        console.log(`   ❌ Archivo no existe en esa ubicación`);
      }
    });
  }
  
  // Guardar spec para análisis
  fs.writeFileSync('./swagger-spec-corrected.json', JSON.stringify(spec, null, 2));
  console.log('\n💾 Spec guardado en: swagger-spec-corrected.json');
  
} catch (error) {
  console.error('❌ Error:', error.message);
}