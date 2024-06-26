# Trabajo Fin Grado


Este repositorio contiene una demo del proyecto final de grado del alumno Carlos Quesada Pérez. Consiste en un proyecto en Docker Compose con dos servicios: la base de datos (utilizando la imagen oficial de MariaDB), inicializada con datos de demostración (en la carpeta `/database`), y la aplicación (utilizando una imagen propia) con dos usuarios por defecto.


La aplicación es una aplicación de gestión para la empresa Andres Quesada e Hijos S.A., desarrollada en Node.js.

## Instrucciones de Uso

Para lanzar el proyecto, primero se debe construir la imagen de la aplicación con el nombre `ansada-app`, y después lanzar Docker Compose. Las variables de entorno ya están definidas en el Docker Compose para la conexión de la aplicación y la base de datos.

**Construir imagen de la aplicación**

    docker build -t ansada-app .

**Lanzar Docker Compose**

    docker-compose up -d

Tras esto, acceder a http://localhost:3000 (o el puerto que se haya definido en Docker Compose) y entrar con las credenciales `admin` / `admin` para acceder como administrador o `usuario` / `passwd` para acceder como un usuario genérico.

**Nota:** Si se desea probar la funcionalidad de pruebas, acceder a la imagen corriendo de la aplicación de Node.js y desde el directorio donde se encuentra el `package.json` lanzar:

    # Para ejecutar pruebas unitarias
    npm run unit-test

    # Para ejecutar pruebas de sistema
    npm run system-test

## Autor

Carlos Quesada Pérez <br />
Grado en Ingeniería Informática, Curso 2023-24  <br />
Universidad de Granada <br />
