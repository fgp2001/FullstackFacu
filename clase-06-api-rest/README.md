# Tarea 012 · API REST de usuarios

API de usuarios con Express, Yup y CORS. CRUD **en memoria**.

> ⚠️ **Persistencia:** los datos viven en memoria. Al reiniciar el proceso
> se pierden y vuelven a los usuarios iniciales.

## Levantar la API

```bash
npm install
npm run dev
```

Responde en http://localhost:3000. Requiere Node 20 o superior.

## Endpoints

| Método | Ruta | Respuesta |
|---|---|---|
| GET | /api/health | 200 `{ status, uptime }` |
| GET | /api/users | 200 `{ data: [...] }` |
| GET | /api/users?name=ada | 200, filtra por nombre |
| GET | /api/users/:id | 200 / 404 `USER_NOT_FOUND` |
| POST | /api/users | 201 + header `Location` / 400 |
| PATCH | /api/users/:id | 200 / 400 / 404 |
| DELETE | /api/users/:id | 204 / 404 |

La contraseña nunca se devuelve.

## Formato de errores

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": ["..."] } }
```

## Probar con curl

```bash
curl -i http://localhost:3000/api/health

curl -i -X POST http://localhost:3000/api/users \
  -H 'Content-Type: application/json' \
  -d '{"name":"Ada","email":"ada@example.com","password":"ada-secret-789"}'

curl -i -X PATCH http://localhost:3000/api/users/3 \
  -H 'Content-Type: application/json' \
  -d '{"name":"Ada Lovelace"}'

curl -i -X DELETE http://localhost:3000/api/users/3

# CORS: origen permitido / no permitido
curl -i -X OPTIONS http://localhost:3000/api/users \
  -H 'Origin: http://localhost:5173' -H 'Access-Control-Request-Method: POST'
curl -i -X OPTIONS http://localhost:3000/api/users \
  -H 'Origin: http://evil.example.com' -H 'Access-Control-Request-Method: POST'
```

En PowerShell usá `curl.exe` y, si las comillas dan problemas, Git Bash
o un archivo `api.http` con la extensión REST Client de VS Code.