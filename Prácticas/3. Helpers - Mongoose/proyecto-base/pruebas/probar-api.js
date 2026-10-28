import "dotenv/config";
import mongoose from "mongoose";

const PORT = process.env.PORT || 3000;
const BASE = `http://localhost:${PORT}/api`;
const hasta = Number(process.argv[2]) || 6;

let aprobados = 0;
let fallados = 0;

const check = (descripcion, condicion, detalle = "") => {
  if (condicion) {
    aprobados++;
    console.log(`  ✅ ${descripcion}`);
  } else {
    fallados++;
    console.log(`  ❌ ${descripcion}${detalle ? `\n       → ${detalle}` : ""}`);
  }
};

const request = async (method, path, { body, cookie } = {}) => {
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";
  if (cookie) headers["Cookie"] = cookie;

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  return { status: res.status, data, setCookies: res.headers.getSetCookie() };
};

const esperar = (descripcion, res, statusEsperado) => {
  const resumen = JSON.stringify(res.data ?? "(sin JSON)").slice(0, 160);
  const pista =
    res.status === 404 && res.data === null
      ? "  (esa ruta no existe: ¿la creaste y registraste el router en app.js?)"
      : "";
  check(
    `${descripcion} → ${statusEsperado}`,
    res.status === statusEsperado,
    `devolvió ${res.status} ${resumen}${pista}`,
  );
};

const cookieDeToken = (setCookies) => {
  const cookie = setCookies.find((c) => c.startsWith("token=") && !c.startsWith("token=;"));
  return cookie ? cookie.split(";")[0] : null;
};

const leerPayload = (cookie) => {
  try {
    const token = cookie.split("=")[1];
    return JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
  } catch {
    return null;
  }
};

const login = async (username, password) => {
  const res = await request("POST", "/auth/login", { body: { username, password } });
  return { res, cookie: cookieDeToken(res.setCookies) };
};

try {
  await fetch(BASE);
} catch {
  console.log(`❌ No pude conectarme a ${BASE}`);
  console.log("   Levantá el servidor en otra terminal con: npm run dev");
  process.exit(1);
}

try {
  await mongoose.connect(process.env.MONGO_URI);
} catch (error) {
  console.log("❌ No pude conectarme a MongoDB con la MONGO_URI del .env:", error.message);
  process.exit(1);
}

const users = mongoose.connection.db.collection("users");
const articles = mongoose.connection.db.collection("articles");

const sufijo = Date.now().toString().slice(-6);
const ana = `ana${sufijo}`;
const beto = `beto${sufijo}`;
const caro = `caro${sufijo}`;
const dani = `dani${sufijo}`;
const clave = "clave1234";

const datosRegistro = (username, nombre) => ({
  username,
  email: `${username}@mail.com`,
  password: clave,
  first_name: nombre,
  last_name: "Prueba",
});

console.log(`\nProbando la API en ${BASE} (actividades 2 a ${hasta})`);

let anaDB = null;

if (hasta >= 2) {
  console.log("\n📝 Actividad 2 · Modelo User y register");

  let r = await request("POST", "/auth/register", {
    body: { ...datosRegistro(ana, "Ana"), role: "admin" },
  });
  esperar("Registrar un usuario nuevo", r, 201);

  await request("POST", "/auth/register", { body: datosRegistro(beto, "Beto") });
  await request("POST", "/auth/register", { body: datosRegistro(caro, "Caro") });
  await request("POST", "/auth/register", { body: datosRegistro(dani, "Dani") });

  r = await request("POST", "/auth/register", {
    body: { ...datosRegistro(ana, "Ana"), email: `otro${sufijo}@mail.com` },
  });
  esperar("Registrar con un username que ya existe", r, 400);

  r = await request("POST", "/auth/register", {
    body: { ...datosRegistro(`otro${sufijo}`, "Otro"), email: `${ana}@mail.com` },
  });
  esperar("Registrar con un email que ya existe", r, 400);

  r = await request("POST", "/auth/register", { body: { username: `x${sufijo}` } });
  esperar("Registrar con datos faltantes", r, 400);

  r = await request("POST", "/auth/register", {
    body: { ...datosRegistro(`corta${sufijo}`, "Corta"), password: "123" },
  });
  esperar("Registrar con una contraseña de menos de 8 caracteres", r, 400);

  anaDB = await users.findOne({ username: ana });
  check("El usuario se guardó en la colección 'users'", !!anaDB);
  check(
    "La contraseña está HASHEADA en la base (no es 'clave1234')",
    !!anaDB && anaDB.password !== clave && String(anaDB.password).startsWith("$2"),
    anaDB ? `en la base quedó: ${anaDB.password}` : "",
  );
  check(
    "Aunque mandó role: 'admin' en el body, quedó como 'user'",
    anaDB?.role === "user",
    anaDB ? `quedó con role: ${anaDB.role}` : "",
  );
  check(
    "El perfil quedó embebido (profile.first_name)",
    anaDB?.profile?.first_name === "Ana",
  );
}

