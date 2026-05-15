# SocialFront

Frontend for managing enquiries, admissions, and follow-ups.

## Development

Install dependencies and start the dev server. Copy `.env.example` to
`.env.development` and `.env.production` and set `VITE_BASE_URL` and
`VITE_DB_SECRET_KEY` appropriately:

```bash
npm install
npm run dev
```

### Offline Caching
The client caches leads, students, attendance, admissions, courses, exams, batches and payment modes in **IndexedDB** via [Dexie](https://dexie.org). Sensitive fields are encrypted with `crypto-js` before storage and purged on logout. Set `VITE_DB_SECRET_KEY` in your environment files to configure encryption.

## API Endpoints

The app now consumes the following updated API routes:

- `GET /api/record/enquiry?institute_uuid=ID&page=0&limit=20`
- `GET /api/record/admission?institute_uuid=ID`
- `GET /api/record/followup?institute_uuid=ID`

These endpoints return objects of the form:

```json
{ "data": [], "total": 0, "page": 0, "limit": 20 }
```

Other record actions like `POST /api/record` and `PUT /api/record/:id` remain unchanged.
