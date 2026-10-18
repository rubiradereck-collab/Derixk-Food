# Derixk Food - Sistema de Gestión de Restaurante

**Proyecto Integrador Interdisciplinario**  
* **Autor & Desarrollador:** Dereck Rubira  
* **Carrera:** Tecnologías de la Información — 5.º Nivel (Periodo 2026-2)  
* **Institución:** Universidad Técnica de Machala (UTMACH)  
* **Materias Integradas:** Tecnologías Web & Administración de Bases de Datos  

---

## 📌 Arquitectura del Sistema
```text
[ Cliente Web (Angular 22 SPA) ] 
              │
         HTTP / JSON (JWT Bearer Token)
              ▼
[ Servidor API REST (Node.js + Express + pg) ] 
              │
         Pool de Conexiones TCP (Puerto 5432)
              ▼
[ Motor de Base de Datos (PostgreSQL 16/18) ]
   ├── Tablas normalizadas (1FN, 2FN, 3FN) con constraints
   ├── Procedimientos Almacenados (sp_registrar_pedido, sp_cerrar_pedido)
   ├── Triggers (trg_descontar_stock, trg_auditar_precio, trg_validar_reserva)
   ├── Transacciones ACID y Bloqueos Pesimistas (SELECT ... FOR UPDATE)
   └── Vistas Analíticas (v_platos_mas_vendidos, v_ventas_por_mes)
```

---

## 🚀 Guía de Instalación y Ejecución "Desde Cero"

### 1. Base de Datos (PostgreSQL en pgAdmin 4)
1. Abrir **pgAdmin 4** y conectarse al servidor local.
2. Crear la base de datos `restaurante_db` (codificación UTF8).
3. Abrir **Query Tool** sobre `restaurante_db` y abrir el archivo:
   [`database/master_instalacion.sql`](file:///c:/Users/LENOVO/Documents/paginas%20proyectos/Proyecto%20TW/database/master_instalacion.sql).
4. Presionar **F5** para ejecutar. Se crearán tablas, roles, triggers, procedimientos, vistas y datos iniciales de gastronomía ecuatoriana.

### 2. Backend (Node.js + Express)
1. Abrir una terminal en `backend/`:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
2. El servidor iniciará en: `http://localhost:3000` con conexión validada a PostgreSQL.

### 3. Frontend (Angular SPA)
1. Abrir una segunda terminal en `frontend/`:
   ```bash
   cd frontend
   npm install
   npm start
   ```
2. La aplicación web iniciará en: `http://localhost:4200`.

---

## 👥 Credenciales de Prueba (Demostración Académica)

| Rol | Correo Electrónico | Contraseña | Permisos |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@restaurante.com` *(o `admin@restaurante.ec`)* | `Admin123*` | Control total: menú, precios, pedidos, analítica |
| **Mesero** | `mesero@restaurante.com` *(o `jperez@restaurante.ec`)* | `Mesero123*` | Catálogo, mesas, apertura de pedidos y reservas |
| **Cocina** | `cocina@restaurante.com` *(o `cocina@restaurante.ec`)* | `Cocina123*` | Monitor de cocina y cambio de fases de cocción |

---

## ⚙️ Límites Actuales y Mejoras Futuras
* **Límites:** Pasarela de pagos simulada en efectivo/caja física; fotos con fallback gráfico interactivo.
* **Mejoras Futuras:** Conexión de sockets en tiempo real (WebSockets / Socket.io) para notificaciones push automáticas a cocina y facturación electrónica autorizada por el SRI (Ecuador).
