# Move Opportunities to Investment

## Goal

Move the student opportunity tools shown in the annotated screenshot from the Home page to the Investment section.

## Design

- Remove the “Opportunities for you” heading, Smart Jar, Jamiyah, temporary jobs, cashback, and Friends cards from `HomeScreen`.
- Render the same block near the top of `Invest`, immediately after the Investment page heading and before the portfolio controls.
- Reuse the existing components and overlay actions so behavior, state, translations, and responsive styling remain unchanged.
- Keep the streak, level, and adherence summary on Home.
- Do not duplicate the opportunity cards or change sidebar navigation.

## Verification

- Add a focused source contract test confirming the opportunity block is owned by `Invest`, not `HomeScreen`.
- Run `npm run check`.
- Verify the Home and Investment views through the local development server.
