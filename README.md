# 📦 Sistema de Almacén

SPA (Single Page Application) con Node.js/Express + MySQL, desplegable en Vercel.

## Estructura del Proyecto

```
almacen/
├── api/
│   └── index.js          ← Servidor Express (backend)
├── public/
│   ├── index.html         ← SPA Frontend
│   ├── css/style.css
│   └── js/app.js
├── .env.example           ← Plantilla de variables de entorno
├── .gitignore
├── package.json
├── vercel.json            ← Config de Vercel
└── README.md
```

## Pasos para ejecutar localmente

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar y llenar .env
cp .env.example .env
# Editar .env con tus credenciales de BD

# 3. Iniciar servidor
npm run dev   # con nodemon (recarga automática)
# o
npm start

# 4. Abrir http://localhost:3000
```

## Base de datos en la nube (para Vercel)

XAMPP local no es accesible desde Vercel. Opciones gratuitas recomendadas:

| Servicio      | Free tier | Link |
|---------------|-----------|------|
| TiDB Cloud    | ✅ Sí      | https://tidbcloud.com |
| PlanetScale   | ✅ Sí      | https://planetscale.com |
| Clever Cloud  | ✅ Sí      | https://clever-cloud.com |
| Railway       | ✅ Sí      | https://railway.app |

### TiDB Cloud (recomendado) — pasos rápidos:
1. Crea cuenta en https://tidbcloud.com
2. Crea un cluster "Serverless" (gratis)
3. Ve a **Connect** → copia Host, User, Password
4. Llena tu `.env` con esos datos

## Despliegue en Vercel

```bash
# 1. Sube el código a GitHub (repo público o privado)

# 2. Ve a https://vercel.com → "New Project" → importa el repo

# 3. En "Environment Variables" agrega:
#    DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME

# 4. Deploy → obtendrás tu URL: https://tu-proyecto.vercel.app
```

## API Endpoints

| Método | Ruta                      | Descripción         |
|--------|---------------------------|---------------------|
| GET    | /api/conceptos            | Listar conceptos    |
| POST   | /api/conceptos            | Crear concepto      |
| PUT    | /api/conceptos/:id        | Editar concepto     |
| DELETE | /api/conceptos/:id        | Eliminar (soft)     |
| GET    | /api/destinos             | Listar destinos     |
| POST   | /api/destinos             | Crear destino       |
| ...    | (misma estructura para productos y unidades-medida) |
| GET    | /api/health               | Estado de la BD     |

## Catálogos implementados
- ✅ Conceptos
- ✅ Destinos
- ✅ Productos
- ✅ Unidades de Medida
- 🔜 Entradas (solo interfaz)
- 🔜 Salidas (solo interfaz)
