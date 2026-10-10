# Aura Book Hotel Services

A hotel booking website (HTML, CSS, JavaScript). It uses the Milina template's design and Aura's booking system. No install or build step: open `index.html`, or upload the folder to any web host.

## Pages
- `index.html` home · `about.html` · `services.html` · `rooms.html` (rates) · `contact.html`
- `book.html` - the 6-step booking (search, room + add-ons, login/register + code, review, payment, reference)
- `office.html` - back office: assign room, check in, check out

## Edit your hotel
- Replace in all `.html` files: phone `+63 900 000 0000` and email `hello@your-domain.com` (contact form opens the visitor's email app to that address).
- Maps: contact page shows Manila; change `q=` in the map iframe.

## How data is stored
This simple version needs no database. Bookings and accounts are saved in the visitor's own browser, so the back office only shows bookings made in that same browser. It is good for a demo or school project. Payment is a demo (no money moves).

## Edit your hotel
`js/data.js` holds locations, room types, prices, stock, add-ons.

## Publish
Netlify/Vercel: drag the folder in. GitHub Pages: push the folder, then Settings > Pages > `main` branch, root.
