# Opening the Stripe Account — Step-by-Step Guide

**Who this is for:** the person at Kesher Tours who will own the company's Stripe
account. **No technical knowledge is needed.** Everything below is done in a normal
web browser.

**What we are doing:** Stripe is the company that will process credit-card payments
on the website. You open the company's Stripe account (it belongs to the company,
not to the developer), fill in the business details, and then invite the developer
into the account so they can finish the technical setup themselves.

**How long it takes:** about 20 minutes, plus a day or two for Stripe to review the
business details.

---

## Who does what

| Step | Who |
|---|---|
| Open the account and complete the business profile | **You** |
| Turn on two-factor authentication | **You** |
| Invite the developer to the account | **You** |
| Set up the technical keys and the payment webhook | **The developer** |
| Confirm the payout bank account before going live | **You** |

You never have to copy, understand, or send any technical values. Once the developer
is invited, they collect what they need directly from the account.

---

## Before you start — collect this information

You cannot finish the sign-up without these. Have them ready in one place:

- [ ] **Legal business name and EIN** exactly as they appear on the IRS letter
      (form CP-575 or a 147C).
- [ ] **Registered business address** and business phone number.
- [ ] **Company bank account details** — the account that will receive the money from
      customers: routing number and account number.
- [ ] **Details of the owner / director**: legal name, date of birth, home address,
      a **Social Security Number or an ITIN** (an ITIN is fine if the owner has no
      SSN), and a photo of a driver's license or passport. Stripe is legally
      required to verify who owns the business.
- [ ] **The website address**, and a short description of what the company sells.
- [ ] **An email address the company controls**, that more than one person can
      reach — see the note in Step 1.

⚠️ The owner's SSN or ITIN and their ID go **into Stripe's own form and nowhere
else**. Do not email them to the developer, to us, or to anyone — nobody outside
Stripe needs them.

---

## Step 1 — Create the account

1. Go to **https://dashboard.stripe.com/register**
2. Enter an email address, your full name, and a password.

   ⚠️ **The address must belong to the company, not to a person.** An account
   opened on someone's private address can become impossible to recover when that
   person leaves or loses their phone. If email on the company domain
   (`office@keshertours.com`) is not running yet, do **not** fall back to a staff
   member's personal inbox — create a new free mailbox for the purpose, such as
   `keshertours.billing@gmail.com`, and keep its password with the company's other
   passwords.

   📌 The address is not locked in. Once email on the company domain is working,
   change it under **Profile → Email** in the dashboard. Nothing about the account
   or the business review has to be redone.

3. Set the country to **United States**.

   ⚠️ The country cannot be changed later. If it is wrong, the account has to be
   closed and reopened from scratch.

4. Stripe sends a confirmation email. Open it and click the confirmation link.

📌 **Store the email address and password where the company keeps its other
passwords** (a password manager, a safe — whatever the company already uses). Do not
send the password to anyone. Nobody, including the developer, ever needs it.

---

## Step 2 — Turn on two-factor authentication (2FA)

Stripe will ask you to do this during sign-up. Do not skip it — this account can move
the company's money.

1. Stripe prompts for a phone number or an authenticator app.
2. Follow the prompts.
3. Stripe then shows a list of **backup codes**. Print them, or save them with the
   password. They are the only way back in if the phone is lost.

---

## Step 3 — Fill in the business details ("activate" the account)

1. In the Stripe dashboard, find the banner or button that says
   **"Activate your account"** / **"Complete your business profile"** and click it.
2. Fill in the details you collected above: business structure (LLC, corporation, sole
   proprietor), legal name, EIN, address, the owner's details, and the bank account
   that will receive payouts.
3. Stripe asks what the business sells — a description like
   *"Organized group tours and travel packages"* is fine — and asks for the website
   address and a support phone/email.
4. Submit. Stripe reviews it, usually within one or two business days, and emails you
   if it needs anything more.

📌 **Two different emails.** The **support email** asked for here is not your login
address — it is printed on customers' receipts and card statements, so it should be
one they will recognise. The **website address** should be whatever URL is live
today; if the company domain is not pointing at the new site yet, ask the developer
for the temporary address. Both can be updated later under **Settings → Business**.

**You do not have to wait for approval to continue to Step 4.** The developer can
work with the account's test mode — fake cards, no real money — while the review is
in progress.

---

## Step 4 — Invite the developer

Instead of you copying technical values out of the dashboard and sending them, you
invite the developer into the account and they collect what they need themselves. The
company still owns the account, and you can remove their access at any time with one
click.

1. Go to **https://dashboard.stripe.com/settings/team**
2. Click **"New member"** / **"Invite member"**.
3. Enter the developer's email address:

   ```
   zsondhelm@gmail.com
   ```

