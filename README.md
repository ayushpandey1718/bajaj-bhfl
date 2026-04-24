# BFHL Full Stack Challenge

Single Node.js app that serves:

- API: `POST /bfhl`
- Frontend SPA: `/`

## Local Run

```bash
npm install
USER_ID="yourname_ddmmyyyy" EMAIL_ID="you@college.edu" COLLEGE_ROLL_NUMBER="21CS1001" npm start
```

Open:

- `http://localhost:3000` (frontend)
- `http://localhost:3000/bfhl` (API endpoint)

## API Contract

Request:

```json
{
  "data": ["A->B", "A->C", "B->D"]
}
```

Response contains:

- `user_id`
- `email_id`
- `college_roll_number`
- `hierarchies`
- `invalid_entries`
- `duplicate_edges`
- `summary`

## Deploy on Render (recommended)

1. Push this folder to a public GitHub repo.
2. In Render, click **New +** -> **Blueprint**.
3. Connect your repo and select this project root.
4. Render auto-detects `render.yaml`.
5. Set environment variables:
   - `USER_ID`
   - `EMAIL_ID`
   - `COLLEGE_ROLL_NUMBER`
6. Deploy.

After deployment:

- API URL: `https://<your-render-app>.onrender.com/bfhl`
- Frontend URL: `https://<your-render-app>.onrender.com/`

