# Treasury settlement assessment notes

## What was implemented

- Added a cross-chain settlement form to `src/pages/TreasuryPage.tsx` with source token, source chain, destination chain, and amount.
- Added client-side checks for positive amounts and different source/destination chains.
- Added `GET /api/treasury/settlements` and `POST /api/treasury/settle` through `backend/routes/treasuryRoute.js`.
- Added backend validation for supported tokens/chains and amount bounds, plus an in-memory list of the latest 100 attempts.
- Added a recent-attempts panel and success/error feedback.
- Added a frontend mock fallback for the settlement endpoints when the backend cannot be reached.

## Important scope note

This is an assessment/demo flow only. Requests are recorded with status `simulated`; it does not sign transactions, call a bridge provider, or transfer assets on-chain. The backend history is in memory and is cleared when the backend process restarts.

## Run and test

1. Install dependencies with `npm install`.
2. Start both apps with `npm run dev`.
3. Open the Treasury page.
4. Submit a positive amount with different source and destination chains. Confirm the success message and new item in Recent settlement attempts.
5. Try an amount of `0`, an unsupported token via an API request, or identical source/destination chains. The UI blocks basic invalid input and the backend returns HTTP 400 for invalid requests.
6. To test the endpoint directly, send `POST /api/treasury/settle` with JSON such as:

   ```json
   {
     "sourceToken": "USDC",
     "sourceChain": "BNB",
     "destinationChain": "ETH",
     "amount": 25
   }
   ```

   Then request `GET /api/treasury/settlements` to view the recorded attempt.

## API response behavior

A successful request returns HTTP 201 with `success: true`, a `message`, and an `item` containing an ID, normalized chain keys, amount, timestamp, and `status: "simulated"`. Invalid requests return HTTP 400 with a readable `message`.
