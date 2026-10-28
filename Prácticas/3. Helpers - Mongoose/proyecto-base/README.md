# 🔐 Autenticación y autorización con Mongoose

Curso para el parcial de **Base de Datos II**: register, login, cookies, JWT, helpers, `authMiddleware`, `adminMiddleware` y `ownerMiddleware`, todo con **MongoDB + Mongoose**.

Está armado con el material de la materia (los PDFs de *Autenticación y autorización con JWT, sesiones y cookies*, *MongoDB y Mongoose* y *Express Validator*) y con el estilo de tu repo `mongoose-lautaro-villalba`, así que el código se escribe igual que lo venís escribiendo: `userModel`, `matchedData`, `validator`, `isActive`, `{ msg, data }`.

> Todo el código de este README está **probado**: la carpeta `solucion/` pasa las 58 pruebas automáticas, y los "errores típicos" del final los provoqué a propósito para ver qué pasa.

---

## 📚 Índice

- [Cómo usar este material](#-cómo-usar-este-material)
- [Lección 0 · El mapa general](#lección-0--el-mapa-general)
- [Lección 1 · Middlewares y `next()`](#lección-1--middlewares-y-next)
- [Lección 2 · Hash, bcrypt y el helper de contraseñas](#lección-2--hash-bcrypt-y-el-helper-de-contraseñas)
- [Lección 3 · JWT y el helper de tokens](#lección-3--jwt-y-el-helper-de-tokens)
- [Lección 4 · Cookies](#lección-4--cookies)
- [Lección 5 · El modelo User en Mongoose](#lección-5--el-modelo-user-en-mongoose)
- [Lección 6 · Register paso a paso](#lección-6--register-paso-a-paso)
- [Lección 7 · Login paso a paso](#lección-7--login-paso-a-paso)
- [Lección 8 · `authMiddleware`](#lección-8--authmiddleware)
- [Lección 9 · Rutas protegidas: profile y logout](#lección-9--rutas-protegidas-profile-y-logout)
- [Lección 10 · `adminMiddleware`](#lección-10--adminmiddleware)
- [Lección 11 · `ownerMiddleware`](#lección-11--ownermiddleware)
- [Lección 12 · Códigos HTTP](#lección-12--códigos-http)
- [Lección 13 · De tu TP (Sequelize) a Mongoose](#lección-13--de-tu-tp-sequelize-a-mongoose)
- [Lección 14 · Errores típicos](#lección-14--errores-típicos-todos-probados)
- [Lección 15 · Extra: hashear con `pre('save')`](#lección-15--extra-hashear-con-presave)
- [🧾 Machete final](#-machete-final)

---

## 🧭 Cómo usar este material

```
curso-auth-mongoose/
├── README.md              ← esto: la teoría, lección por lección
├── actividades/           ← los ejercicios, en orden
│   ├── 00-preparacion.md
│   ├── 01-helpers.md
│   ├── 02-register.md
│   ├── 03-login.md
│   ├── 04-auth-middleware.md
│   ├── 05-admin.md
│   ├── 06-owner.md
│   └── 07-simulacro-parcial.md
├── proyecto-base/         ← donde VOS escribís el código
└── solucion/              ← el proyecto terminado, para comparar
```

El ciclo de cada tema es:

1. **Leé la lección** del README.
2. **Hacé la actividad** en `proyecto-base/` (sin mirar la solución 🙈).
3. **Probalo** con Postman y con el script automático: `node pruebas/probar-api.js <número de actividad>`.
4. Si algo da ❌, leé el mensaje, buscá en la [Lección 14](#lección-14--errores-típicos-todos-probados) y recién ahí compará con `solucion/`.

Para levantar cualquiera de los dos proyectos: `npm install`, copiar `.env.example` a `.env` y `npm run dev`. Los detalles están en `actividades/00-preparacion.md`.

| Lección del README | Actividad |
|---|---|
| 0 y 1 | `00-preparacion.md` |
| 2 y 3 | `01-helpers.md` |
| 5 y 6 | `02-register.md` |
| 4 y 7 | `03-login.md` |
| 8 y 9 | `04-auth-middleware.md` |
| 10 | `05-admin.md` |
| 11 | `06-owner.md` |
| Todo | `07-simulacro-parcial.md` |

---

## Lección 0 · El mapa general

### Autenticación vs autorización

Son las dos palabras que más te van a preguntar, y el material las define así:

| | Pregunta que responde | En nuestro código |
|---|---|---|
| **Autenticación** | **¿Quién sos?** El sistema verifica tu identidad con credenciales (usuario y contraseña) | `register`, `login`, el token, `authMiddleware` |
| **Autorización** | **¿Qué podés hacer?** Decide a qué recursos o acciones podés acceder ya estando identificado | `adminMiddleware`, `ownerMiddleware` |

Primero siempre va la autenticación: no se puede decidir qué podés hacer sin saber quién sos.

### La analogía del boliche 🕺

| En el boliche | En el código |
|---|---|
| Anotarte en la lista | **Register**: se guarda tu usuario con la contraseña hasheada |
| Mostrar el DNI en la puerta y que te pongan la pulserita | **Login**: se verifica la contraseña y te dan un **token** guardado en una **cookie** |
| El patovica que mira la pulserita en cada puerta | **`authMiddleware`**: revisa el token en cada pedido |
| La zona VIP | **`adminMiddleware`**: solo pasan los que tienen `role: "admin"` |
| "Esa mesa es tuya, nadie más se sienta" | **`ownerMiddleware`**: solo el dueño de un recurso (o un admin) lo puede tocar |
| Irte y que te saquen la pulsera | **Logout**: se borra la cookie |

### El recorrido completo

```
 CLIENTE (Postman / navegador)                         SERVIDOR (Express + Mongoose)
 ─────────────────────────────                         ─────────────────────────────

 POST /api/auth/register
 { username, email, password, ... }   ───────────▶    valida los datos
                                                       hashea la contraseña (bcrypt)
                                                       guarda el usuario en Mongo
                              ◀───────────  201 "Usuario registrado"

 POST /api/auth/login
 { username, password }               ───────────▶    busca el usuario en Mongo
                                                       compara la contraseña (bcrypt)
                                                       genera el token (JWT)
                              ◀───────────  200 + Set-Cookie: token=eyJ...; HttpOnly

 GET /api/auth/profile
 (la cookie viaja sola)               ───────────▶    authMiddleware verifica el token
 Cookie: token=eyJ...                                  req.user = { id, role }
                                                       el controller busca TU perfil
                              ◀───────────  200 { data: perfil }

 POST /api/auth/logout                ───────────▶    borra la cookie
                              ◀───────────  200 + Set-Cookie: token=; Expires=1970
```

---

## Lección 1 · Middlewares y `next()`

El PDF de Express Validator lo define así: un **middleware** es una función que se ejecuta durante el recorrido de una petición HTTP, **antes** de que llegue al controlador. Sirven para validar datos, verificar autenticación, comprobar permisos, registrar peticiones y manejar errores.

```js
const middleware = (req, res, next) => {
  next();
};
```

| Parámetro | Qué es |
|---|---|
| `req` | La **petición**: lo que manda el cliente (`req.body`, `req.params`, `req.cookies`) |
| `res` | La **respuesta**: lo que le devolvés (`res.status(200).json(...)`) |
| `next` | El **"pasá"**: llama al siguiente middleware o al controller |

Cada middleware tiene **dos opciones**:

```js
return res.status(401).json({ msg: "No autenticado" });
```

Corta todo y responde. Los que vienen atrás **nunca se ejecutan**.

```js
next();
```

Deja pasar al siguiente de la fila.

> ⚠️ El `return` antes de `res` importa. Si respondés sin `return` y el código sigue hasta un `next()`, Express intenta responder dos veces y tira `ERR_HTTP_HEADERS_SENT: Cannot set headers after they are sent to the client`.

### El orden en la ruta es el orden de ejecución

```js
userRouter.delete(
  "/users/:id",
  authMiddleware,
  adminMiddleware,
  userIdValidation,
  validator,
  deleteUser,
);
```

Express los ejecuta **de izquierda a derecha** (o de arriba a abajo):

1. `authMiddleware` → ¿tenés un token válido? Si no: **401**.
2. `adminMiddleware` → ¿sos admin? Si no: **403**.
3. `userIdValidation` → revisa que el `:id` sea un ObjectId (no corta, solo anota errores).
4. `validator` → si hubo errores de validación: **400**.
5. `deleteUser` → recién acá se borra.

Como `adminMiddleware` usa `req.user` (que lo crea `authMiddleware`), **auth siempre va primero**.

### Cómo llegan los datos de un middleware al siguiente

Todos los middlewares de una ruta comparten el **mismo** objeto `req`. Si uno le agrega una propiedad, los siguientes la ven:

```js
req.user = decoded;
```

Eso es lo que hace `authMiddleware`: deja escrito en `req.user` quién es el usuario, y `adminMiddleware`, `ownerMiddleware` y los controllers lo leen.

---

## Lección 2 · Hash, bcrypt y el helper de contraseñas

### El problema

Nunca se guarda la contraseña en texto plano. Si alguien accede a la base, tendría todas las contraseñas de todos los usuarios. Por eso se guarda un **hash**.

### Hash vs encriptación vs codificación

Esta tabla sale del material y es pregunta segura de parcial:

| | ¿Se puede volver atrás? | ¿Necesita clave? | ¿Para qué se usa? | Ejemplos |
|---|---|---|---|---|
| **Hash** | ❌ No, es **unidireccional** | No | **Contraseñas** | bcrypt, SHA-256, Argon2 |
| **Encriptación** | ✅ Sí, con la clave correcta | Sí | Proteger datos que necesitás recuperar | AES, RSA |
| **Codificación** | ✅ Sí, cualquiera puede | No | Transformar datos a un formato estándar | Base64, URL encoding, UTF-8 |

Pensalo como una picadora de carne 🥩: entra `"lauti1234"` y sale `$2b$10$G153B6g8zEwwkyA2GN2Fy...`. De la carne picada no volvés a armar el bife.

### ¿Qué es bcrypt?

Un algoritmo de hasheo pensado para contraseñas que:

- **Incluye salt automáticamente.** Le agrega un pedacito aleatorio a cada contraseña antes de hashearla, así dos usuarios con la misma contraseña tienen hashes **distintos**. Eso evita los ataques con *rainbow tables* (tablas de hashes precalculados).
- **Es lento a propósito.** Así un atacante no puede probar millones de contraseñas por segundo (fuerza bruta).
- **Tiene un costo ajustable** con `saltRounds`.

Esto es lo que da el script de prueba de la Actividad 1 con la misma contraseña dos veces:

```
Hash 1 de 'lauti1234': $2b$10$G153B6g8zEwwkyA2GN2Fy.9AHmjFuyPVhR.T0o8Bp6Gfg0vhmFIQu
Hash 2 de 'lauti1234': $2b$10$LlbM4E1RntvNbF83P9lrdeIKWH5uELI6B0aUlpKBoTEfPrv5l12ZS
```

Cómo se lee un hash de bcrypt:

```
$2b$  10$  G153B6g8zEwwkyA2GN2Fy.  9AHmjFuyPVhR.T0o8Bp6Gfg0vhmFIQu
 │     │   └──── salt (22) ────┘  └──────── el hash (31) ──────┘
 │     └── saltRounds
 └── versión del algoritmo
```

La **sal viaja adentro del hash**. Eso es lo que le permite a `compare` funcionar.

### `saltRounds`: el factor de costo

| `saltRounds` | Según el material |
|---|---|
| 8 | Rápido, menos seguro |
| **10** | **Balanceado (recomendado)** |
| 12 | Muy seguro, más lento |
| 15 | Extremadamente seguro, muy lento |

Cada +1 **duplica** el trabajo. El material recomienda entre 10 y 12.

### El helper: `src/helpers/bcrypt.helper.js`

```js
import bcrypt from "bcrypt";

export const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};
```

| Línea | Qué hace |
|---|---|
| `bcrypt.hash(password, saltRounds)` | Genera una sal nueva, pica la contraseña y devuelve el hash. Tarda, por eso es `async` y va con `await` |
| `bcrypt.compare(password, hashedPassword)` | Saca la sal del hash guardado, pica con esa misma sal lo que escribió el usuario y se fija si da igual. Devuelve `true` o `false` |

**¿Por qué `compare` y no `hashPassword(lo que escribió) === hash guardado`?** Porque cada `hash` usa una sal nueva: el `===` daría `false` siempre, aunque la contraseña sea correcta.

**¿Dónde se usa cada una?**

- `hashPassword` → en el **register**, antes de guardar.
- `comparePassword` → en el **login**, para ver si la contraseña es correcta.

### `bcrypt` vs `bcryptjs`

| `bcrypt` | `bcryptjs` |
|---|---|
| Escrito en C/C++ | JavaScript puro |
| Más rápido | Un poco más lento, más portable |
| Puede necesitar compilación nativa | No necesita compilar nada |

Tienen **la misma API**. Si `npm install bcrypt` te falla (pasa a veces en Windows), instalá la otra y cambiá solo el import:

```bash
npm install bcryptjs
```

```js
import bcrypt from "bcryptjs";
```

El resto del helper queda igual (lo probé con las dos).

---

## Lección 3 · JWT y el helper de tokens

### ¿Qué es un JWT?

**JSON Web Token** es un estándar abierto (RFC 7519) para transmitir información entre dos partes como un objeto JSON. Se puede **verificar** y confiar en él porque está **firmado digitalmente**.

Es la **pulserita** del boliche: después del login, en vez de mandar usuario y contraseña en cada pedido, mandás el token.

### Estructura: tres partes separadas por puntos

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0ZjEyMzQ1Njc4OTBhYmNkZWYxMjM0NSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzkzMTk2MTA4LCJleHAiOjE3OTMxOTk3MDh9.Hezcl4T7uNx0mQbsSmrbUK5e4oOOWBL8svGKmT82ctg
└────────── HEADER ───────────────┘ └─────────────────────────────── PAYLOAD ──────────────────────────────────────────────────┘ └──────────── SIGNATURE ────────────────┘
```

| Parte | Qué tiene | Decodificada |
|---|---|---|
| **Header** | El algoritmo de firma y el tipo | `{"alg":"HS256","typ":"JWT"}` |
| **Payload** | Los datos que vos ponés + `iat` y `exp` | `{"id":"64f1...","role":"user","iat":1793196108,"exp":1793199708}` |
| **Signature** | La firma: `HMACSHA256(header + "." + payload, JWT_SECRET)` | (no se "decodifica", se verifica) |

- `iat` (*issued at*) = cuándo se creó.
- `exp` (*expiration*) = cuándo vence. Con `expiresIn: "1h"` queda `exp = iat + 3600`.

### ⚠️ El payload NO es secreto

El header y el payload están en **Base64**, o sea **codificados**, no encriptados (volvé a la tabla de la Lección 2). Cualquiera que tenga el token puede leerlos. Por eso:

- ✅ En el payload van datos que identifican: `id`, `role`.
- ❌ **Nunca** la contraseña ni datos sensibles.

### Entonces, ¿por qué no puedo editar el payload y ponerme `role: "admin"`?

Por la **firma**. La firma se calcula con el header, el payload y el **`JWT_SECRET`**, que solo conoce el servidor. Si cambiás una letra del payload, la firma ya no coincide y `verify` lo rechaza. El script de la Actividad 1 hace exactamente esa trampa:

```
=== INTENTO DE TRAMPA: cambiar el role a 'admin' en el payload ===

verifyToken dijo: Error verificando el token: invalid signature
✅ verifyToken RECHAZA el token modificado (la firma ya no coincide)
```

Para falsificar un token habría que conocer el `JWT_SECRET`. Por eso va en el `.env` y nunca se sube a GitHub.

### Instalación y `.env`

```bash
npm install jsonwebtoken
```

```
JWT_SECRET=mi_clave_jwt_super_secreta_2024
```

### El helper: `src/helpers/jwt.helper.js`

Es el mismo del material:

```js
import jwt from "jsonwebtoken";

export const generateToken = (payload) => {
  try {
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
  } catch (error) {
    throw new Error("Error generando el token: " + error.message);
  }
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error("Error verificando el token: " + error.message);
  }
};
```

| Función | Recibe | Devuelve | Si algo sale mal |
|---|---|---|---|
| `generateToken(payload)` | Un objeto con los datos (`{ id, role }`) | El token (string) | Tira error |
| `verifyToken(token)` | El token | El payload decodificado (`{ id, role, iat, exp }`) | Tira error |

Los errores que puede tirar `jwt.verify` (los probé):

| Situación | Mensaje |
|---|---|
| El token venció | `jwt expired` |
| Alguien modificó el payload | `invalid signature` |
| Se firmó con otro secret | `invalid signature` |
| Cualquier cosa inventada | `invalid token` |

Y si te olvidás el `JWT_SECRET` en el `.env`, `jwt.sign` tira `secretOrPrivateKey must have a value`.

**¿Por qué los helpers tiran el error en vez de responder?** Porque un helper **no sabe nada de `req` ni `res`**: es una función reutilizable que hace una sola cosa. El que decide qué responder (401, 500) es el middleware o el controller que lo usa.

> 💡 Los helpers **no tocan la base de datos**. Por eso son idénticos en Sequelize y en Mongoose: los de tu TP sirven tal cual.

---

## Lección 4 · Cookies

### ¿Qué es una cookie?

Un pequeño archivo de texto que el **servidor** le manda al navegador, y que el navegador guarda y **reenvía automáticamente** en los pedidos siguientes a ese mismo servidor. Es el bolsillo donde viaja la pulserita.

### Los atributos importantes

| Atributo | Qué hace | Lo que protege |
|---|---|---|
| **HttpOnly** | JavaScript del navegador **no puede leer** la cookie | Ataques XSS (si alguien inyecta JS en la página, no puede robar el token) |
| **Secure** | Solo se manda por **HTTPS** | Que el token viaje en texto plano. En desarrollo va `false` porque `localhost` no tiene HTTPS |
| **SameSite** | Controla si la cookie se manda en pedidos desde otros sitios (`"strict"`, `"lax"`, `"none"`) | Ataques CSRF |
| **MaxAge / Expires** | Cuándo vence la cookie | Que quede para siempre |

### Mandar la cookie: `res.cookie()`

```js
res.cookie("token", token, {
  httpOnly: true,
  maxAge: 1000 * 60 * 60,
});
```

- `"token"` es el **nombre** de la cookie; después la leés con ese mismo nombre.
- `maxAge` en Express va en **milisegundos**: `1000 * 60 * 60` = 3.600.000 ms = **1 hora**, igual que el token.

Lo que viaja de verdad en la respuesta del login es este header (lo saqué de la prueba):

```
Set-Cookie: token=eyJhbG...; Max-Age=3600; Path=/; Expires=Wed, 28 Oct 2026 15:03:19 GMT; HttpOnly
```

(En el header, `Max-Age` está en **segundos**; Express hace la cuenta por vos.)

Las otras opciones que muestra el material:

```js
res.cookie("token", token, {
  httpOnly: true,
  secure: false,
  sameSite: "strict",
  maxAge: 3600000,
  path: "/",
  domain: ".mi-app.com",
});
```

### Leer la cookie: `cookie-parser`

```bash
npm install cookie-parser
```

```js
import cookieParser from "cookie-parser";

app.use(cookieParser());
```

El navegador manda las cookies en un header `Cookie: token=eyJ...`. `cookie-parser` lee ese header y arma el objeto **`req.cookies`**, así podés hacer `req.cookies["token"]`.

> ⚠️ **Sin `app.use(cookieParser())`, `req.cookies` es `undefined`.** En nuestro `authMiddleware` eso cae en el `catch` y responde **"Token inválido o expirado"**, aunque te hayas logueado bien. Es un mensaje engañoso: si te pasa, lo primero que revisás es esto.

### CORS con credenciales (cuando hay un frontend)

Si el frontend (por ejemplo React en `localhost:5173`) está en otro puerto, el material indica:

```js
import cors from "cors";

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
```

`credentials: true` es **crucial**: sin eso, el navegador no acepta ni manda cookies entre puertos distintos. Del lado del frontend, cada `fetch` lleva `credentials: "include"`.

### Borrar la cookie: `res.clearCookie()`

```js
res.clearCookie("token");
```

Manda la misma cookie vacía y vencida en 1970, y el navegador la descarta:

```
Set-Cookie: token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT
```

### ¿Y en Postman?

Postman guarda la cookie que le manda el login y la manda sola en los siguientes pedidos a `localhost` (la ves en la pestaña **Cookies** de la respuesta). Si tu cliente no lo hace, copiá el valor del token y agregá a mano un header `Cookie: token=eyJ...`.

---

## Lección 5 · El modelo User en Mongoose

### `src/models/user.model.js`

```js
import { Schema, model } from "mongoose";

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
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    profile: {
      first_name: {
        type: String,
        required: true,
      },
      last_name: {
        type: String,
        required: true,
      },
      biography: {
        type: String,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

export const userModel = model("User", userSchema);
```

| Campo | Por qué así |
|---|---|
| `username`, `email` con `unique: true` | No puede haber dos usuarios con el mismo |
| `password` | Acá se guarda el **hash**, nunca la contraseña real |
| `role` con `enum` y `default: "user"` | Solo acepta esos valores; si no se manda, todos arrancan como `user` |
| `profile` **embebido** | Ver abajo |
| `isActive` | Borrado lógico, igual que en tu repo |
| `timestamps: true` | Mongoose agrega `createdAt` y `updatedAt` |

El modelo se llama `"User"`, entonces Mongoose guarda los documentos en la colección **`users`** (en minúscula y plural). Es la que vas a ver en Compass.

### ¿Por qué el perfil va embebido?

El material dice que los documentos embebidos se usan cuando los datos **pertenecen exclusivamente al documento padre**, **siempre se consultan juntos** y el subdocumento **es chico y no crece**. El perfil de un usuario cumple las tres, y de hecho el ejemplo del PDF es *"Usuario con perfil embebido"*.

En tu TP de Sequelize el perfil era otra tabla que se creaba en el register. En Mongo no hace falta: queda adentro del mismo documento:

```json
{
  "_id": "6ae1ff07f81c7d7044c34b81",
  "username": "lauti",
  "email": "lauti@mail.com",
  "password": "$2b$10$G153B6g8zEwwkyA2GN2Fy...",
  "role": "user",
  "profile": {
    "first_name": "Lautaro",
    "last_name": "Villalba",
    "biography": "Estudiante"
  },
  "isActive": true
}
```

**¿Y si en el parcial te piden el perfil en otra colección?** Se hace como el `studentProfile` de tu repo: un modelo aparte con una referencia `user: { type: Types.ObjectId, ref: "User", required: true, unique: true }`, y en el register se crean los dos:

```js
const newUser = await userModel.create({
  username,
  email,
  password: hashedPassword,
});

await profileModel.create({
  user: newUser._id,
  first_name,
  last_name,
  biography,
});
```

### `unique` no es una validación

`unique: true` crea un **índice** en Mongo. Si intentás guardar un username repetido, Mongo tira un error `E11000 duplicate key` (código `11000`) y, si no lo manejaste, tu API responde **500**. Por eso igual se valida antes con `custom()` (Lección 6), para responder un **400** con un mensaje claro.

---

## Lección 6 · Register paso a paso

```
POST /api/auth/register
        │
        ▼
 registerValidation  →  validator  →  register (controller)
 (express-validator)    (¿errores?    1. matchedData
                         → 400)       2. hashear la contraseña
                                      3. userModel.create
                                      4. 201
```

### Las validaciones: `src/middlewares/validations/auth.validation.js`

```js
import { body } from "express-validator";
import { userModel } from "../../models/user.model.js";

export const registerValidation = [
  body("username")
    .notEmpty()
    .withMessage("username no puede estar vacío")
    .isLength({ min: 3, max: 20 })
    .withMessage("username debe tener de 3 a 20 caracteres")
    .bail()
    .custom(async (username) => {
      const user = await userModel.findOne({ username });
      if (user) {
        throw new Error("Ese username ya está en uso");
      }
      return true;
    }),
  body("email")
    .notEmpty()
    .withMessage("email no puede estar vacío")
    .isEmail()
    .withMessage("email debe tener el formato apropiado")
    .bail()
    .custom(async (email) => {
      const user = await userModel.findOne({ email });
      if (user) {
        throw new Error("Ese email ya está en uso");
      }
      return true;
    }),
  body("password")
    .notEmpty()
    .withMessage("password no puede estar vacío")
    .isLength({ min: 8 })
    .withMessage("password debe tener al menos 8 caracteres"),
  body("first_name")
    .notEmpty()
    .withMessage("first_name no puede estar vacío")
    .isLength({ min: 2, max: 50 })
    .withMessage("first_name debe tener de 2 a 50 caracteres"),
  body("last_name")
    .notEmpty()
    .withMessage("last_name no puede estar vacío")
    .isLength({ min: 2, max: 50 })
    .withMessage("last_name debe tener de 2 a 50 caracteres"),
  body("biography")
    .optional()
    .isString()
    .withMessage("biography debe ser texto")
    .isLength({ max: 300 })
    .withMessage("biography debe tener hasta 300 caracteres"),
];
```

- El `custom()` con `findOne({ email })` es **el mismo ejemplo del PDF** de Express Validator ("Validar que un email no esté ya registrado"). Ese PDF ya lo escribía en sintaxis de Mongoose.
- **`.bail()`** significa "si algo de lo anterior falló, cortá acá". Así no se hace la consulta a la base si el username ya vino vacío o mal. Lo usaste en tu repo en `addStudentToCourseValidation`.
- El `findOne` del `custom` **no filtra por `isActive`**: el índice `unique` incluye a los dados de baja, así que también hay que considerarlos.

El middleware `validator` es el mismo de tu repo:

```js
import { validationResult } from "express-validator";

export const validator = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ msg: "Error de validación", errors: errors.array() });
  }

  next();
};
```

### El controller: `register`

```js
import { matchedData } from "express-validator";
import { userModel } from "../models/user.model.js";
import { comparePassword, hashPassword } from "../helpers/bcrypt.helper.js";
import { generateToken } from "../helpers/jwt.helper.js";

export const register = async (req, res) => {
  try {
    const { username, email, password, first_name, last_name, biography } =
      matchedData(req);

    const hashedPassword = await hashPassword(password);

    await userModel.create({
      username,
      email,
      password: hashedPassword,
      profile: {
        first_name,
        last_name,
        biography,
      },
    });

    return res.status(201).json({ msg: "Usuario registrado correctamente" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Error interno del servidor" });
  }
};
```

1. **`matchedData(req)`** trae solo los campos que pasaron por la validación.
2. **`hashPassword(password)`** con `await`, **antes** de guardar.
3. **`userModel.create`** guarda el hash en `password`, nunca la original.
4. Responde **201** (creado) y **sin devolver el usuario** para no mandar el hash.

### ¿Por qué `matchedData` y no `req.body`?

Es el ejemplo del `maliciousField` del PDF. Si alguien manda esto al register:

```json
{
  "username": "vivo",
  "email": "vivo@mail.com",
  "password": "clave1234",
  "first_name": "Vivo",
  "last_name": "Pícaro",
  "role": "admin"
}
```

`role` **no está validado**, entonces `matchedData` lo filtra y el usuario queda como `user`. Si en vez de eso hicieras `userModel.create({ ...req.body, ... })`, cualquiera se registraría como admin (lo probé: con `...req.body` queda `role: "admin"`).

### ¿Y cómo creo un admin?

Registrás un usuario normal y le cambiás el campo `role` a `"admin"` en **MongoDB Compass** (abrís la colección `users`, editás el documento, guardás). Después **te volvés a loguear** para que el token nuevo traiga el rol nuevo (Lección 10).

> Si la consigna del parcial pide que el register acepte `role`, se agrega `body("role").optional().isIn(["user", "admin"])` a la validación y `role` al `create`. Pero sabé que así cualquiera puede registrarse como admin (en tu TP de Sequelize lo tenías así "para poder crear un admin de prueba").

---

## Lección 7 · Login paso a paso

```
POST /api/auth/login  { username, password }
        │
        ▼
 loginValidation → validator → login (controller)
                               1. buscar el usuario         ─ no existe ──────▶ 401
                               2. comparar la contraseña    ─ no coincide ────▶ 401
                               3. generar el token { id, role }
                               4. mandarlo en una cookie
                               5. 200
```

### La validación

```js
export const loginValidation = [
  body("username").notEmpty().withMessage("username no puede estar vacío"),
  body("password").notEmpty().withMessage("password no puede estar vacío"),
];
```

En el login no se valida largo ni formato: solo que lleguen. Si la contraseña es incorrecta, eso lo decide `comparePassword`.

### El controller

```js
export const login = async (req, res) => {
  try {
    const { username, password } = matchedData(req);

    const user = await userModel.findOne({ username, isActive: true });

    if (!user) {
      return res.status(401).json({ msg: "Credenciales inválidas" });
    }

    const validPassword = await comparePassword(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ msg: "Credenciales inválidas" });
    }

    const token = generateToken({
      id: user._id,
      role: user.role,
    });

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60,
    });

    return res.status(200).json({ msg: "Login exitoso" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Error interno del servidor" });
  }
};
```

### Los detalles que importan

**1. Se busca solo por `username`, no por `username` y `password`.** En el primer ejemplo del PDF se hacía `findOne({ where: { username, password } })`, pero eso solo funciona con contraseñas en texto plano. Con bcrypt la contraseña guardada es un hash, así que buscás por username y después comparás con `comparePassword`.

**2. `isActive: true`.** Un usuario dado de baja no puede loguearse.

**3. El mismo mensaje en los dos casos.** Si dijeras "el usuario no existe" en un caso y "contraseña incorrecta" en el otro, le estarías confirmando a un atacante qué usernames existen. Con "Credenciales inválidas" en ambos, no sabe cuál de los dos falló.

**4. El `await` en `comparePassword` es vital.** Sin `await`, `validPassword` es una *Promise*, y una Promise siempre es "verdadera" en un `if`. Resultado: **cualquiera entra con cualquier contraseña**. Lo probé: sin el `await`, el login con contraseña incorrecta devuelve 200.

**5. El payload: `{ id: user._id, role: user.role }`.** Solo lo necesario para identificar al usuario y saber qué puede hacer. `user._id` es un **ObjectId**, pero al armar el token se convierte en **texto** (el payload se pasa a JSON). Cuando después lo leas con `verifyToken`, `req.user.id` va a ser un **string**. Guardate este dato para la Lección 11.

---

## Lección 8 · `authMiddleware`

El patovica. Va en **toda ruta que necesite saber quién sos**.

### `src/middlewares/auth.middleware.js`

```js
import { verifyToken } from "../helpers/jwt.helper.js";

export const authMiddleware = (req, res, next) => {
  try {
    const token = req.cookies["token"];

    if (!token) {
      return res.status(401).json({ msg: "No autenticado" });
    }

    const decoded = verifyToken(token);

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ msg: "Token inválido o expirado" });
  }
};
```

| Paso | Código | Si falla |
|---|---|---|
| 1. Agarrar el token de la cookie | `req.cookies["token"]` | |
| 2. ¿Vino? | `if (!token)` | **401** "No autenticado" |
| 3. ¿Es válido y no venció? | `verifyToken(token)` | tira error → `catch` → **401** |
| 4. Guardar quién es | `req.user = decoded` | |
| 5. Dejar pasar | `next()` | |

Después de este middleware, cualquier middleware o controller que venga atrás tiene:

```js
req.user;
```

```json
{ "id": "6ae1ff07f81c7d7044c34b81", "role": "user", "iat": 1793196108, "exp": 1793199708 }
```

> 📝 **Diferencias con el material y con tu TP:**
> - El PDF responde **500** en el `catch`. Acá va **401**, porque un token vencido o trucho no es un error del servidor: es alguien que **no está autenticado**. En tu TP también lo tenías así.
> - El PDF guarda los datos en `req.user` y en tu TP usabas `req.datosDelUsuarioLogeado`. Es lo mismo; el nombre lo elegís vos. Acá uso `req.user` como el material.

---

## Lección 9 · Rutas protegidas: profile y logout

### Rutas públicas y protegidas

El material las distingue así:

```js
authRouter.post("/auth/register", registerValidation, validator, register);

authRouter.post("/auth/login", loginValidation, validator, login);

authRouter.get("/auth/profile", authMiddleware, getProfile);

authRouter.put(
  "/auth/profile",
  authMiddleware,
  updateProfileValidation,
  validator,
  updateProfile,
);

authRouter.post("/auth/logout", authMiddleware, logout);
```

- **Públicas** (sin `authMiddleware`): register y login. Obvio: para loguearte todavía no tenés token.
- **Protegidas** (con `authMiddleware`): todo lo demás.

### Ver mi perfil

```js
export const getProfile = async (req, res) => {
  try {
    const user = await userModel.findOne(
      { _id: req.user.id, isActive: true },
      "-password",
    );

    if (!user) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    return res.status(200).json({ msg: "Perfil encontrado", data: user });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Error interno del servidor" });
  }
};
```

- **El id sale del token (`req.user.id`), no de la URL.** No existe `/profile/:id`: cada uno solo puede ver **su** perfil, porque el id lo pone el servidor a partir del token, y el token no se puede falsificar.
- **`"-password"`** es una **proyección** (el PDF la muestra como `find({}, 'nombre email')` para elegir campos). Con el `-` adelante **excluís** ese campo. Así el hash nunca sale de la base.

### Editar mi perfil

```js
export const updateProfile = async (req, res) => {
  try {
    const profile = matchedData(req);

    const result = await userModel.updateOne(
      { _id: req.user.id, isActive: true },
      { profile },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    return res.status(200).json({ msg: "Perfil actualizado correctamente" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Error interno del servidor" });
  }
};
```

Con `{ profile }` se reemplaza **el subdocumento entero**, igual que lo explicaste en el README de tu repo con `address`. Por eso en `updateProfileValidation`, `first_name` y `last_name` son obligatorios.

### Logout

```js
export const logout = (req, res) => {
  res.clearCookie("token");
  return res.status(200).json({ msg: "Logout exitoso" });
};
```

> 🤔 **Dato de parcial:** el JWT es *stateless* (el servidor no guarda una lista de tokens). El logout borra la cookie del navegador, pero si alguien se hubiera copiado el token, **seguiría funcionando hasta que venza**. Lo probé: con el token viejo, después del logout, `/auth/profile` sigue dando 200. Por eso es importante que el token tenga vencimiento (`expiresIn`).

---

## Lección 10 · `adminMiddleware`

Ya sabemos **quién sos** (gracias a `authMiddleware`). Ahora: **¿podés hacer esto?**

### 401 vs 403

| Código | Significa | Boliche |
|---|---|---|
| **401 Unauthorized** | No sé quién sos (sin token, o token inválido) | No tenés pulsera |
| **403 Forbidden** | Sé quién sos, pero **no tenés permiso** | Tenés pulsera, pero no es VIP |

### `src/middlewares/admin.middleware.js`

```js
export const adminMiddleware = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ msg: "Acceso denegado, solo para administradores" });
  }

  next();
};
```

Es corto porque el trabajo pesado ya lo hizo `authMiddleware`: el `role` viene en `req.user`, sacado del token. **No consulta la base.**

### Las rutas de admin

```js
userRouter.get("/users", authMiddleware, adminMiddleware, getAllUsers);

userRouter.put(
  "/users/:id/role",
  authMiddleware,
  adminMiddleware,
  userIdValidation,
  updateRoleValidation,
  validator,
  updateUserRole,
);

userRouter.delete(
  "/users/:id",
  authMiddleware,
  adminMiddleware,
  userIdValidation,
  validator,
  deleteUser,
);
```

> ⚠️ Si ponés `adminMiddleware` **antes** que `authMiddleware` (o te olvidás de `authMiddleware`), `req.user` todavía no existe y explota con `TypeError: Cannot read properties of undefined (reading 'role')`: la API responde **500**, aunque el usuario sea admin. Lo probé.

### El token es una foto 📸

El `role` se guarda en el token **en el momento del login**. Si un admin te cambia el rol (o lo cambiás en Compass), tu token viejo **sigue diciendo el rol anterior** hasta que te vuelvas a loguear. Lo probé: Beto pasa a admin en la base, pero con su token viejo `/users` le sigue dando 403; se loguea de nuevo y entra.

### Variante: varios roles

El esquema del PDF tiene `rol` con `['usuario', 'admin', 'moderador']`. Si una ruta la pueden usar dos roles:

```js
if (!["admin", "moderador"].includes(req.user.role)) {
  return res.status(403).json({ msg: "Acceso denegado" });
}
```

---

## Lección 11 · `ownerMiddleware`

Un usuario común puede editar y borrar **sus** artículos, pero no los de otro. El admin puede todos.

### El modelo Article: la referencia al autor

```js
import { Schema, model, Types } from "mongoose";

const articleSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    author: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

export const articleModel = model("Article", articleSchema);
```

Es una relación **1:N referenciada** (un usuario tiene muchos artículos), como `instructor` en tu `course.model.js`. La referencia va del lado de "muchos".

### Al crear: el autor sale del token, nunca del body

```js
export const createArticle = async (req, res) => {
  try {
    const { title, content } = matchedData(req);

    const article = await articleModel.create({
      title,
      content,
      author: req.user.id,
    });

    return res
      .status(201)
      .json({ msg: "Artículo creado exitosamente", data: article });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Error interno del servidor" });
  }
};
```

Si el autor viniera en el body, cualquiera podría publicar a nombre de otro. Como `author` no está en `createArticleValidation`, `matchedData` lo descarta aunque lo manden.

### `src/middlewares/owner.middleware.js`

```js
import { articleModel } from "../models/article.model.js";

export const ownerMiddleware = async (req, res, next) => {
  try {
    const { id, role } = req.user;

    const article = await articleModel.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!article) {
      return res.status(404).json({ msg: "Artículo no encontrado" });
    }

    if (article.author.toString() !== id && role !== "admin") {
      return res
        .status(403)
        .json({ msg: "Solo el autor o un admin pueden modificar el artículo" });
    }

    next();
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Error interno del servidor" });
  }
};
```

| Paso | Si falla |
|---|---|
| 1. Sacar `id` y `role` del token | |
| 2. Buscar el artículo por el `:id` de la URL | No existe → **404** |
| 3. ¿Sos el autor **o** sos admin? | Ninguna de las dos → **403** |
| 4. `next()` | |

Leé la condición en voz alta: *"si el autor **no** soy yo **y** **no** soy admin → afuera"*.

### 🪤 La trampa: ObjectId vs string

Esto es **lo único** que cambia de verdad respecto a tu TP de Sequelize, y es donde más se equivoca la gente.

```js
article.author;
```

```
new ObjectId('6ae1ff07f81c7d7044c34b81')     ← es un OBJETO
```

```js
req.user.id;
```

```
'6ae1ff07f81c7d7044c34b81'                   ← es un STRING (viene del token)
```

`!==` compara **tipo y valor**. Un objeto y un string nunca son iguales, entonces `article.author !== id` es **siempre `true`** y **el autor recibe 403 al editar su propio artículo**. Lo probé: sin el `.toString()` falla exactamente así.

Las dos soluciones:

```js
article.author.toString() !== id
```

```js
!article.author.equals(id)
```

En Sequelize no pasaba porque `user_id` e `idUser` eran los dos números.

> 💡 **En las consultas no hace falta convertir:** `articleModel.find({ author: req.user.id })` funciona con el string, porque Mongoose lo convierte a ObjectId solo (*casting*). El problema es **solamente** cuando comparás vos en JavaScript con `===` o `!==`.

### El orden en la ruta

```js
articleRouter.put(
  "/articles/:id",
  authMiddleware,
  articleIdValidation,
  updateArticleValidation,
  validator,
  ownerMiddleware,
  updateArticle,
);
```

1. `authMiddleware` primero: `ownerMiddleware` necesita `req.user`.
2. Las **validaciones antes** que `ownerMiddleware`: si el `:id` es `"123"`, `findOne({ _id: "123" })` explota con un `CastError` y responde **500**. Validando antes con `isMongoId()`, responde **400** como corresponde. Lo probé.
3. `ownerMiddleware` último antes del controller.

### Los controllers de editar y borrar

```js
export const updateArticle = async (req, res) => {
  try {
    const { id, ...changes } = matchedData(req);

    await articleModel.updateOne({ _id: id, isActive: true }, changes);

    return res
      .status(200)
      .json({ msg: "Artículo actualizado correctamente" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Error interno del servidor" });
  }
};

export const deleteArticle = async (req, res) => {
  try {
    const { id } = matchedData(req);

    await articleModel.updateOne({ _id: id, isActive: true }, { isActive: false });

    return res.status(200).json({ msg: "Artículo borrado exitosamente" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Error interno del servidor" });
  }
};
```

No revisan `matchedCount` porque **`ownerMiddleware` ya comprobó que el artículo existe**. El `{ id, ...changes }` es el mismo truco de tu repo: `matchedData` trae el `id` del param y los campos del body, y separás el id del resto.

### "Mis artículos" y el orden de las rutas

```js
export const getMyArticles = async (req, res) => {
  try {
    const articles = await articleModel.find({
      author: req.user.id,
      isActive: true,
    });

    return res
      .status(200)
      .json({ msg: "Tus artículos", data: articles });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Error interno del servidor" });
  }
};
```

```js
articleRouter.get("/articles", getAllArticles);

articleRouter.get("/articles/mine", authMiddleware, getMyArticles);

articleRouter.get(
  "/articles/:id",
  articleIdValidation,
  validator,
  getArticleById,
);
```

`/articles/mine` va **antes** que `/articles/:id`. Si no, Express agarra `"mine"` como si fuera un `:id`, la validación dice que no es un ObjectId y responde **400**. Lo probé: es lo que pasa. En tu TP tenías `/articles/user` antes de `/articles/:id` por lo mismo.

Y fijate que `GET /articles` no tiene `authMiddleware`: es una **ruta pública**. No todo tiene que estar protegido.

### Populate del autor

```js
const articles = await articleModel
  .find({ isActive: true })
  .populate("author", "username");
```

Como en el PDF (`populate('categoria', 'nombre')`): cambia el ObjectId del autor por el documento del usuario, trayendo solo `username`. **Nunca hagas `populate("author")` a secas acá**: traería el usuario entero, contraseña hasheada incluida.

---

## Lección 12 · Códigos HTTP

| Código | Nombre | Cuándo en esta API |
|---|---|---|
| **200** | OK | Login, ver, editar, borrar, logout |
| **201** | Created | Register, crear artículo |
| **400** | Bad Request | Falló una validación (campo vacío, id inválido, username repetido) |
| **401** | Unauthorized | No estás autenticado: sin cookie, token inválido o vencido, credenciales incorrectas |
| **403** | Forbidden | Estás autenticado pero no tenés permiso: no sos admin, no sos el dueño |
| **404** | Not Found | El recurso no existe (o está dado de baja) |
| **500** | Internal Server Error | Algo explotó en el servidor (el `catch`) |

---

## Lección 13 · De tu TP (Sequelize) a Mongoose

**Lo que queda idéntico:** los dos helpers, `authMiddleware`, `adminMiddleware`, el `validator`, `res.cookie`, `clearCookie`, `cookie-parser`, `cors` y el orden de los middlewares en las rutas.

**Lo que cambia:** solo las líneas que hablan con la base.

| Sequelize (tu TP) | Mongoose |
|---|---|
| `User.findByPk(id)` | `userModel.findById(id)` o `userModel.findOne({ _id: id, isActive: true })` |
| `User.findOne({ where: { username } })` | `userModel.findOne({ username })` |
| `User.create({ ... })` | `userModel.create({ ... })` (igual) |
| `instancia.update(datos)` | `userModel.updateOne({ _id: id }, datos)` |
| `paranoid: true` (borrado lógico) | `isActive: false` |
| `attributes: { exclude: ["password"] }` | proyección `"-password"` |
| `include: [{ model: Profile, as: "profile" }]` | perfil embebido, o `.populate()` si es referencia |
| `DataTypes.ENUM("user", "admin")` | `{ type: String, enum: ["user", "admin"] }` |
| `user.id` (número) | `user._id` (ObjectId) |
| `user_id` en Article | `author: { type: Types.ObjectId, ref: "User" }` |
| `articleExist.user_id !== idUser` | `article.author.toString() !== id` |
| `req.datosDelUsuarioLogeado.idUser` | `req.user.id` |
| `isInt()` para ids | `isMongoId()` para ids |

---

## Lección 14 · Errores típicos (todos probados)

Los provoqué uno por uno en la solución para ver qué pasa. Si algo te falla, buscá el síntoma acá.

| Síntoma | Causa | Arreglo |
|---|---|---|
| Siempre **"Token inválido o expirado"** aunque te logueaste bien | Falta `app.use(cookieParser())`, entonces `req.cookies` es `undefined` | Agregarlo en `app.js` antes de las rutas |
| **Cualquiera entra con cualquier contraseña** | Falta el `await` en `comparePassword` (una Promise es "verdadera") | `await comparePassword(...)` |
| **El autor recibe 403** al editar su propio artículo | Comparás un ObjectId con un string | `article.author.toString() !== id` |
| **500** con `Cannot read properties of undefined (reading 'role')` | `adminMiddleware` va antes que `authMiddleware`, o falta `authMiddleware` | `authMiddleware` siempre primero |
| `GET /articles/mine` da **400** "El id no es un ObjectId válido" | La ruta `/:id` está antes que `/mine` | Rutas fijas antes que las de parámetro |
| **500** con `CastError` cuando el id es raro | `ownerMiddleware` va antes que la validación del id | Validación y `validator` antes que `ownerMiddleware` |
| Alguien se registra con `role: "admin"` | Usás `req.body` en el create | `matchedData` y desestructurar solo lo que querés |
| `secretOrPrivateKey must have a value` | Falta `JWT_SECRET` en el `.env` (o no existe el `.env`) | Copiar `.env.example` a `.env` y completarlo |
| `next is not a function` en un `pre('save')` | En Mongoose 9 los `pre` ya no reciben `next` | Ver Lección 15 |
| El perfil o la lista de usuarios **devuelve la contraseña** | Falta la proyección | `"-password"` en el `find`/`findOne` |
| **500** con `E11000 duplicate key` | No validaste username/email repetidos | `custom()` con `findOne` en la validación |
| Cambiaste el `role` en Compass y **sigue dando 403** | El token viejo tiene el rol viejo | Volver a loguearse |
| `ERR_HTTP_HEADERS_SENT` | Respondiste sin `return` y el código siguió | `return res.status(...)...` |
| Cambiás el código y **la API sigue respondiendo como antes** | Quedó otro servidor viejo corriendo en el mismo puerto. Express 5 **igual imprime** "Servidor corriendo en el puerto 3000" aunque el puerto esté ocupado (me pasó armando este curso) | Cerrá las otras terminales donde hiciste `npm run dev` y levantalo de nuevo |

---

## Lección 15 · Extra: hashear con `pre('save')`

El PDF de Mongoose muestra "Middleware en Mongoose" con un `pre('save')` que se ejecuta antes de guardar y menciona *"Password modificado, aplicando hash..."*. Es otra forma de hashear: en el **modelo** en vez de en el controller.

> ⚠️ El ejemplo del PDF usa `function (next) { ...; next(); }`. **En Mongoose 9 (la versión de tu repo) eso tira `next is not a function`**, porque los `pre` ya no reciben `next`. Lo probé. Se escribe con `async` y sin `next`:

```js
import { Schema, model } from "mongoose";
import { hashPassword } from "../helpers/bcrypt.helper.js";

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
});

userSchema.pre("save", async function () {
  if (this.isModified("password")) {
    this.password = await hashPassword(this.password);
  }
});

export const userModel = model("User", userSchema);
```

- `this` es el documento que se está por guardar (por eso `function` y no flecha).
- `isModified("password")` evita volver a hashear un hash cuando guardás el usuario por otro motivo.
- `create()` dispara `save`, así que en el register guardás la contraseña tal cual llega y el modelo la hashea.

> ⚠️ Usá **una sola** de las dos formas. Si hasheás en el controller **y** en el `pre('save')`, se guarda el hash del hash y **nadie puede loguearse nunca**.
>
> Y ojo: `updateOne` **no** dispara `save`. Si cambiás la contraseña con `updateOne`, tenés que hashearla a mano.

Para el parcial, la forma más segura es la del controller (Lección 6), que es la del material de autenticación.

---

## 🧾 Machete final

### Instalación

```bash
npm install express mongoose dotenv express-validator cookie-parser cors bcrypt jsonwebtoken
```

### `.env`

```
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/mi-base
JWT_SECRET=una_clave_larga_y_secreta
```

### `app.js` (lo mínimo)

```js
app.use(express.json());
app.use(cookieParser());
app.use("/api", authRouter);
```

### Orden de los middlewares en una ruta

```
authMiddleware → adminMiddleware → validaciones → validator → ownerMiddleware → controller
   ¿quién sos?     ¿sos admin?       ¿datos ok?     → 400       ¿es tuyo?
     → 401           → 403                                     → 404 / 403
```

(Solo ponés los que la ruta necesita, pero siempre en ese orden.)

### Los 5 pasos de cada pieza

| Pieza | Pasos |
|---|---|
| **Register** | `matchedData` → `hashPassword` → `create` → 201 |
| **Login** | `findOne({ username, isActive: true })` → 401 si no está → `await comparePassword` → 401 si no coincide → `generateToken({ id, role })` → `res.cookie("token", ...)` → 200 |
| **authMiddleware** | `req.cookies["token"]` → 401 si no hay → `verifyToken` → `req.user = decoded` → `next()` (catch → 401) |
| **adminMiddleware** | `req.user.role !== "admin"` → 403 → `next()` |
| **ownerMiddleware** | `findOne({ _id: req.params.id })` → 404 → `recurso.author.toString() !== req.user.id && role !== "admin"` → 403 → `next()` |
| **Logout** | `res.clearCookie("token")` → 200 |

### Las 5 cosas que no te podés olvidar

1. `await` en `comparePassword`.
2. `app.use(cookieParser())`.
3. `.toString()` al comparar ObjectId con el id del token.
4. `authMiddleware` siempre primero.
5. El id del usuario y el autor **salen del token**, nunca del body ni de la URL.

¡Éxitos en el parcial, Lauti! 💪
