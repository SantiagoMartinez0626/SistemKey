# SistemKey (local + Docker)

Implementacion local de 2 lambdas en Node.js, con ejecucion por contenedores:

1. `encryptor`: recibe un JSON, lo firma como `JWS (RS256)` y luego lo cifra en `JWE (RSA-OAEP-256 + A256GCM)`.
2. `decryptor`: recibe el `JWE`, lo descifra, valida firma y devuelve el `JWT` (JWS) + payload.

## Estructura

- `src/lambdas/encryptor/index.js`
- `src/lambdas/decryptor/index.js`
- `src/crypto/jws.js`
- `src/crypto/jwe.js`
- `src/local/encryptor-server.js`
- `src/local/decryptor-server.js`
- `docker-compose.yml`
- `Dockerfile`
- `test/flow.test.js`

## Variables de entorno

Usa `.env.example` como referencia. Puedes generar un `.env` real automaticamente:

```bash
node scripts/generate-keys.js
```

o con script:

```bash
npm run keys:generate
```

Variables requeridas:

- `SIGNING_PRIVATE_KEY_PEM`: llave privada para firmar JWS.
- `ENCRYPTION_PUBLIC_KEY_PEM`: llave publica para cifrar JWE.
- `DECRYPTION_PRIVATE_KEY_PEM`: llave privada para descifrar JWE.
- `VERIFICATION_PUBLIC_KEY_PEM`: llave publica para validar firma JWS.

## Pruebas locales sin Docker

```bash
node --test
```

## Levantar servicios con Docker

1) Genera llaves:

```bash
node scripts/generate-keys.js
```

2) Construye y levanta contenedores:

```bash
docker compose up --build
```

Servicios:

- `encryptor`: `POST http://localhost:3000/encrypt`
- `decryptor`: `POST http://localhost:3001/decrypt`

Health checks:

- `GET http://localhost:3000/health`
- `GET http://localhost:3001/health`

## Prueba end-to-end contra contenedores

Con ambos servicios arriba:

```bash
node scripts/e2e.js
```

o:

```bash
npm run local:e2e
```

## Contratos de entrada y salida

### Lambda encryptor

Entrada (`event.body`):

```json
{
  "payload": {
    "sub": "user-123",
    "role": "admin"
  }
}
```

Salida:

```json
{
  "jwe": "<token compacto JWE>",
  "jws": "<token compacto JWS>"
}
```

### Lambda decryptor

Entrada (`event.body`):

```json
{
  "jwe": "<token compacto JWE>"
}
```

Salida:

```json
{
  "jwt": "<token compacto JWS>",
  "payload": {
    "sub": "user-123",
    "role": "admin"
  },
  "header": {
    "alg": "RS256",
    "typ": "JWT"
  }
}
```

## Notas de contenedores

- Los PEM en `.env` se guardan escapados con `\n`.
- Las lambdas normalizan esos saltos de linea al cargar variables.
- No incluye despliegue AWS todavia (solo entorno local containerizado).
