@echo off
node scripts/stamp.mjs && git add version.js && git commit -m "Deploy stamp" && vercel --prod --yes --scope pietbaudoinsarvi-pixels-projects
