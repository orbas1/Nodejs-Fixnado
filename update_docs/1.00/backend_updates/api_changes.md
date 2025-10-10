# API Changes – Version 1.00

## Authentication
- **POST `/auth/register`** now returns `{ message, user }` with sanitised user payload (no passwordHash) and nested company metadata when applicable. Validation errors follow `{ message, errors: [{ field, location, message }] }` schema.
- **POST `/auth/login`** returns `{ token, tokenType, expiresIn, user }` aligned to bearer-auth expectations and surfaces validation failures using the same structured error format.
- **GET `/auth/me`** responds with `{ user }` containing two-factor flags and company profile data, replacing the previous raw Sequelize model response.
