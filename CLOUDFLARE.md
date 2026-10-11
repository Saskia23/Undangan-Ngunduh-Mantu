# Publish on Cloudflare Pages

1. Push this project to a GitHub repository and import that repository in Cloudflare Pages.
2. Set the build command to `npm run build` and the build output directory to `dist`.
3. Create a D1 database, then run `migrations/0001_create_rsvp_wishes.sql` against it.
4. In the Pages project's **Settings → Functions → D1 database bindings**, bind that database to `DB` for production (and preview, if needed).
5. Deploy. Pages Functions in `functions/api/rsvp.js` use the `DB` binding for shared RSVP and wishes.

The public guest links use the published Pages URL as their base. Keep using the same Pages project and custom domain (if configured) for future deployments; GitHub pushes then publish updates to that same address.
