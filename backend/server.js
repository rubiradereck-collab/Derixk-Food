// ============================================================================
// SERVIDOR PRINCIPAL BACKEND
// Archivo: server.js
// ============================================================================
require('dotenv').config();
const app = require('./src/app');
const db = require('./src/config/db');

const PORT = process.env.PORT || 3000;

// Verificar conectividad con PostgreSQL antes de levantar el servidor
db.query('SELECT NOW() AS hora_bd, current_database() AS nombre_bd')
  .then((res) => {
    console.log('================================================================');
    console.log('✅ Conexión exitosa a PostgreSQL:');
    console.log(`   - Base de datos: ${res.rows[0].nombre_bd}`);
    console.log(`   - Timestamp BD:  ${res.rows[0].hora_bd}`);
    console.log('================================================================');

    app.listen(PORT, () => {
      console.log(`🚀 Servidor Express escuchando en: http://localhost:${PORT}`);
      console.log(`📖 Documentación de endpoints en: http://localhost:${PORT}/`);
      console.log('================================================================');
    });
  })
  .catch((err) => {
    console.error('================================================================');
    console.error('❌ Error crítico al conectar con PostgreSQL:');
    console.error(`   ${err.message}`);
    console.error('   Verifique que el servicio de PostgreSQL esté iniciado y que');
    console.error('   las variables en el archivo backend/.env sean correctas.');
    console.error('================================================================');
    process.exit(1);
  });
