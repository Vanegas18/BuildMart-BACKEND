📦 BuildMart Backend
Backend del proyecto BuildMart, desarrollado con Node.js, Express y MongoDB.

🛠️ Configuración Inicial

1. Clonar el Repositorio

  git clone https://github.com/Vanegas18/BuildMart-BACKEND

2. Crear el archivo .env

  En la raíz del proyecto, crea un archivo .env.
  Añade las siguientes variables de entorno:

  MONGO_CNN = "mongodb+srv://Juan:Vanegas123@clusterbuildmart.wppcg.mongodb.net/BuildMart"
  PORT = 3000

3. Instalar Dependencias
  npm install
  
4. Ejecutar el Proyecto
  npm run dev

🌿 Trabajo con Ramas en Git

1. Crear una Nueva Rama para tu Funcionalidad

  git checkout -b nombre-de-la-rama

2. Cambiar a la rama creada

  git branch nombre-de-la-rama

3. Desde este momento ya puedes desarrollar normalmente pero fijándote que estés en la rama creada, Realizar Cambios y Confirmarlos

  git add .
  git commit -m "Descripción de los cambios"

4. Subir la Rama al Repositorio

  git push origin nombre-de-la-rama

5. Crear un Pull Request (PR)

  Ve a GitHub y abre un Pull Request desde tu rama hacia main.

5. Fusión de Ramas

  Cuando el PR sea revisado, usa Aplastar y Fusionar para integrar los cambios en main.
  
🧩 Buenas Prácticas

Usa nombres descriptivos para las ramas (ej.: feature/login, fix/bug-navbar).

Realiza commits pequeños y descriptivos.

Revisa los PRs de tus compañeros antes de fusionar.