let anaCookie = null;

if (hasta >= 3) {
  console.log("\n🔑 Actividad 3 · Login y cookie");

  let { res } = await login(ana, "otraClave99");
  esperar("Login con contraseña incorrecta", res, 401);

  ({ res } = await login(`noexiste${sufijo}`, clave));
  esperar("Login con un usuario que no existe", res, 401);

  res = await request("POST", "/auth/login", { body: {} });
  esperar("Login sin mandar datos", res, 400);

  ({ res, cookie: anaCookie } = await login(ana, clave));
  esperar("Login correcto", res, 200);
  check("El login manda una cookie llamada 'token'", !!anaCookie);
  check(
    "La cookie es HttpOnly",
    res.setCookies.some((c) => c.startsWith("token=") && /httponly/i.test(c)),
  );

  const payload = anaCookie ? leerPayload(anaCookie) : null;
  check("El payload del token tiene id y role", !!payload?.id && payload?.role === "user");
  check("El payload del token NO tiene la contraseña", !!payload && !("password" in payload));
  check(
    "El id del token es el _id del usuario en la base",
    !!payload && !!anaDB && payload.id === anaDB._id.toString(),
  );
}

if (hasta >= 4) {
  console.log("\n🛡️  Actividad 4 · authMiddleware, profile y logout");

  let r = await request("GET", "/auth/profile");
  esperar("Ver el perfil SIN cookie", r, 401);

  r = await request("GET", "/auth/profile", { cookie: "token=cualquiercosa" });
  esperar("Ver el perfil con un token trucho", r, 401);

  r = await request("GET", "/auth/profile", { cookie: anaCookie });
  esperar("Ver el perfil logueado", r, 200);
  check("El perfil es el del usuario logueado", r.data?.data?.username === ana);
  check(
    "El perfil NO trae la contraseña",
    !!r.data?.data && !("password" in r.data.data),
  );

  r = await request("PUT", "/auth/profile", {
    cookie: anaCookie,
    body: { first_name: "Anita", last_name: "Prueba", biography: "Hola!" },
  });
  esperar("Editar el perfil logueado", r, 200);

  r = await request("GET", "/auth/profile", { cookie: anaCookie });
  check("El cambio se guardó (first_name = Anita)", r.data?.data?.profile?.first_name === "Anita");

  r = await request("PUT", "/auth/profile", {
    body: { first_name: "Hacker", last_name: "Prueba" },
  });
  esperar("Editar el perfil SIN cookie", r, 401);

  r = await request("POST", "/auth/logout", { cookie: anaCookie });
  esperar("Logout", r, 200);
  check(
    "El logout borra la cookie (token vacío y vencido)",
    r.setCookies.some((c) => c.startsWith("token=;")),
  );
}

let betoCookie = null;
let caroCookie = null;
let betoId = null;

if (hasta >= 5) {
  console.log("\n👑 Actividad 5 · adminMiddleware");

  ({ cookie: betoCookie } = await login(beto, clave));

  let r = await request("GET", "/users");
  esperar("Listar usuarios SIN cookie", r, 401);

  r = await request("GET", "/users", { cookie: betoCookie });
  esperar("Listar usuarios siendo 'user'", r, 403);

  await users.updateOne({ username: caro }, { $set: { role: "admin" } });
  console.log(`  (hice admin a ${caro} directo en la base, como harías en Compass)`);

  ({ cookie: caroCookie } = await login(caro, clave));
  r = await request("GET", "/users", { cookie: caroCookie });
  esperar("Listar usuarios siendo 'admin'", r, 200);

  const lista = Array.isArray(r.data?.data) ? r.data.data : [];
  check("La lista de usuarios NO trae contraseñas", lista.length > 0 && lista.every((u) => !("password" in u)));

  betoId = lista.find((u) => u.username === beto)?._id;
  const daniId = lista.find((u) => u.username === dani)?._id;

  r = await request("PUT", "/users/123/role", { cookie: caroCookie, body: { role: "admin" } });
  esperar("Cambiar rol con un id inválido", r, 400);

  r = await request("PUT", `/users/${betoId}/role`, { cookie: caroCookie, body: { role: "superadmin" } });
  esperar("Cambiar rol a uno que no existe", r, 400);

  r = await request("PUT", `/users/${betoId}/role`, { cookie: betoCookie, body: { role: "admin" } });
  esperar("Un 'user' intenta hacerse admin a sí mismo", r, 403);

  r = await request("PUT", `/users/${betoId}/role`, { cookie: caroCookie, body: { role: "admin" } });
  esperar("El admin hace admin a Beto", r, 200);

  r = await request("GET", "/users", { cookie: betoCookie });
  esperar("Beto usa su token VIEJO (dice role 'user', el token es una foto)", r, 403);

  const nuevoLogin = await login(beto, clave);
  r = await request("GET", "/users", { cookie: nuevoLogin.cookie });
  esperar("Beto se vuelve a loguear y ahora sí entra", r, 200);

  await request("PUT", `/users/${betoId}/role`, { cookie: caroCookie, body: { role: "user" } });
  ({ cookie: betoCookie } = await login(beto, clave));

  r = await request("DELETE", `/users/${daniId}`, { cookie: caroCookie });
  esperar("El admin borra a Dani", r, 200);

  const { res: loginDani } = await login(dani, clave);
  esperar("Dani (borrado) intenta loguearse", loginDani, 401);

  r = await request("DELETE", `/users/${daniId}`, { cookie: caroCookie });
  esperar("Borrar de nuevo a Dani (ya no está activo)", r, 404);
}

