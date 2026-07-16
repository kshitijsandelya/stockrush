# StockRush

A flash-sale platform built to demonstrate and fix a real race condition
in concurrent purchasing. It has two versions of the same buy endpoint
running side by side: a naive one that oversells stock under load, and
a fixed one using Redis atomic operations that doesn't.

## The problem

Under concurrent load, "read stock, check it's above zero, decrement it"
is not one atomic step — it's three, with gaps between them. Two
requests can both read the same stock count before either one writes
back, both pass the check, and both succeed. That's exactly what
`/api/orders/buy-naive` does, on purpose, so it can be load tested and
shown failing.

`/api/orders/buy` fixes it with a Redis `DECR`, which is a single atomic
operation with no gap for a second request to land in. Idempotency keys
(via Redis `SETNX`) also guard against a retried request creating a
duplicate order.

## Results

Load tested locally with k6, 500 concurrent virtual users, against a
product seeded with 100 units of stock:

| Metric           | Naive                          | Fixed (Redis atomic) |
| ---------------- | ------------------------------ | -------------------- |
| Requests handled | 43,417                         | 78,919               |
| Throughput       | 1,447 req/s                    | 2,630 req/s          |
| Avg latency      | 260ms                          | 143ms                |
| Orders recorded  | 110                            | 100                  |
| Oversell         | 10% (110 orders for 100 units) | 0%                   |

The fixed endpoint isn't just correct, it's also faster — the naive
endpoint's `UPDATE` statements all contend for the same Postgres row
under load, while Redis's `DECR` is in-memory and only successful buyers
ever reach Postgres at all.

## Layout

- `server/` — Express + Postgres + Redis API. Naive and fixed buy
  endpoints side by side, plus k6 load test scripts in `server/loadtest/`.
- `client/` — React UI: product page with a naive/fixed toggle to
  trigger the race live, admin panel to schedule sales, order history.

## Running it locally

Needs Node.js, and Docker Desktop for Postgres + Redis (no native
install required).

```
docker compose up -d
```

Starts Postgres and Redis, and loads the schema automatically on first
run.

```
cd server
copy .env.example .env
npm install
npm start
```

In a separate terminal, seed a product:

```
node seed.js
```

And start the client:

```
cd client
npm install
npm run dev
```

Sign up for a token and paste it into the token bar in the app:

```
curl -X POST http://localhost:4000/api/auth/signup -H "Content-Type: application/json" -d "{\"email\":\"you@example.com\",\"password\":\"whatever123\"}"
```

## Load testing it yourself

```
cd server
node loadtest/setup/create-users.js
node loadtest/setup/sign-tokens.js
node loadtest/setup/reset-sale.js
```

The last command prints a sale id, and needs to be re-run before each
test to get a fresh, fully-stocked sale. Then:

```
cd loadtest
$env:BASE_URL="http://localhost:4000"; $env:SALE_ID="<id>"; k6 run naive.js
```

Swap `naive.js` for `fixed.js` (after resetting the sale again) to
compare.
