# Term 4 Tidy Challenge

A sunny window-TV scoreboard for Milawa Primary. Three units chase 60 tidy squares each. A game with Mr K, laser tag, and ice cream are on the board. The three teacher takedowns stay a secret until the day. Strikes sit on their own grid and take one tidy square off.

The board polls `/api/score` every 3 seconds, so a TV in the window and a phone on yard duty stay in step without WebSockets. Scores live in Vercel KV when those environment variables are present. With no KV credentials, the dev server writes `data/yard.json` on this machine instead.

## Run it locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:47221](http://127.0.0.1:47221).

While `STAFF_PIN` is unset, the desk accepts **737373**. A custom pin must be six digits. Yard duty starts by tapping a name — Jess, Craig, Ash, Ricky, Tiff, Doug, Hunter, Jenny, Richard, or Maria — then the code. That device stays signed in as that person until someone taps **Lock desk**. Every tick is stored with their name. The window shows the latest name, and the desk keeps a short list of who gave points.

## On the TV

- **Leaderboard** shows the school tidy total out of 120 squares, a days-to-go clock when a finish time is set, and three unit cards on one screen. On the TV each card has the grade, a circled tally, a 60-square tidy track with a trophy on each prize square, and a separate 30-square strikes grid. A strike takes one tidy square off and fills one strike space. Trophies stay on their prize squares. On a phone the grids stay off so all three classes fit, with large +1, +2, and −1 buttons. The school button is +3 all.
- **Prizes** gives each class its own path. A takedown stays a lock until that class reaches it, then the stop shows a silhouette.
- **Yard & Rules** puts the aerial on the left and the four scoring rules on the right.
- **Start Kiosk** sits next to the cog. Kiosk hides the header. Move the mouse or touch the screen and tap the X, or press Esc, to leave.
- **Settings** (the cog) opens with an Admin button. The admin code unlocks page ticks, seconds, the days-to-go clock, and prize reveals. Yard duty names cannot change those.
- **Prize reveals** are three extra pages, Teacher Takedown #1 to #3. Before the date, both silhouettes show with a countdown. When the time arrives the card flips and shows the cartoon: dress-up for #1, pie for #2, and the ice bucket for #3.

## Yard duty desk

The padlock in the header opens the name list, then a 6-digit code pad. After that, the phone-sized desk can log:

| Action | Effect |
| --- | --- |
| +1 Spot Check Tick | Clean patch on one unit |
| +2 Epic Surge | Outstanding cleaning |
| −1 Stray Strike | Ball, jumper, or rubbish cluster |
| +3 Teamwork | Adds 3 to all three units |

Scores clamp between 0 and 60. A strike lowers the tally by one and marks the strikes grid, up to 30. Taps play a short Web Audio synth tone in the browser. No audio files are shipped.

Class prizes, per unit: 10 Game with Mr K, 20 Teacher Takedown #1, 30 laser tag for the class, 40 Teacher Takedown #2, 50 ice cream, and 60 Teacher Takedown #3. The takedown stops do not say what happens. Staff can open **Mystery ideas** on the desk for pie, ice bucket, and dress-up prompts. Those lines never appear on the TV.

## Deploy on Vercel

1. Import this project.
2. Add a Redis integration from the Vercel Marketplace. Vercel KV now runs through that integration, and `@vercel/kv` is the client this app uses. No separate database signup is required beyond the integration on the project.
3. Confirm the project has `KV_REST_API_URL` and `KV_REST_API_TOKEN`, or `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. Either pair is enough.
4. Set `STAFF_PIN` to a private 6-digit code, or leave it unset to keep **737373**.
5. Deploy.

The score and PIN routes run on the Node.js runtime so local file fallback still works in dev. On Vercel, leave KV connected or each server instance only remembers scores in memory until it goes cold. The yard duty desk says which store it is using.

Five wrong codes rest the pad for 60 seconds. A successful sign-in is kept in this browser, under that teacher's name, until **Lock desk**.