if (hasta >= 6) {
  console.log("\n✍️  Actividad 6 · Artículos y ownerMiddleware");

  ({ cookie: anaCookie } = await login(ana, clave));
  if (!betoCookie) ({ cookie: betoCookie } = await login(beto, clave));
  if (!caroCookie) {
    await users.updateOne({ username: caro }, { $set: { role: "admin" } });
    ({ cookie: caroCookie } = await login(caro, clave));
  }
  if (!betoId) betoId = (await users.findOne({ username: beto }))?._id?.toString();
  const anaId = (await users.findOne({ username: ana }))?._id?.toString();

  let r = await request("POST", "/articles", {
    body: { title: "Sin login", content: "Esto no debería crearse" },
  });
  esperar("Crear artículo SIN cookie", r, 401);

  r = await request("POST", "/articles", { cookie: anaCookie, body: { title: "" } });
  esperar("Crear artículo con datos inválidos", r, 400);

  r = await request("POST", "/articles", {
    cookie: anaCookie,
    body: {
      title: "Mi primer artículo",
      content: "Contenido de prueba del artículo",
      author: betoId,
    },
  });
  esperar("Ana crea un artículo", r, 201);
  const articleId = r.data?.data?._id;
  check(
    "El autor es Ana aunque mandó 'author' con el id de Beto",
    !!anaId && r.data?.data?.author === anaId,
    `author guardado: ${r.data?.data?.author}`,
  );

  r = await request("GET", "/articles");
  esperar("Listar artículos SIN cookie (ruta pública)", r, 200);
  const enLista = Array.isArray(r.data?.data) ? r.data.data.find((a) => a._id === articleId) : null;
  check("El populate trae el username del autor", enLista?.author?.username === ana);

  r = await request("GET", "/articles/mine", { cookie: anaCookie });
  esperar("Ana ve sus artículos", r, 200);
  check(
    "En 'mis artículos' de Ana está su artículo",
    Array.isArray(r.data?.data) && r.data.data.some((a) => a._id === articleId),
  );

  r = await request("GET", "/articles/mine", { cookie: betoCookie });
  check(
    "En 'mis artículos' de Beto NO está el de Ana",
    Array.isArray(r.data?.data) && !r.data.data.some((a) => a._id === articleId),
  );

  r = await request("PUT", `/articles/${articleId}`, {
    cookie: betoCookie,
    body: { title: "Hackeado por Beto" },
  });
  esperar("Beto intenta editar el artículo de Ana", r, 403);

  r = await request("PUT", `/articles/${articleId}`, {
    cookie: anaCookie,
    body: { title: "Título editado" },
  });
  esperar("Ana edita su artículo", r, 200);

  r = await request("GET", `/articles/${articleId}`);
  check("El título cambió", r.data?.data?.title === "Título editado");

  r = await request("PUT", "/articles/123", { cookie: anaCookie, body: { title: "Otro título" } });
  esperar("Editar con un id inválido", r, 400);

  const idQueNoExiste = new mongoose.Types.ObjectId().toString();
  r = await request("PUT", `/articles/${idQueNoExiste}`, {
    cookie: anaCookie,
    body: { title: "Otro título" },
  });
  esperar("Editar un artículo que no existe", r, 404);

  r = await request("DELETE", `/articles/${articleId}`, { cookie: betoCookie });
  esperar("Beto intenta borrar el artículo de Ana", r, 403);

  r = await request("DELETE", `/articles/${articleId}`, { cookie: caroCookie });
  esperar("Caro (admin, no es la autora) borra el artículo", r, 200);

  r = await request("GET", `/articles/${articleId}`);
  esperar("Buscar el artículo borrado", r, 404);
}

const creados = await users.find({ username: { $regex: `${sufijo}$` } }).toArray();
await articles.deleteMany({ author: { $in: creados.map((u) => u._id) } });
await users.deleteMany({ username: { $regex: `${sufijo}$` } });
await mongoose.disconnect();

console.log(`\nResultado: ${aprobados} ✅  /  ${fallados} ❌`);
if (fallados === 0) {
  console.log("¡Todo bien! 🎉\n");
} else {
  console.log("Leé los ❌ de arriba: dicen qué esperaba y qué devolvió tu API.\n");
}
