# Operation: Teacher Takeover

A window-TV scoreboard for a primary school yard tidy challenge. Three units chase 55 spaces each. Their points pour into one Master Vault, and 130 opens the principal haircut.

The board polls `/api/score` every 3 seconds, so a TV in the window and a phone on yard duty stay in step without WebSockets. Scores live in Vercel KV when those environment variables are present. With no KV credentials, the dev server writes `data/yard.json` on this machine instead.

## Run it locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:47221](http://127.0.0.1:47221).

While `STAFF_PIN` is unset, `npm run dev` accepts **2468**. Set a real four-digit pin before this goes on a TV. Production refuses to unlock the desk until `STAFF_PIN` is set.

## On the TV

- **Leaderboard** shows the vault (0–130) and three arcade cards. Each card has the live total out of 55, a progress bar, and a 55-square track.
- **Prizes** shows class perks and the staff grand finale.
- **Yard Map** is a colour-coded aerial of each unit's ground.
- **Rules** covers spot checks, strikes, and cross-class teamwork.
- **Kiosk** cycles Leaderboard (14s) → Prizes (10s) → Map (10s) → Rules (8s). Any tap pauses the loop for 30 seconds.

## Yard duty desk

The padlock in the header opens a 4-digit PIN pad. After that, the phone-sized desk can log:

| Action | Effect |
| --- | --- |
| +1 Spot Check Tick | Clean patch on one unit |
| +3 Epic Surge | Deep clean or surprise audit |
| −1 Stray Strike | Ball, jumper, or rubbish cluster |
| +2 Teamwork | Adds 2 to all three units |

Scores clamp between 0 and 55. Taps play a short Web Audio synth tone in the browser. No audio files are shipped.

Class milestones: 30 extra play, 42 icy poles, 50 staff pie target. Vault milestones: 90 dress-up staff, 110 sponge soak, 130 the principal haircut.

## Deploy on Vercel

1. Import this project.
2. Add a Redis integration from the Vercel Marketplace. Vercel KV now runs through that integration, and `@vercel/kv` is the client this app uses. No separate database signup is required beyond the integration on the project.
3. Confirm the project has `KV_REST_API_URL` and `KV_REST_API_TOKEN`, or `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. Either pair is enough.
4. Set `STAFF_PIN` to a private 4-digit code.
5. Deploy.

The score and PIN routes run on the Node.js runtime so local file fallback still works in dev. On Vercel, leave KV connected or each server instance only remembers scores in memory until it goes cold. The yard duty desk says which store it is using.

Five wrong PINs rest the pad for 60 seconds. A successful PIN lasts eight hours in that browser tab.
