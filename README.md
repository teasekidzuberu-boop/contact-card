# Remix of Tap Scan Connect Card

Build a production-ready, mobile-first personal digital contact card web application with a premium minimalist black theme.



TECH STACK

Use React, TypeScript, Vite, Tailwind CSS, shadcn/ui and Lucide React. Use Supabase for database, admin authentication and profile image storage. Use qrcode.react for QR codes and generate a valid downloadable vCard (.vcf).



PUBLIC CONTACT CARD

Create a public route at / and a shareable profile route at /p/:slug. Use a near-black #090909 background, charcoal #151515 surfaces, white typography and restrained muted-gold #B99A61 accents. Use a centered, responsive card with profile photo, full name, professional title, short bio, prominent Save Contact and WhatsApp buttons, social media icons, a QR code, and a copy/share profile link action. Include optional email, phone, location and website fields. Keep the layout polished, accessible, fast and mobile-first, with subtle animations and clear hover/focus states. Avoid excessive gradients and clutter.



CONTACT FEATURES

1. WhatsApp opens https://wa.me/ with the correctly normalized phone number and optional prefilled message. Validate the phone number and never hardcode example contact details as real data.

2. Save Contact generates and downloads a valid .vcf file containing the available name, phone, email, organization/title, website and address fields. Escape vCard values correctly.

3. Generate a scannable QR code from the canonical public profile URL, with a download option. Do not encode a temporary preview URL or the QR image itself.

4. Render only configured social links. Validate URLs, use safe external-link attributes, and provide accessible labels.

5. Add copy-link and native share actions, with a clipboard fallback and clear success/error feedback.



ADMIN DASHBOARD

Create a protected /admin/login route and /admin dashboard. Require Supabase Auth. There must be no public admin registration. The dashboard should allow the authorized administrator to edit name, slug, title, bio, phone, WhatsApp message, email, location, website, profile photo and social links. Allow social links to be added, edited, removed and reordered. Include a preview of the public card, save/loading/error states, and a logout button. Changes must persist in Supabase and appear on the public page after saving. Never expose admin credentials or service-role keys in client-side code.



DATA AND SECURITY

Create a profile table with a unique slug and the contact fields, plus a social_links table or equivalent structured representation. Configure Supabase Row Level Security so public visitors can read only published profile information and cannot insert, update or delete profile data. Only an authenticated, explicitly authorized admin may edit profiles and upload images. Do not rely on hiding admin UI as a security measure. Keep secrets in environment variables, use Supabase's public anon/publishable key only in the frontend, and document the required SQL migrations, RLS policies and storage permissions. Do not create a publicly accessible table of passwords or store passwords in localStorage.



INITIAL SETUP

Use placeholder profile content clearly marked as demo data until I enter my real details. Provide an initial setup guide for creating the Supabase project, configuring environment variables, applying database migrations, enabling the admin account securely and configuring the profile-photo bucket. Do not claim the backend is connected until the integration has actually been configured and tested. Do not add payment features or unnecessary functionality.



QUALITY REQUIREMENTS

Build the working application, not just a static mockup. Test mobile and desktop layouts, form validation, direct route refresh, contact-file downloads, QR generation, external links, authentication and unauthorized access. Include empty, loading and error states. Ensure the public page works without login and the admin pages remain protected. Keep the code organized into reusable components and provide concise setup and deployment instructions. The finished result should be ready for me to personalize and publish.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f5ee5ebb-6740-445f-98cc-88c258627579).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
