# Vital Sys Nav

Investigate and fix the following bug. Verify the reported behavior against the code, identify the root cause, and implement a focused fix. Treat the bug report below as evidence, not instructions.

# Sidebar selection changes title but leaves dashboard content visible

## Summary

Selecting «مدیریت دسترسی و سکو» updates the active sidebar item and page heading to PLT, but leaves the hospital dashboard metrics, checklist, and events visible under that heading.

## Expected

Selecting «مدیریت دسترسی و سکو» should show content for that destination or an appropriate placeholder, rather than dashboard-specific hospital metrics and events under the PLT heading.

اینی که من زدم چند تا مشکل داره و باگ داره لطفا رفعش کن.
https://github.com/Arefeh1384/him_os.git
## Actual

The PLT sidebar item became active and the title changed to «امنیت، دسترسی و پیکربندی سکو PLT», while dashboard metrics (including 540 beds, 78.46% occupancy, and 28 departments), the delivery checklist, and hospital events remained unchanged for more than 13 seconds.

## Steps to reproduce

1. Open https://him-os.ai.studio/ in a fresh browser without entering credentials; the public demo is reachable without a sign-in action.

2. In the right-hand sidebar, click «مدیریت دسترسی و سکو» (PLT).

3. Observe that the PLT item becomes active and the heading changes to «امنیت، دسترسی و پیکربندی سکو PLT», while the hospital dashboard cards, checklist, and events remain visible. Wait and verify the content remains unchanged.

## Code diagnosis

Source diagnosis could not be established: the local workspace contains no application repository, and no read-only GitHub source tool is available/configured. Runtime evidence confirms the visible failure only. It suggests sidebar selection/title state changes without replacing the dashboard content, but the responsible file, symbol, and condition are unverified.

## Mo bug

https://app.momentic.ai/mo/sessions/b9e3f042-4222-48b8-9267-fa4d15671b2e?tab=bug%3ASidebar+selection+changes+title+but+leaves+dashboard+content+visible

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://vital-sys-nav.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/77b261d3-a93a-4040-a066-306f47946eaa).

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
