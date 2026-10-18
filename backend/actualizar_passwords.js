const db = require('./src/config/db');
const bcrypt = require('bcryptjs');

async function actualizarPasswords() {
  try {
    const hashAdmin = bcrypt.hashSync('Admin123*', 10);
    const hashMesero = bcrypt.hashSync('Mesero123*', 10);
    const hashCocina = bcrypt.hashSync('Cocina123*', 10);

    // Actualizar contraseñas con hashes válidos
    await db.query(`UPDATE usuarios SET password_hash = $1 WHERE email = 'admin@restaurante.ec'`, [hashAdmin]);
    await db.query(`UPDATE usuarios SET password_hash = $1 WHERE email IN ('jperez@restaurante.ec', 'mloayza@restaurante.ec', 'cmora@restaurante.ec')`, [hashMesero]);
    await db.query(`UPDATE usuarios SET password_hash = $1 WHERE email IN ('cocina@restaurante.ec', 'rchuchuca@restaurante.ec')`, [hashCocina]);

    // Insertar también alias @restaurante.com por comodidad
    await db.query(`
      INSERT INTO usuarios (nombre, email, password_hash, id_rol, activo)
      VALUES 
        ('Administrador General', 'admin@restaurante.com', $1, 1, TRUE),
        ('Mesero de Turno', 'mesero@restaurante.com', $2, 2, TRUE),
        ('Jefe de Cocina', 'cocina@restaurante.com', $3, 3, TRUE)
      ON CONFLICT (email) DO UPDATE 
      SET password_hash = EXCLUDED.password_hash;
    `, [hashAdmin, hashMesero, hashCocina]);

    console.log('✅ Contraseñas actualizadas con éxito en PostgreSQL.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al actualizar contraseñas:', error);
    process.exit(1);
  }
}

actualizarPasswords();
