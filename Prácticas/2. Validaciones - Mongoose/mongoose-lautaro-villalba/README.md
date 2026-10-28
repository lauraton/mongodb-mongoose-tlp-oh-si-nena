# mongoose-villalba-lautaro

API hecha con Express y Mongoose. Tiene 4 colecciones: students, studentProfiles, instructors y courses, cada una con su CRUD, validaciones con express-validator y eliminación lógica.

## Cómo levantarlo

- `npm install`
- Crear el `.env` copiando el `.env.example` y poner el PORT y la MONGO_URI (ej: `mongodb://127.0.0.1:27017/db-mongoose-laurato`)
- `npm run dev`

Todas las rutas van con `/api` adelante (ej: `/api/students`).

## Relaciones y por qué las hice así

**Embebido: address en Student**

La dirección (city, country, street) la dejé embebida en el student porque no tiene sentido que esté sola, siempre va con el alumno y nunca la voy a buscar por separado. Si la hacía otra colección iba a tener que hacer otra consulta al pedo.
En el update, address no es obligatorio, pero si lo mandás tenés que mandar los 3 campos, porque si no se reemplaza el objeto entero y se pierden los otros datos.

**1:1 Student - StudentProfile**

El perfil tiene datos extra del alumno (email, phone, bio, fecha de nacimiento, año de ingreso). Lo hice referenciado y no embebido porque no siempre se necesitan esos datos cuando listás los alumnos, entonces el student queda más liviano y el perfil lo traigo con populate cuando hace falta.
La referencia está en StudentProfile (el campo `student`) y tiene `unique: true`, que es lo que hace que sea 1 a 1, porque así un student no puede tener 2 perfiles.

**1:N Instructor - Course**

Un instructor puede dar muchos cursos pero cada curso tiene un solo instructor. Por eso la referencia la puse en Course (campo `instructor`), que es el lado de "muchos". Si lo ponía en Instructor tenía que ser un array que crece cada vez que se crea un curso, así es más fácil.

**N:M Student - Course**

Un alumno puede estar en muchos cursos y un curso tiene muchos alumnos. El array lo puse en Course (campo `students`) porque pienso la inscripción desde el curso, o sea el curso tiene su lista de inscriptos. Como un curso no va a tener tantos alumnos, que el array crezca no es problema.

## Investigación

**Populate desde la colección que no tiene la referencia**

El populate lo que hace es cambiar los ids que tenés guardados por el documento completo (busca en la colección que dice el `ref`). Desde el lado que tiene la referencia es fácil, por ej desde course hago populate de instructor y ya.
El problema es al revés, por ej instructor no tiene guardados sus cursos. Para eso se usa un virtual, que es un campo que no se guarda en la base pero mongoose lo llena buscando al revés. Se le pone:

- `ref`: el modelo donde busca
- `localField`: el campo de este modelo (el `_id`)
- `foreignField`: el campo del otro modelo donde está guardada la referencia
- `justOne: true` si es uno solo (lo usé en el profile porque es 1:1)

Y hay que poner `toJSON: { virtuals: true }` y `toObject: { virtuals: true }` en el schema porque si no, no aparece en la respuesta.

Lo usé en: student → profile, student → courses, e instructor → courses.
En los populate puse `match: { isActive: true }` para que no traiga los que están dados de baja, y `select` para traer solo algunos campos.

**Eliminación lógica y en cascada**

La lógica es que en vez de borrar el documento le pongo `isActive: false`. Todos los modelos tienen el `isActive` (por defecto en true) y en todos los find filtro por `isActive: true`, así los dados de baja no aparecen pero tampoco se pierden los datos.

La cascada es que cuando borrás algo también se actualiza lo que depende de eso, para que no queden cosas sueltas:

- Si borro un student → se da de baja su perfil, y con `updateMany` + `$pull` lo saco de todos los cursos donde estaba.
- Si borro un instructor → se dan de baja todos sus cursos con `updateMany`.
- Si borro un course → no hace falta tocar nada más, porque el array de alumnos está en el mismo curso, y como queda inactivo ya no aparece en el populate de student por el match.

Algo que decidí: si se da de baja un perfil, ese student no puede hacerse otro, porque el perfil se da de baja junto con el alumno.

**Endpoint para agregar un vínculo N:M**

`POST /api/courses/:id/students` y en el body se manda `{ "student": "id del student" }`.

En el controller uso `updateOne` con `$addToSet`, que agrega el id al array solo si no está (el `$push` lo agrega igual aunque ya esté, por eso no lo usé).

Las validaciones que tiene:

- que el id del curso y el del student sean ids de mongo (`isMongoId`)
- que el curso exista y esté activo
- que el student exista y esté activo
- que el student no esté ya inscripto en ese curso

Lo último el `$addToSet` ya lo evita, pero igual lo valido para que devuelva un 400 con un mensaje y no un 200 como si hubiera hecho algo.

## Validaciones

- Todas las rutas de crear y actualizar tienen express-validator (que no estén vacíos, tipos, largos)
- Se validan los campos de address
- Los ids de los params y las referencias del body se validan con `isMongoId()`
- Con `custom()` reviso que existan los documentos relacionados y que no haya repetidos (dni, email, phone, perfil del student, inscripción al curso)
- El middleware `validator` usa `validationResult()` y devuelve 400 si hay errores
- En los controllers uso `matchedData()` para usar solo lo que pasó la validación

## Rutas

Students: `/api/students`

- POST, GET, GET /:id, PUT /:id, DELETE /:id

Perfiles: `/api/student-profiles`

- POST, GET, GET /:id, PUT /:id, DELETE /:id

Instructors: `/api/instructors`

- POST, GET, GET /:id, PUT /:id, DELETE /:id

Courses: `/api/courses`

- POST, GET, GET /:id, PUT /:id, DELETE /:id
- POST /:id/students → inscribir un student al curso
