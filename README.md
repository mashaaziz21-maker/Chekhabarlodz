# چه خبر ووج AI Bot — MVP

Telegram-first editorial bot for the channel.

## Included
- Admin-only Telegram access
- Ukrainian/Polish source → natural Persian editorial rewrite
- Channel-specific editorial profile
- Photo preservation
- Draft approval workflow
- Publish / regenerate / cancel
- URL inline buttons
- Render/hosting friendly HTTP webhook

## Environment variables
Set these as hosting-provider secrets:
TELEGRAM_BOT_TOKEN
TELEGRAM_WEBHOOK_SECRET
OPENAI_API_KEY
ADMIN_TELEGRAM_USER_ID
CHANNEL_ID
PORT

Never commit `.env` or tokens.

## Planned next
- Proper regeneration using original source
- Edit text flow
- Albums/video
- Scheduling queue
- Telegram reactions and analytics
- Discussion links
- Persistent database
- Optional web dashboard
