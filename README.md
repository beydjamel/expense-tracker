# Expense Tracker

A full-stack web app to track income and expenses, built for small businesses such as a cafe: the owner (admin) sees everything, while an employee (worker) can only log expenses.

**Live demo:** https://expense-tracker-5fmy.onrender.com

> The demo runs on free hosting. If it has been idle, the first request can take up to ~50 seconds while the server wakes up.

![Dashboard](docs/dashboard.png)

## Features

- Sign up and log in with secure password hashing
- Two roles: **admin** (full access) and **worker** (can only log entries, not edit or delete)
- Admin creates and removes worker accounts
- Add, edit and delete transactions (income or expense) with date, note and category
- Filter transactions by month and category
- Monthly summary: income, expenses, balance and a pie chart of spending per category
- Responsive UI, usable on phones

## Tech stack

| Layer    | Technology                                          |
| -------- | --------------------------------------------------- |
| Frontend | React (Vite), React Router, Tailwind CSS, SVG chart |
| Backend  | Node.js, Express                                    |
| Database | PostgreSQL (Neon)                                   |
| Auth     | bcryptjs, JSON Web Tokens (JWT)                     |
| Security | helmet, express-rate-limit, CORS allow-list         |
| Hosting  | Render (Web Service + Static Site), Neon            |

## Architecture

```
React app (Static Site)  --HTTPS-->  Express API (Web Service)  -->  PostgreSQL (Neon)
```

- The API is stateless: the client sends a JWT in the `Authorization: Bearer` header.
- Every route is protected by middleware (`requireAuth`, and `requireAdmin` where needed).
- The database schema lives in `server/schema.sql` and is applied with `server/migrate.js`.
- Two Neon branches are used: `development` for daily work and `production` for the live app, each with its own secrets.

## API overview

| Method              | Route                                     | Access   | Description                                     |
| ------------------- | ----------------------------------------- | -------- | ----------------------------------------------- |
| POST                | `/api/auth/register`                      | public   | Create an admin account                         |
| POST                | `/api/auth/login`                         | public   | Log in, returns a token                         |
| GET                 | `/api/auth/me`                            | any user | Current user                                    |
| GET / POST          | `/api/transactions`                       | admin    | List (filters: `month`, `category_id`) / create |
| PUT / DELETE        | `/api/transactions/:id`                   | admin    | Update / delete                                 |
| GET                 | `/api/transactions/summary?month=YYYY-MM` | admin    | Totals and spending by category                 |
| GET / POST          | `/api/categories`                         | admin    | List / create categories                        |
| GET / POST / DELETE | `/api/workers`                            | admin    | Manage worker accounts                          |
| GET                 | `/api/expenses/categories`                | worker   | Categories of the worker's admin                |
| POST                | `/api/expenses`                           | worker   | Log an income expense                           |

## Security decisions

- **Passwords** are hashed with bcrypt and never returned by the API.
- **SQL injection:** all queries are parameterized.
- **Ownership checks:** updates and deletes always filter by the logged-in user's id, so changing an id in the URL cannot touch someone else's data.
- **Roles:** workers are rejected with `403` on admin routes, and the server (not the client) enforces this.
- **Rate limiting:** 20 login/register attempts per 15 minutes per IP, and 300 API requests per 15 minutes.
- **HTTP headers** via helmet, a restricted CORS origin, and a 10 KB body limit.
- **Errors** returned to clients are generic; details are logged on the server only.
- **Secrets** live in environment variables, never in the repository.
- **JWT** algorithm is pinned to HS256 and tokens expire after one day.
- Login failures return one message for both unknown email and wrong password.

## Run locally

Requirements: Node.js 20+ and a PostgreSQL database (for example a free [Neon](https://neon.com) project).

```bash
git clone https://github.com/beydjamel/expense-tracker.git
cd expense-tracker
```

**Server**

```bash
cd server
npm install
```

Create `server/.env`:

```
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=verify-full
JWT_SECRET=a-long-random-string
```

Optional variables: `PORT` (default 5000) and `CLIENT_ORIGIN` (default `http://localhost:5173`).

```bash
node migrate.js     # creates the tables
npm run dev         # starts the API on http://localhost:5000
```

**Client** (in another terminal)

```bash
cd client
npm install
npm run dev         # http://localhost:5173, proxies /api to the server
```

For a deployed build, set `VITE_API_URL` to the API's URL when building the client.

## Known limitations and next steps

- The JWT is stored in `localStorage` for simplicity. A stricter setup would use `httpOnly` cookies.
- No automated tests yet; adding API tests is the next step.
- No password reset or email verification.
- Single currency (DA) and no CSV export.
- Free hosting: the API sleeps after inactivity.

## Author

Built by [Bey Djamel](https://github.com/beydjamel) as a portfolio project, designed around a realistic client scenario (a cafe owner and an employee).

## License

MIT
