# Term 4 Tidy Challenge

A sunny window-TV scoreboard for Milawa Primary. Three units chase 60 tidy squares each. Six prizes stay secret on the path until each reveal date. Strikes sit on their own grid and take one tidy square off.

The board polls `/api/score` every 3 seconds, so a TV in the window and a phone on yard duty stay in step without WebSockets. Scores live in Vercel KV when those environment variables are present. With no KV credentials, the dev server writes `data/yard.json` on this machine instead.

## Run it locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:47221](http://127.0.0.1:47221).

While `STAFF_PIN` is unset, the desk accepts **737373**. A custom pin must be six digits. Yard duty starts by tapping a name — Jess, Craig, Ash, Ricky, Tiff, Doug, Hunter, Jenny, Richard, or Maria — then the code. That device stays signed in as that person until someone taps **Lock desk**. Every tick is stored with their name. The window shows the latest name, and the desk keeps a short list of who gave points.

## On the TV

- **Leaderboard** shows a ticker of today’s points (with kid-facing teacher names like Miss B and Mr Kerlin), the school tidy total out of 150 squares, and three grade cards stretched across the TV. On the TV each card has the grade, a circled tally, a 60-square tidy track with a coloured tick in each earned square and a trophy on each prize square, and a separate 30-square strikes grid. A strike takes one tidy square off and fills one strike space. Trophies stay on their prize squares. On a phone the grids stay off so all three classes fit, with large +1, +2, and −1 buttons. The school button is +3 all.
- **Prizes** puts the countdown clock to the right of the heading when a finish time is set, then each class path and the line “Unlock prizes as you get more ticks.” Every stop stays a lock until that prize’s reveal date. After that, the path shows the picture and the name.
- **Yard & Rules** puts the aerial on the left and the four scoring rules on the right.
- **Start Kiosk** sits next to the cog. Kiosk hides the header. Each screen picks two runners from the seven kids and staff. The lead can change up to three times, then one of them hits the finish. Move the mouse or touch the screen and tap the X, or press Esc, to leave.
- **Settings** (the cog) lets anyone choose the bottom timer — coloured rectangles or the running race — set how long the leaderboard, prizes, and yard pages stay on the TV, and paste a Jimmy’s cricket code or share link to add a Cricket page. The admin code unlocks page ticks, the finish clock, prize reveals (including TV name and picture), and a reset for scores and reveals.
- **Prize reveals** are six extra pages, one for each prize. Before the date the countdown says Prize 1, Takedown 1, and so on. Prize 1, 2, and 3 show a yellow lock on a black square. The teacher takedowns show the silhouette and the words Teacher takedown on the path. When the time arrives the card flips, the real name appears, and the cartoon shows.

## Yard duty desk

The padlock in the header opens the name list, then a 6-digit code pad. After that, the phone-sized desk can log:

| Action | Effect |
| --- | --- |
| +1 | Something great: a tidy patch, helping, leading, or a job done properly |
| +2 Epic Surge | Outstanding cleaning |
| −1 Stray Strike | Ball, jumper, or rubbish cluster |
| +3 Teamwork | Adds 3 to all three units |

Scores clamp between 0 and 60. A strike lowers the tally by one and marks the strikes grid, up to 30.

After a tick, **Give reason** appears for a few seconds. Skip it and the points stand. A saved reason joins today’s ticker and stays in the reason record on Craig’s desk.

Class prizes, per unit: 10 Game with Mr K, 20 Teacher Takedown #1, 30 laser tag for the class, 40 Teacher Takedown #2, 50 ice cream, and 60 Teacher Takedown #3. None of those names show on the prize path until the reveal date in Settings. Staff can open **Mystery ideas** on the desk for pie, ice bucket, and dress-up prompts. Those lines never appear on the TV.

Jimmy’s cricket can feed one TV page. In Settings, paste the share link, or a short code when `CRICKET_SHARE_ORIGIN` points at that app. Type `preview` to see a sample ladder.

## Deploy on Vercel

1. Import this project.
2. Add a Redis integration from the Vercel Marketplace. Vercel KV now runs through that integration, and `@vercel/kv` is the client this app uses. No separate database signup is required beyond the integration on the project.
3. Confirm the project has `KV_REST_API_URL` and `KV_REST_API_TOKEN`, or `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. Either pair is enough.
4. Set `STAFF_PIN` to a private 6-digit code, or leave it unset to keep **737373**.
5. Deploy.

The score and PIN routes run on the Node.js runtime so local file fallback still works in dev. On Vercel, leave KV connected or each server instance only remembers scores in memory until it goes cold. The yard duty desk says which store it is using.

Five wrong codes rest the pad for 60 seconds. A successful sign-in is kept in this browser, under that teacher's name, until **Lock desk**.