4. For the role, choose **Developer**. (Choose **Administrator** only if the developer
   also needs to change account settings on your behalf.)
5. Send the invitation, then tell the developer it is waiting.

✅ **That is your part done.** The developer takes it from here: they create the API
keys and the payment webhook that connect the website to Stripe.

---

## Step 5 — Before going live (real customers, real money)

Everything the developer builds first runs in Stripe's **test mode** — fake cards, no
real money. Before the site accepts real payments, two things need to be true:

1. **Stripe has approved the business.** You will get an email. You can also check
   https://dashboard.stripe.com — a banner appears at the top if anything is
   still outstanding.
2. **The payout bank account is correct.** Check it at
   https://dashboard.stripe.com/settings/payouts, and note the payout schedule —
   how soon after a customer pays that Stripe transfers the money to the company.

Then tell the developer to switch the site to live mode. They handle the switch;
nothing further is needed from you.

⚠️ If the site is switched to live before Stripe finishes reviewing the business,
customers will hit errors at checkout. Coordinate the timing with the developer.

---

## Things to remember

- **The Stripe account belongs to the company.** Do not open it under a personal name
  or the developer's email. If the relationship with the developer ever ends, the
  company keeps the account, the money, and the customer history — and removing the
  developer's access takes one click at
  https://dashboard.stripe.com/settings/team.
- **Nobody ever needs the account password** — not the developer, not Stripe support.
  Anyone who asks for it is attempting fraud.
- **Stripe will never email you asking for your password or for account keys.** Emails
  that do are phishing. When in doubt, do not click the link in the email — type
  `dashboard.stripe.com` into the browser yourself.
- **Refunds, receipts, and payment history** all live in the Stripe dashboard under
  **Payments**. You do not need the developer for day-to-day money questions.

---

## If something goes wrong

| Problem | What to do |
|---|---|
| Stripe is asking for more documents | Normal. Upload what it asks for; the account simply stays in test mode until the review finishes. |
| The owner has an ITIN, not an SSN | Enter the ITIN where Stripe asks for a Social Security number. If Stripe cannot verify the owner from it, it will ask for a passport or other documents instead — a normal path, not a rejection. |
| The invitation to the developer never arrived | Ask them to check spam, then re-send it from https://dashboard.stripe.com/settings/team. |
| Picked the wrong country at sign-up | Stop and tell the developer before doing anything else. The country cannot be changed — the account has to be reopened. |
| Not sure whether a screen is really Stripe | Check that the address bar says exactly `dashboard.stripe.com`. |

**Stripe's own support:** https://support.stripe.com — they answer account, payout,
and verification questions directly, and it is free.

---

## Who to ask

Questions here come in two kinds, and they go to two different places.

**Anything technical** — the team invitation, which website address to enter, the
webhook, or anything about how the site takes payments — ask the developer. No
question is too basic, and a two-minute answer beats a wrong entry on a form that
cannot be changed afterwards.

| | |
|---|---|
| **Email** | zsondhelm@gmail.com |
| **Phone / WhatsApp** | +972 54-655-6263 |

**Anything about the business itself** — which documents Stripe is asking for, why the
review is taking time, when payouts arrive, tax forms — goes to Stripe support at
https://support.stripe.com, who can see the account and answer authoritatively. For
the EIN, the legal name, or the business structure, ask the company's accountant. The
developer cannot answer either of those, and guessing on them is what causes the
problems in the table above.

⚠️ Never include the owner's SSN or ITIN, the account password, or bank details in a
message to anyone — none of that is ever needed to answer a question.

---

## For the developer (not part of the admin's job)

Once the team invitation is accepted, collect from the account and install:

| Dashboard source | Environment variable |
|---|---|
| Developers → API keys, publishable (`pk_...`) | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` |
| Developers → API keys, secret (`sk_...`) | `STRIPE_SECRET_KEY` |
| Webhook endpoint signing secret (`whsec_...`) | `STRIPE_WEBHOOK_SECRET` |

Add a webhook endpoint at `https://<site-domain>/api/webhooks/stripe` subscribed to
`payment_intent.succeeded` — the only event
[app/api/webhooks/stripe/route.ts](../app/api/webhooks/stripe/route.ts) acts on. Test
mode and live mode each need their own endpoint and their own signing secret.

Locally the values go in `.env.local` (see [.env.local.example](../.env.local.example));
in production they are Cloud Secret Manager secrets referenced from
[apphosting.yaml](../apphosting.yaml) — set with
`npx firebase apphosting:secrets:set <NAME>`. Charges are created in USD
([lib/actions/payments.ts](../lib/actions/payments.ts)).
