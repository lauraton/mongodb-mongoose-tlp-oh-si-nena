import "dotenv/config";

if (!process.env.JWT_SECRET) {
  console.log("❌ Falta JWT_SECRET en el .env. Copiá el .env.example a .env y completalo.");
  process.exit(1);
}

let hashPassword, comparePassword, generateToken, verifyToken;

try {
  ({ hashPassword, comparePassword } = await import("../src/helpers/bcrypt.helper.js"));
  ({ generateToken, verifyToken } = await import("../src/helpers/jwt.helper.js"));
} catch (error) {
  console.log("❌ No se pudieron importar los helpers:", error.message);
  console.log("   Revisá que existan src/helpers/bcrypt.helper.js y src/helpers/jwt.helper.js");
  console.log("   y que exporten hashPassword, comparePassword, generateToken y verifyToken.");
  process.exit(1);
}

const check = (descripcion, condicion) => {
  console.log(`${condicion ? "✅" : "❌"} ${descripcion}`);
};

console.log("\n=== BCRYPT ===\n");

const hash1 = await hashPassword("lauti1234");
const hash2 = await hashPassword("lauti1234");

console.log("Hash 1 de 'lauti1234':", hash1);
console.log("Hash 2 de 'lauti1234':", hash2);
check("hashPassword devuelve un texto que empieza con $2 (formato bcrypt)", typeof hash1 === "string" && hash1.startsWith("$2"));
check("Los dos hashes son DISTINTOS aunque la contraseña es la misma (por la sal)", hash1 !== hash2);
check("comparePassword con la contraseña correcta da true", (await comparePassword("lauti1234", hash1)) === true);
check("comparePassword con la contraseña correcta y el OTRO hash también da true", (await comparePassword("lauti1234", hash2)) === true);
check("comparePassword con una contraseña incorrecta da false", (await comparePassword("otra1234", hash1)) === false);

console.log("\n=== JWT ===\n");

const token = generateToken({ id: "64f1234567890abcdef12345", role: "user" });
console.log("Token generado:", token);

const partes = typeof token === "string" ? token.split(".") : [];
check("El token tiene 3 partes separadas por puntos (header.payload.signature)", partes.length === 3);

if (partes.length === 3) {
  const [header, payload, signature] = partes;
  console.log("\nHeader decodificado: ", Buffer.from(header, "base64url").toString());
  console.log("Payload decodificado:", Buffer.from(payload, "base64url").toString());
  console.log("(Cualquiera puede decodificarlos: es Base64, o sea CODIFICACIÓN, no encriptación)\n");

  let decoded = null;
  try {
    decoded = verifyToken(token);
  } catch (error) {
    console.log("verifyToken tiró error:", error.message);
  }
  check("verifyToken devuelve el payload con id y role", decoded?.id === "64f1234567890abcdef12345" && decoded?.role === "user");
  check("El payload tiene iat (cuándo se creó) y exp (cuándo vence)", !!decoded?.iat && !!decoded?.exp);
  if (decoded?.iat && decoded?.exp) {
    console.log(`   Dura ${(decoded.exp - decoded.iat) / 60} minutos`);
  }

  console.log("\n=== INTENTO DE TRAMPA: cambiar el role a 'admin' en el payload ===\n");

  const payloadTrucho = Buffer.from(
    JSON.stringify({ ...JSON.parse(Buffer.from(payload, "base64url").toString()), role: "admin" }),
  ).toString("base64url");
  const tokenTrucho = `${header}.${payloadTrucho}.${signature}`;

  let rechazado = false;
  try {
    verifyToken(tokenTrucho);
  } catch (error) {
    rechazado = true;
    console.log("verifyToken dijo:", error.message);
  }
  check("verifyToken RECHAZA el token modificado (la firma ya no coincide)", rechazado);

  let rechazadoBasura = false;
  try {
    verifyToken("cualquier.cosa.inventada");
  } catch (error) {
    rechazadoBasura = true;
  }
  check("verifyToken RECHAZA un token inventado", rechazadoBasura);
}

console.log("");
