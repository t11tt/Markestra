# Markestra

**Turn one promotion into a marketing process that gets better with every campaign.**

Markestra is a proposed AI-assisted marketing workspace for small and medium-sized merchants in China. A merchant supplies verified information about their business, products and promotion. In one place, they can plan a campaign, prepare content for different channels, review and export the assets, record actual results, and use those results to plan the next campaign.

> **Current status (23 September 2026):** Markestra is at the concept and prototype-planning stage. This repository does not claim that the application has been built or launched, that platform APIs have been connected, or that merchants have used it or achieved measurable results.

## The problem we want to test

Small merchants may need to reorganise the same product information, rewrite promotional copy, coordinate posts across platforms, and review results using separate tools. Our **unvalidated hypothesis** is that a single workflow preserving product facts, approved versions and campaign results can reduce repetitive work and make the next promotion more informed. Whether it actually saves time, solves a merchant problem or improves business outcomes must be tested with real users.

## Proposed workflow

1. **Build a verified business brief.** Record the brand, product, price, images, audience and campaign constraints; flag anything that has not been confirmed.
2. **Plan a campaign.** Select a product, objective, timeframe and channels, then create an editable campaign plan.
3. **Prepare channel-specific content.** The first planned scope covers image-and-text posts for Xiaohongshu and WeChat Moments. Douyin video scripts are a possible later extension.
4. **Review and export.** The merchant checks product facts and approves the final copy and assets before exporting them for publication through their own accounts. Exporting does **not** mean that content has been published.
5. **Record results and learn.** Enter or import available channel metrics, distinguish real data from demonstrations, and propose a documented question or change to test in the next campaign.

We call the proposed mechanism for retaining campaign variables and results across iterations **Campaign Genome**. It is a product-design goal, not a proven algorithm. Differences between two campaigns alone cannot establish a causal effect.

## First-version scope

The initial goal is a persistent web workspace covering the path from product information to campaign planning, AI-assisted drafting, human editing and export, metric entry, and a review that informs the next campaign. TypeScript, Next.js and PostgreSQL are being considered; actual technology and implementation status will be demonstrated through future code, tests and runnable instructions.

The first version does **not** promise automatic cross-platform publishing, automatic data scraping, ad purchasing, full short-video generation or cross-platform identity matching. Any future integration would depend on official authorisation, available APIs and a compliance review.

## How to verify progress

We will label a feature as implemented only when the corresponding code, setup instructions and test evidence are available. Merchant interviews, pilots and performance claims will require traceable records and appropriate permission; missing data will remain unknown. This repository presents the product direction and, later, public development work. It is **not** the submission location for ENT303 weekly logs or the team's evidence hub.
