# 01 - MongoDB, Mongoose

Proyecto base para aprender a conectar una API hecha con **Express** a una base de datos **MongoDB** usando **Mongoose**. Tiene un CRUD de usuarios (crear, leer, actualizar y eliminar).

Este README está pensado como apunte de repaso: explica cada carpeta y cada archivo, qué hace y por qué está ahí.

---

## Índice

1. [Conceptos básicos](#1-conceptos-básicos)
2. [Estructura del proyecto](#2-estructura-del-proyecto)
3. [Cómo levantar el proyecto](#3-cómo-levantar-el-proyecto)
4. [Archivos de la raíz](#4-archivos-de-la-raíz)
   - [package.json](#packagejson)
   - [.gitignore](#gitignore)
   - [app.js](#appjs)
5. [src/config: la conexión a la base de datos](#5-srcconfig-la-conexión-a-la-base-de-datos)
6. [src/models: los modelos](#6-srcmodels-los-modelos)
7. [src/controllers: la lógica](#7-srccontrollers-la-lógica)
8. [src/routes: las rutas](#8-srcroutes-las-rutas)
9. [El recorrido completo de una petición](#9-el-recorrido-completo-de-una-petición)
10. [Cómo probar la API](#10-cómo-probar-la-api)
11. [Resumen para el parcial](#11-resumen-para-el-parcial)

---

## 1. Conceptos básicos

Antes de mirar el código, conviene tener claro qué es cada herramienta:

| Herramienta | ¿Qué es? | ¿Para qué la usamos? |
| ----------- | -------- | -------------------- |
| **Node.js** | Entorno para ejecutar JavaScript fuera del navegador. | Para correr el servidor. |
| **Express** | Librería de Node para crear servidores y APIs. | Para recibir peticiones (GET, POST, etc.) y responderlas. |
| **MongoDB** | Base de datos **NoSQL** que guarda la información en **documentos** (parecidos a objetos JSON) dentro de **colecciones**. | Para guardar los usuarios. |
| **Mongoose** | Librería que conecta Node con MongoDB. | Para conectarnos a la base, definir la forma de los datos (schemas) y hacer consultas fácilmente. |
| **MongoDB Compass** | Programa con interfaz gráfica para ver la base de datos. | Para revisar que los datos se guarden bien. |

### Vocabulario de MongoDB

- **Base de datos**: contiene colecciones. En este proyecto se llama `db-mongoose`.
- **Colección**: un grupo de documentos del mismo tipo. Sería el equivalente a una "tabla" en SQL. Acá tenemos la colección `users`.
- **Documento**: un registro individual, con formato tipo JSON. Sería el equivalente a una "fila" en SQL. Por ejemplo:

```json
{
  "_id": "6720f1c2a1b2c3d4e5f6a7b8",
  "username": "lauti",
  "email": "lauti@mail.com",
  "password": "123456"
}
```

- **`_id`**: identificador único que MongoDB le agrega automáticamente a cada documento. No hace falta crearlo nosotros.

---

## 2. Estructura del proyecto

```
01 - MongoDB, Mongoose
├── app.js                       → Punto de entrada: arranca el servidor
├── package.json                 → Datos del proyecto, scripts y dependencias
├── package-lock.json            → Versiones exactas instaladas (se genera solo)
├── .gitignore                   → Archivos que Git no tiene que subir
└── src
    ├── config
    │   └── database.js          → Conexión a MongoDB
    ├── models
    │   └── user.model.js        → Forma que tienen los usuarios en la base
    ├── controllers
    │   └── user.controller.js   → Qué se hace en cada petición (crear, buscar, etc.)
    └── routes
        └── user.routes.js       → Qué URL ejecuta cada controlador
```

### ¿Por qué se separa en carpetas?

Cada carpeta tiene **una sola responsabilidad**. Así el código queda ordenado y es fácil saber dónde buscar cada cosa:

- ¿Algo de la conexión a la base? → `config`
- ¿Cómo es un usuario? → `models`
- ¿Qué hace el servidor cuando le piden algo? → `controllers`
- ¿Qué URL hay que llamar? → `routes`

Una forma de acordarse: **la ruta recibe la petición, el controlador la resuelve y el modelo habla con la base de datos.**

---

## 3. Cómo levantar el proyecto

### Paso 1: instalar las dependencias

Dentro de la carpeta del proyecto:

```bash
npm install
```

Esto lee el `package.json` y crea la carpeta `node_modules` con todas las librerías.

### Paso 2: tener MongoDB corriendo

MongoDB tiene que estar ejecutándose en la computadora, en el puerto por defecto **27017**. Para comprobarlo, abrir MongoDB Compass y conectarse a:

```
mongodb://127.0.0.1:27017
```

Si Compass se conecta, MongoDB está andando.

### Paso 3: iniciar el servidor

```bash
npm run dev
```

Si todo salió bien, la consola muestra:

```
Conectado a la base de datos correctamente
Servidor listo en el puerto 3003
```

---

## 4. Archivos de la raíz

### package.json

Es la "ficha técnica" del proyecto. Lo más importante:

```json
{
  "name": "mongoose",
  "main": "app.js",
  "type": "module",
  "scripts": {
    "dev": "node --watch app.js"
  },
  "dependencies": {
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.6",
    "dotenv": "^18.0.8",
    "express": "^5.3.0",
    "mongoose": "^9.11.2"
  }
}
```

- **`"main": "app.js"`**: el archivo principal del proyecto.
- **`"type": "module"`**: permite usar `import` / `export` en lugar de `require` / `module.exports`. Por eso en todo el proyecto se escribe:

  ```js
  import express from "express";       // ✅ con "type": "module"
  const express = require("express");  // ❌ esto sería sin "type": "module"
  ```

  Ojo: con `"type": "module"`, al importar archivos propios **hay que poner la extensión `.js`**:

  ```js
  import { startDB } from "./src/config/database.js"; // ✅
  import { startDB } from "./src/config/database";    // ❌ da error
  ```

- **`"scripts"`**: comandos que se ejecutan con `npm run <nombre>`.
  - `npm run dev` ejecuta `node --watch app.js`. El `--watch` hace que el servidor **se reinicie solo** cada vez que guardamos un cambio.

- **`"dependencies"`**: las librerías que usa el proyecto.

  | Dependencia | Para qué sirve |
  | ----------- | -------------- |
  | `express` | Crear el servidor y las rutas. |
  | `mongoose` | Conectarse a MongoDB y trabajar con modelos. |
  | `cors` | Permitir que otras páginas (por ejemplo un frontend) le hagan peticiones a la API. |
  | `cookie-parser` | Leer las cookies que llegan en las peticiones. |
  | `dotenv` | Leer variables de entorno desde un archivo `.env`. |

### package-lock.json

Se genera solo al hacer `npm install`. Guarda las versiones exactas de cada librería instalada. **No se edita a mano.**

### .gitignore

Le dice a Git qué archivos **no** tiene que subir al repositorio:

```
node_modules/
.env.
```

- **`node_modules/`**: pesa muchísimo y se puede recrear con `npm install`, así que no se sube nunca.
- **`.env`**: guarda datos privados (contraseñas, claves, URLs de la base), por eso no se sube.

> ⚠️ En el archivo dice `.env.` (con un punto de más al final). Así como está, **no ignora** el archivo `.env`. Lo correcto sería `.env`.

### app.js

Es el **punto de entrada**: el archivo que se ejecuta primero y arranca todo.

```js
import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
import "dotenv/config";
import { startDB } from "./src/config/database.js";
import { userRouter } from "./src/routes/user.routes.js";

const app = express();
const PORT = process.env.PORT || 3003;

//middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors());

//rutas
app.use("/api", userRouter);

app.listen(PORT, async () => {
  await startDB();
  console.log(`Servidor listo en el puerto ${PORT}`);
});
```

Vamos por partes:

#### 1. Importaciones

Se traen las librerías y los archivos propios que se van a usar.

- `import "dotenv/config";` carga las variables del archivo `.env` (si existe) dentro de `process.env`.
- `startDB` es la función que conecta con la base de datos.
- `userRouter` son las rutas de usuarios.

#### 2. Crear la aplicación y el puerto

```js
const app = express();
const PORT = process.env.PORT || 3003;
```

- `app` es nuestro servidor.
- `PORT` usa el puerto definido en el `.env`. Si no hay ninguno, usa **3003**. El `||` significa "si lo de la izquierda no existe, usá lo de la derecha".

#### 3. Middlewares

Un **middleware** es una función que se ejecuta **antes** de llegar a la ruta. Prepara la petición.

```js
app.use(express.json());   // Permite leer el body en formato JSON (req.body)
app.use(cookieParser());   // Permite leer las cookies (req.cookies)
app.use(cors());           // Permite peticiones desde otros orígenes
```

> 💡 Sin `express.json()`, `req.body` llegaría como `undefined` y no podríamos crear usuarios. Es uno de los errores más comunes.

#### 4. Rutas

```js
app.use("/api", userRouter);
```

Conecta las rutas de usuarios con el prefijo `/api`. Entonces, si en el router hay una ruta `/users`, la URL final es:

```
http://localhost:3003/api/users
```

#### 5. Iniciar el servidor

```js
app.listen(PORT, async () => {
  await startDB();
  console.log(`Servidor listo en el puerto ${PORT}`);
});
```

- `app.listen` pone el servidor a escuchar en el puerto.
- Cuando arranca, ejecuta `startDB()` para conectarse a la base de datos.
- Se usa `async` / `await` porque conectarse a la base **tarda un poco** y hay que esperar a que termine.

---

## 5. src/config: la conexión a la base de datos

### database.js

```js
import mongoose from "mongoose";

export const startDB = async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/db-mongoose");

    // await mongoose.connection.dropCollection("users");
    // await mongoose.connection.dropDatabase();

    console.log("Conectado a la base de datos correctamente");
  } catch (error) {
    console.log("No se pudo conectar a la base de datos", error);
  }
};
```

#### ¿Qué hace?

Exporta la función `startDB`, que se encarga de **conectar el proyecto con MongoDB**. Se llama desde `app.js`.

#### La URL de conexión

```
mongodb://127.0.0.1:27017/db-mongoose
```

| Parte | Significado |
| ----- | ----------- |
| `mongodb://` | El protocolo, avisa que es una conexión a MongoDB. |
| `127.0.0.1` | La dirección de nuestra propia computadora (es lo mismo que `localhost`). |
| `27017` | El puerto donde corre MongoDB por defecto. |
| `db-mongoose` | El nombre de la base de datos. |

> 💡 **No hace falta crear la base de datos antes.** MongoDB la crea sola cuando se guarda el primer documento. Por eso, si recién arrancás el proyecto y no ves `db-mongoose` en Compass, es normal: aparece cuando crees el primer usuario.

#### try / catch

- **`try`**: intenta conectarse. Si sale bien, muestra el mensaje de éxito.
- **`catch`**: si algo falla (por ejemplo, MongoDB no está prendido), atrapa el error y lo muestra en vez de que el programa explote.

#### Las líneas comentadas

```js
// await mongoose.connection.dropCollection("users");
// await mongoose.connection.dropDatabase();
```

Sirven para **limpiar** la base mientras se practica:

- `dropCollection("users")` borra la colección `users` entera.
- `dropDatabase()` borra la base de datos completa.

Están comentadas a propósito: si se descomentan, **se borra todo cada vez que se reinicia el servidor** (y con `--watch` eso pasa cada vez que guardás un archivo). Usarlas solo cuando se quiera empezar de cero, y volver a comentarlas.

---

## 6. src/models: los modelos

### ¿Qué es un modelo?

Un **modelo** define **cómo tiene que ser** un documento dentro de una colección: qué campos tiene, de qué tipo es cada uno y qué reglas tiene que cumplir. Además, es el que nos da los métodos para trabajar con la base (`create`, `find`, `findById`, etc.).

Se hace en **dos pasos**:

1. Crear el **Schema** (el molde, la estructura).
2. Crear el **Model** a partir del schema (la herramienta para usar la colección).

### user.model.js

```js
import { model, Schema } from "mongoose";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    versionKey: false,
  },
);

export const UserModel = model("User", userSchema);
```

#### Paso 1: el Schema

```js
const userSchema = new Schema({ ...campos }, { ...opciones });
```

`new Schema()` recibe **dos objetos**:

1. **Los campos** del documento.
2. **Las opciones** del schema.

##### Los campos

Cada campo es un objeto con sus propiedades:

| Propiedad | Qué significa | Ejemplo |
| --------- | ------------- | ------- |
| `type` | El tipo de dato. | `String`, `Number`, `Boolean`, `Date` |
| `required: true` | El campo es **obligatorio**. Si falta, Mongoose no guarda el documento y tira error. | Un usuario sin email no se guarda. |
| `unique: true` | No puede haber **dos documentos con el mismo valor**. | No puede haber dos usuarios con el mismo email. |

En este modelo:

| Campo | Tipo | Obligatorio | Único |
| ----- | ---- | :---------: | :---: |
| `username` | String | ✅ | ✅ |
| `email` | String | ✅ | ✅ |
| `password` | String | ✅ | ❌ |

> 💡 La contraseña no es `unique` porque dos usuarios distintos sí pueden tener la misma contraseña.

##### Las opciones

```js
{
  versionKey: false,
}
```

Por defecto, Mongoose agrega a cada documento un campo `__v` (número de versión). Con `versionKey: false` le decimos que **no lo agregue**, así los documentos quedan más limpios.

#### Paso 2: el Model

```js
export const UserModel = model("User", userSchema);
```

`model()` recibe:

1. **El nombre del modelo**: `"User"`.
2. **El schema** que va a usar: `userSchema`.

> 💡 **Dato clave:** Mongoose toma el nombre del modelo, lo pasa a **minúscula** y a **plural** para nombrar la colección. Por eso `"User"` se guarda en la colección **`users`**. Si fuera `"Product"`, la colección sería `products`.

Se **exporta** (`export`) para poder usarlo en los controladores.

### Receta para hacer cualquier modelo

```js
import { model, Schema } from "mongoose";

const nombreSchema = new Schema(
  {
    campo1: { type: String, required: true },
    campo2: { type: Number },
  },
  { versionKey: false },
);

export const NombreModel = model("Nombre", nombreSchema);
```

1. Importar `model` y `Schema`.
2. Crear el schema con los campos y sus reglas.
3. Crear el modelo con `model("Nombre", schema)`.
4. Exportarlo.

---

## 7. src/controllers: la lógica

### ¿Qué es un controlador?

Es la función que se ejecuta cuando alguien llama a una ruta. Es **el que hace el trabajo**: recibe los datos, usa el modelo para hablar con la base de datos y devuelve una respuesta.

Todos los controladores tienen la misma forma:

```js
export const nombreControlador = async (req, res) => {
  try {
    // 1. Sacar los datos de la petición (req)
    // 2. Usar el modelo para hablar con la base
    // 3. Responder (res)
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: "Error interno del servidor",
    });
  }
};
```

### req y res

- **`req` (request)**: la **petición**, lo que nos manda el cliente.
- **`res` (response)**: la **respuesta**, lo que le devolvemos al cliente.

### ¿De dónde se sacan los datos?

| De dónde | Qué trae | Ejemplo |
| -------- | -------- | ------- |
| `req.body` | Los datos que vienen en el **cuerpo** de la petición (JSON). Se usa al crear o actualizar. | `{ "username": "lauti", "email": "...", "password": "..." }` |
| `req.params` | Los valores que vienen **en la URL**, en el lugar de los `:algo` de la ruta. | En `/api/users/6720f1c2...`, `req.params.id` es `6720f1c2...` |

### Códigos de estado (status)

| Código | Significado | Cuándo se usa acá |
| ------ | ----------- | ----------------- |
| **200** | OK, salió todo bien. | Al buscar o actualizar. |
| **201** | Creado. | Al crear un usuario. |
| **500** | Error interno del servidor. | En el `catch`, cuando algo falla. |

### ¿Por qué async / await?

Hablar con la base de datos **tarda**. Con `await` esperamos a que MongoDB responda antes de seguir. Para poder usar `await`, la función tiene que ser `async`.

### user.controller.js, función por función

Al principio del archivo se importa el modelo:

```js
import { UserModel } from "../models/user.model.js";
```

#### createUser: crear un usuario

```js
export const createUser = async (req, res) => {
  try {
    const { username, password, email } = req.body;

    const newUser = await UserModel.create({ username, email, password });

    return res.status(201).json({
      msg: "Usuario creado correctamente",
      data: newUser,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: "Error interno del servidor",
    });
  }
};
```

1. Saca `username`, `password` y `email` del **body** (esto se llama **desestructuración**).
2. `UserModel.create()` crea y guarda el documento en la base.
3. Responde con **201** y el usuario creado.

> 💡 Si falta un campo `required` o se repite un `username` / `email` (que son `unique`), `create` tira error y se va al `catch`.

#### getAllUsers: traer todos los usuarios

```js
export const getAllUsers = async (req, res) => {
  try {
    const users = await UserModel.find();

    return res.status(200).json({
      data: users,
    });
  } catch (error) { ... }
};
```

- `UserModel.find()` sin nada adentro trae **todos** los documentos de la colección.
- Devuelve un **array** (si no hay usuarios, un array vacío `[]`).

#### getUserById: traer un usuario por su id

```js
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const users = await UserModel.findById(id);

    return res.status(200).json({
      data: users,
    });
  } catch (error) { ... }
};
```

1. Saca el `id` de la **URL** (`req.params`).
2. `UserModel.findById(id)` busca el documento con ese `_id`.
3. Devuelve **un solo objeto** (o `null` si no existe ninguno con ese id).

#### updateUser: actualizar un usuario

```js
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username } = req.body;

    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      { username },
      { returnDocument: "after" },
    );

    return res.status(200).json({
      data: updatedUser,
    });
  } catch (error) { ... }
};
```

1. Saca el `id` de la URL y el nuevo `username` del body.
2. `findByIdAndUpdate()` recibe **tres cosas**:
   - el **id** del documento a modificar,
   - los **datos nuevos** (`{ username }`),
   - las **opciones**.
3. `{ returnDocument: "after" }` hace que devuelva el usuario **ya actualizado**. Sin esa opción, devolvería cómo estaba **antes** del cambio.

> 💡 En este controlador solo se actualiza el `username`.

#### deleteUser: eliminar un usuario

```js
export const deleteUser = async (req, res) => {
  try {
  } catch (error) { ... }
};
```

> ⚠️ **Está vacío todavía.** La ruta existe, pero no hace nada. Queda pendiente completarlo (sacar el `id` de `req.params`, eliminar el documento con el modelo y responder).

### Resumen de métodos del modelo

| Método | Qué hace | Devuelve |
| ------ | -------- | -------- |
| `Model.create(datos)` | Crea y guarda un documento. | El documento creado. |
| `Model.find()` | Trae todos los documentos. | Un array. |
| `Model.findById(id)` | Busca uno por su `_id`. | Un objeto o `null`. |
| `Model.findByIdAndUpdate(id, datos, opciones)` | Busca por `_id` y lo modifica. | El documento (antes o después, según la opción). |

---

## 8. src/routes: las rutas

### ¿Qué es una ruta?

Una ruta une **un método HTTP + una URL** con **un controlador**. Es decir: "cuando alguien haga *tal cosa* en *tal dirección*, ejecutá *tal función*".

### user.routes.js

```js
import { Router } from "express";
import {
  createUser,
  deleteUser,
  getAllUsers,
  getUserById,
  updateUser,
} from "../controllers/user.controller.js";

export const userRouter = Router();

// Ruta para crear un usuario
userRouter.post("/users", createUser);

// Ruta para traer todos los usuarios
userRouter.get("/users", getAllUsers);

// Ruta para traer un usuario por id
userRouter.get("/users/:id", getUserById);

// Ruta para actualizar un usuario
userRouter.put("/users/:id", updateUser);

// Ruta para eliminar un usuario
userRouter.delete("/users/:id", deleteUser);
```

1. Se importa `Router` de Express y todos los controladores.
2. `Router()` crea un "mini servidor" solo para las rutas de usuarios.
3. Se define cada ruta con la forma:

   ```js
   router.metodo("url", controlador);
   ```

4. Se exporta `userRouter` para conectarlo en `app.js`.

### Los métodos HTTP

| Método | Para qué se usa | Operación (CRUD) |
| ------ | --------------- | ---------------- |
| **POST** | Crear | **C**reate |
| **GET** | Leer / traer | **R**ead |
| **PUT** | Actualizar | **U**pdate |
| **DELETE** | Eliminar | **D**elete |

### ¿Qué es el `:id`?

Los dos puntos indican que esa parte de la URL es **variable**. Lo que se escriba ahí llega al controlador en `req.params.id`.

```
/users/:id   →   /users/6720f1c2a1b2c3d4e5f6a7b8
                        └──────── req.params.id ────────┘
```

### Tabla de rutas completas

Recordando que en `app.js` se agregó el prefijo `/api`:

| Método | URL completa | Controlador | Qué hace |
| ------ | ------------ | ----------- | -------- |
| POST | `http://localhost:3003/api/users` | `createUser` | Crea un usuario |
| GET | `http://localhost:3003/api/users` | `getAllUsers` | Trae todos los usuarios |
| GET | `http://localhost:3003/api/users/:id` | `getUserById` | Trae un usuario por id |
| PUT | `http://localhost:3003/api/users/:id` | `updateUser` | Actualiza el username |
| DELETE | `http://localhost:3003/api/users/:id` | `deleteUser` | (Pendiente) Elimina un usuario |

> 💡 Fijate que `POST /users` y `GET /users` tienen la **misma URL** pero hacen cosas distintas. Lo que las diferencia es el **método**.

---

## 9. El recorrido completo de una petición

Ejemplo: alguien quiere **crear un usuario**.

```
Cliente (Thunder Client / Postman / frontend)
   │
   │  POST http://localhost:3003/api/users
   │  Body: { "username": "lauti", "email": "lauti@mail.com", "password": "123456" }
   ▼
app.js
   │  1. express.json() convierte el body en un objeto → req.body
   │  2. app.use("/api", userRouter) → la URL empieza con /api, va al router
   ▼
routes/user.routes.js
   │  3. Es un POST a /users → ejecuta createUser
   ▼
controllers/user.controller.js
   │  4. Saca username, email y password de req.body
   │  5. Llama a UserModel.create(...)
   ▼
models/user.model.js
   │  6. Valida los datos con el schema (required, unique, type)
   │  7. Guarda el documento en la colección "users"
   ▼
MongoDB (db-mongoose → users)
   │
   ▼
Respuesta al cliente: 201 { msg: "Usuario creado correctamente", data: {...} }
```

En una línea: **app.js → routes → controllers → models → MongoDB → respuesta.**

---

## 10. Cómo probar la API

Con el servidor andando (`npm run dev`), se puede usar **Thunder Client** (extensión de VS Code) o **Postman**.

### Crear un usuario

- **Método:** POST
- **URL:** `http://localhost:3003/api/users`
- **Body (JSON):**

```json
{
  "username": "lauti",
  "email": "lauti@mail.com",
  "password": "123456"
}
```

### Traer todos los usuarios

- **Método:** GET
- **URL:** `http://localhost:3003/api/users`

### Traer un usuario por id

- **Método:** GET
- **URL:** `http://localhost:3003/api/users/<id>`

Reemplazar `<id>` por el `_id` de un usuario (se copia de la respuesta del GET anterior o desde Compass).

### Actualizar un usuario

- **Método:** PUT
- **URL:** `http://localhost:3003/api/users/<id>`
- **Body (JSON):**

```json
{
  "username": "lauti-nuevo"
}
```

### Verificar en Compass

Después de crear un usuario, en MongoDB Compass debería aparecer la base **`db-mongoose`** con la colección **`users`** y el documento adentro.

---

## 11. Resumen para el parcial

### Conectar la base de datos

```js
import mongoose from "mongoose";

export const startDB = async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/nombre-de-la-base");
    console.log("Conectado a la base de datos correctamente");
  } catch (error) {
    console.log("No se pudo conectar a la base de datos", error);
  }
};
```

Y en `app.js`:

```js
app.listen(PORT, async () => {
  await startDB();
  console.log(`Servidor listo en el puerto ${PORT}`);
});
```

### Crear un modelo

```js
import { model, Schema } from "mongoose";

const userSchema = new Schema(
  {
    username: { type: String, required: true, unique: true },
  },
  { versionKey: false },
);

export const UserModel = model("User", userSchema);
```

### Checklist rápido

- [ ] `"type": "module"` en el `package.json` para usar `import` / `export`.
- [ ] Poner `.js` al final de los imports de archivos propios.
- [ ] `app.use(express.json())` para poder leer `req.body`.
- [ ] MongoDB prendido antes de hacer `npm run dev`.
- [ ] La URL de conexión: `mongodb://127.0.0.1:27017/<nombre-base>`.
- [ ] Schema → Model → exportar.
- [ ] El nombre del modelo en singular (`"User"`) genera la colección en plural (`users`).
- [ ] `req.body` para datos del cuerpo, `req.params` para datos de la URL.
- [ ] Controladores con `async` / `await` y `try` / `catch`.
- [ ] Status: **201** al crear, **200** al leer/actualizar, **500** en el `catch`.
- [ ] `{ returnDocument: "after" }` para que el update devuelva el documento actualizado.

### Preguntas para autoevaluarse

1. ¿Cuál es la diferencia entre un **Schema** y un **Model**?
2. Si creo un modelo llamado `"Product"`, ¿cómo se llama la colección en MongoDB?
3. ¿Qué pasa si no pongo `app.use(express.json())`?
4. ¿Qué diferencia hay entre `req.body` y `req.params`?
5. ¿Para qué sirve `required: true`? ¿Y `unique: true`?
6. ¿Qué hace `versionKey: false`?
7. ¿Qué devuelve `findByIdAndUpdate` si no le paso `{ returnDocument: "after" }`?
8. ¿Por qué las funciones de los controladores son `async`?
9. ¿Qué significa cada parte de `mongodb://127.0.0.1:27017/db-mongoose`?
10. ¿Por qué las líneas de `dropCollection` y `dropDatabase` están comentadas?
