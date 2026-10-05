# Term 4 Tidy Challenge

A sunny window-TV scoreboard for Milawa Primary. Three units chase 75 squares each. Laser tag and ice cream are on the board. Teacher takedowns stay a secret until the day. Strikes show up as crosses on the square sheet.

The board polls `/api/score` every 3 seconds, so a TV in the window and a phone on yard duty stay in step without WebSockets. Scores live in Vercel KV when those environment variables are present. With no KV credentials, the dev server writes `data/yard.json` on this machine instead.

## Run it locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:47221](http://127.0.0.1:47221).

While `STAFF_PIN` is unset, the desk accepts **737373**. A custom pin must be six digits. Yard duty starts by tapping a name — Jess, Craig, Ash, Ricky, Tiff, Doug, Hunter, Jenny, Richard, or Maria — then the code. That device stays signed in as that person until someone taps **Lock desk**. Every tick is stored with their name. The window shows the latest name, and the desk keeps a short list of who gave points.

## On the TV

- **Leaderboard** shows the school total and three unit cards on one screen. Each card has the grade, a circled tally, a 75-square track, crosses that do not erase ticks, and the +1, +3, and −1 buttons.
- **Prizes** is a landscape path to the highest honour.
- **Yard Map** is the aerial of Milawa Primary.
- **Rules** covers spot checks, strikes, and cross-class teamwork.
- **Settings** (the cog) starts kiosk mode and sets how many seconds the board, prizes, map, and rules each stay up. Kiosk hides the header. Move the mouse or touch the screen and tap the X, or press Esc, to leave.

## Yard duty desk

The padlock in the header opens the name list, then a 6-digit code pad. After that, the phone-sized desk can log:

| Action | Effect |
| --- | --- |
| +1 Spot Check Tick | Clean patch on one unit |
| +3 Epic Surge | Deep clean or surprise audit |
| −1 Stray Strike | Ball, jumper, or rubbish cluster |
| +2 Teamwork | Adds 2 to all three units |

Scores clamp between 0 and 75. A strike lowers the tally by one and adds a cross. It does not wipe a tick off the sheet. Taps play a short Web Audio synth tone in the browser. No audio files are shipped.

Class prizes, per unit: 20 laser tag, 25 teacher takedown, 30 two takedowns, 35 ice cream, then 40, 45, and 50 for three, four, and five takedowns. The takedown envelopes do not say what happens. Staff can open **Mystery ideas** on the desk for pie, ice bucket, and dress-up prompts. Those lines never appear on the TV.

## Deploy on Vercel

1. Import this project.
2. Add a Redis integration from the Vercel Marketplace. Vercel KV now runs through that integration, and `@vercel/kv` is the client this app uses. No separate database signup is required beyond the integration on the project.
3. Confirm the project has `KV_REST_API_URL` and `KV_REST_API_TOKEN`, or `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. Either pair is enough.
4. Set `STAFF_PIN` to a private 6-digit code, or leave it unset to keep **737373**.
5. Deploy.

The score and PIN routes run on the Node.js runtime so local file fallback still works in dev. On Vercel, leave KV connected or each server instance only remembers scores in memory until it goes cold. The yard duty desk says which store it is using.

Five wrong codes rest the pad for 60 seconds. A successful sign-in is kept in this browser, under that teacher's name, until **Lock desk**.
