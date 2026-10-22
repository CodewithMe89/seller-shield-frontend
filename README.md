# Seller Shield

**Seller Shield** is a full-stack MERN application for sellers who want to manage products, track orders and inventory, record operating expenses and returns, and understand product profitability through business insights.

> Built with React, Vite, Node.js, Express, MongoDB, and Mongoose.

## Features

- **Authentication** — register and sign in using JWT-based authentication.
- **Dashboard** — access the seller workspace and monitor business performance.
- **Product management** — maintain product details, SKUs, selling and cost prices, stock, and low-stock thresholds.
- **Order management** — record orders and statuses, with selling-price and cost-price snapshots for profit calculations.
- **Inventory management** — review stock levels, identify low/out-of-stock products, and adjust stock.
- **Returns management** — record return reasons, statuses, quantities, and return costs; track stock restoration.
- **Expense tracking** — record platform fees, shipping, advertising, packaging, and miscellaneous expenses.
- **Profit analytics** — review revenue, product costs, expenses, return costs, gross profit, net profit, and profit margin.
- **Business insights** — surface alerts related to stock, product margins, returns, and expenses.
- **Responsive interface** — React pages for desktop and smaller screens.

## Tech stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, React Router, Axios, Lucide React |
| Backend | Node.js, Express |
| Database | MongoDB, Mongoose |
| Authentication | JSON Web Tokens (JWT), bcrypt |
| Deployment | Vercel (frontend and backend as separate projects) |

## Project structure

```text
SellerShield/
├── Client/
│   ├── public/              # Static assets and favicon
│   ├── src/
│   │   ├── components/      # Shared UI and route protection
│   │   ├── context/         # Authentication context
│   │   ├── css/             # Stylesheets
│   │   ├── pages/           # Dashboard and seller pages
│   │   └── services/        # Axios API client
│   ├── .env.example
│   ├── package.json
│   └── vercel.json
├── Server/
│   ├── config/              # Database connection
│   ├── middleware/          # Authentication middleware
│   ├── models/              # Mongoose models
│   ├── routes/              # REST API routes
│   ├── services/            # Business logic and calculations
│   ├── .env.example
│   ├── index.js
│   ├── package.json
│   └── vercel.json
└── README.md
```

## Prerequisites

Install the following before running locally:

- Node.js (use a current LTS release)
- npm
- A MongoDB database, local or MongoDB Atlas

## Run locally

### 1. Get the code

```bash
git clone https://github.com/CodewithMe89/seller-shield-frontend
cd SellerShield
```

If you downloaded the source ZIP instead, extract it and open a terminal in the extracted `SellerShield` folder.

### 2. Configure the backend

```bash
cd Server
npm install
```

Copy `.env.example` to `.env` and fill in your own values:

```env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>/<database>
JWT_SECRET=replace-with-a-long-random-secret
CLIENT_URL=http://localhost:5173
PORT=5000
```

Use a strong, unique JWT secret. Do not commit `.env` or share real credentials.

Start the backend:

```bash
npm run dev
```

The API runs on `http://localhost:5000` by default. Check `http://localhost:5000/`; a successful response should indicate that the Seller Shield API is running.

### 3. Configure the frontend

Open a second terminal:

```bash
cd Client
npm install
```

Copy `Client/.env.example` to `Client/.env` and set the API origin. For a local backend:

```env
VITE_API_URL=http://localhost:5000
```

**Important:** set the origin only—do not append `/api`, because API requests already include paths such as `/api/auth` and `/api/products`.

Start the Vite development server:

```bash
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`).

## Available frontend scripts

Run these from `Client/`:

| Command | Purpose |
|---|---|
| `npm run dev` | Start the local Vite development server |
| `npm run build` | Create the production frontend build in `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint checks |

Run `npm start` from `Server/` to start the backend with Node.js, or `npm run dev` to use Nodemon.

## API overview

All API routes are prefixed with `/api`.

| Area | Base path | Purpose |
|---|---|---|
| Authentication | `/api/auth` | Sign-up and sign-in |
| Users | `/api/users` | User-related endpoints |
| Products | `/api/products` | Product CRUD operations |
| Orders | `/api/orders` | Order management and stock changes |
| Returns | `/api/returns` | Return management and stock restoration |
| Expenses | `/api/expenses` | Operating expense records |
| Profit | `/api/profit` | Profit and return analytics |
| Inventory | `/api/inventory` | Inventory summary, stock listing, and stock adjustment |
| Insights | `/api/insights` | Seller business insights |

Protected endpoints require a valid bearer token. The frontend API client reads the token from local storage and sends it in the `Authorization` header.

## Deploy to Vercel

The frontend and backend should be deployed as **two separate Vercel projects** from the same repository.

### Backend project

1. Import the repository into Vercel.
2. Set **Root Directory** to `Server`.
3. Add the following environment variables in Vercel Project Settings:
   - `MONGO_URI` — production MongoDB connection string
   - `JWT_SECRET` — strong production-only secret
   - `CLIENT_URL` — exact deployed frontend origin, such as `https://seller-shield-frontend.vercel.app/`
4. Deploy the project.
5. Open the backend project URL and confirm the root health response works.

### Frontend project

1. Import the same repository as a second Vercel project.
2. Set **Root Directory** to `Client`.
3. Use the Vite framework preset, build command `npm run build`, and output directory `dist`.
4. Set `VITE_API_URL` to the backend origin only, for example `https://seller-shield-frontend.vercel.app`—without a trailing `/api`.
5. Deploy the project and test direct navigation to `/api/login`, `/api/register`, and authenticated pages.

The backend CORS allowlist includes the configured `CLIENT_URL`, localhost for development, and the frontend URL currently present in the source. If your deployed frontend URL changes, update `CLIENT_URL` in the backend environment and redeploy. Confirm the allowlist matches the intended production frontend.

See [`DEPLOYMENT.md`](DEPLOYMENT.md) for the deployment checklist and production smoke tests.

## Security notes

- Never commit `.env` files, MongoDB credentials, JWT secrets, or other private keys.
- Use separate production credentials and rotate any secret that may have been exposed.
- Configure MongoDB network access and database permissions deliberately.
- Use HTTPS in production and restrict CORS to trusted frontend origins.
- Test with a dedicated account and sample records before entering real business data.

## Testing checklist

Before treating a deployment as production-ready, verify these workflows in the deployed application:

- [ ] Register a new test account and sign in.
- [ ] Confirm invalid credentials show an error and protected routes require authentication.
- [ ] Create, edit, and delete a test product.
- [ ] Create an order and verify stock changes correctly.
- [ ] Record an expense and check profit totals.
- [ ] Complete an eligible return and confirm stock is restored only once.
- [ ] Check low-stock and out-of-stock inventory states.
- [ ] Verify profit calculations and business insights against test data.
- [ ] Refresh nested routes and confirm they load correctly.
- [ ] Check browser Console and Network panels for failed requests or runtime errors.

## Known limitations

- Business insights are rule-based alerts derived from current application data; they are not predictive forecasts.
- Correctness of profit and return figures depends on valid order, return, and expense records and the business rules implemented in the backend.
- A successful frontend build does not by itself verify production API connectivity or database behavior. Run the deployment smoke tests after publishing.

## Contributing

1. Create a feature branch.
2. Make a focused change.
3. Run the frontend build and lint checks, plus relevant backend tests or manual API checks.
4. Open a pull request with a concise summary and test results.

## License

No license has been specified yet. Add a `LICENSE` file before distributing this project under an open-source license.
