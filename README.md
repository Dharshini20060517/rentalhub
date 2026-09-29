# RentalHub — Intelligent Equipment Rental Ecosystem

A production-grade, web-based equipment rental platform connecting **Customers**, **Equipment Owners/Rental Businesses**, and **Administrators**. Eliminates double bookings, inaccurate availability, pricing guesswork, missed maintenance, late returns, and condition disputes.

## Tech Stack

| Layer     | Technology |
|-----------|-----------|
| Frontend  | React (Vite) + TypeScript, Tailwind CSS, React Query, React Hook Form + Zod, Recharts, Framer Motion |
| Backend   | Node.js + Express + TypeScript, REST API |
| Database  | MongoDB + Mongoose (transactions, compound indexes, aggregation pipelines) |
| Auth      | JWT access + refresh tokens (httpOnly cookies), RBAC |
| Realtime  | Socket.IO |
| Jobs      | BullMQ + Redis |
| Storage   | Cloudinary / S3 |
| AI        | Pluggable (Anthropic/OpenAI vision API, rule-based fallback) |
| Payments  | Stripe / Razorpay (test mode) |
| Quality   | Jest + Supertest, ESLint, Prettier, Docker Compose, GitHub Actions CI |

## Quick Start

### Prerequisites

- Docker + Docker Compose
- Node.js 20+ (for local development without Docker)

### Run with Docker Compose

```bash
cd rentalhub
docker-compose up --build
```

This starts:
- MongoDB (single-node replica set for transactions)
- Redis
- API server on http://localhost:4000
- Client on http://localhost:5173

### Run locally (without Docker)

**1. Start MongoDB and Redis** (via Docker):
```bash
docker run -d -p 27017:27017 --name mongo mongo:7 --replSet rs0
docker run -d -p 6379:6379 --name redis redis:7-alpine
```

**2. Configure environment:**
```bash
cp server/.env.example server/.env
# Edit server/.env with your settings
```

**3. Install dependencies and run:**
```bash
# Server
cd server
npm install
npm run dev

# Client (new terminal)
cd client
npm install
npm run dev
```

### Seed demo data

```bash
cd server
npm run seed
```

Demo accounts:
| Role     | Email                  | Password      |
|----------|------------------------|---------------|
| Admin    | admin@rentalhub.com    | Admin@123456  |
| Owner    | owner1@rentalhub.com   | Owner@123456  |
| Customer | customer1@rentalhub.com| Customer@123  |

## API

Base URL: `http://localhost:4000/api/v1`

| Endpoint | Description |
|----------|-------------|
| `POST /auth/register` | Register a new user |
| `POST /auth/login` | Login (sets httpOnly cookies) |
| `POST /auth/refresh` | Refresh access token |
| `POST /auth/logout` | Logout |
| `GET  /auth/me` | Current user info |
| `GET  /users` | List users (admin) |
| `GET  /categories` | List categories |
| `POST /categories` | Create category (admin) |
| `GET  /equipment` | Search/filter equipment |
| `POST /equipment` | Create listing (owner) |
| `GET  /equipment/:id` | Get equipment details |

## Project Structure

```
rentalhub/
├── docker-compose.yml
├── docs/
│   ├── architecture.md
│   └── er-diagram.md
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── models/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── utils/
│   │   └── seed/
│   └── tests/
├── client/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── lib/
│       └── hooks/
└── .github/workflows/ci.yml
```

## Development

```bash
# Server
cd server
npm run dev        # Start with hot reload
npm run seed       # Seed demo data
npm test           # Run tests
npm run lint       # Lint

# Client
cd client
npm run dev        # Start Vite dev server
npm run build      # Production build
npm run lint       # Lint
```

## License

MIT
