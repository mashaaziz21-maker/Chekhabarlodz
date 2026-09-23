import "dotenv/config";
import express from "express";
import OpenAI from "openai";
import {buildPrompt} from "./editorial.js";
import {answerCallbackQuery, editMessageText, sendMessage, sendPhoto} from "./telegram.js";

const app = express();
app.use(express.json({limit:"2mb"}));
const ai = new OpenAI({apiKey:process.env.OPENAI_API_KEY});

type Draft = {
  title:string; body:string; hashtags:string[];
  buttons:{text:string;url:string}[];
  photo?:string; ownerId:number;
};
const drafts = new Map<string,Draft>();

const adminId = () => String(process.env.ADMIN_TELEGRAM_USER_ID || "252041334");
const allowed = (id?:number) => !!id && String(id) === adminId();

function esc(s:string) {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
function render(d:Draft) {
  return `<b>${esc(d.title)}</b>\n\n${esc(d.body)}\n\n${d.hashtags.join(" ")}`;
}
function markup(id:string, d:Draft) {
  const rows:any[] = [
    [{text:"✅ Опублікувати",callback_data:`publish:${id}`},
     {text:"🔄 Перегенерувати",callback_data:`regen:${id}`}],
    [{text:"❌ Скасувати",callback_data:`cancel:${id}`}]
  ];
  if (d.buttons.length) rows.splice(1,0,d.buttons.map(b=>({text:b.text,url:b.url})));
  return {inline_keyboard:rows};
}
async function generate(source:string) {
  const r = await ai.responses.create({model:"gpt-5-mini",input:buildPrompt(source)});
  return JSON.parse(r.output_text.trim());
}

app.get("/",(_req,res)=>res.send("چه خبر ووج AI bot is running"));

app.post("/telegram/webhook",async(req,res)=>{
  try {
    const secret = req.headers["x-telegram-bot-api-secret-token"];
    if (process.env.TELEGRAM_WEBHOOK_SECRET && secret !== process.env.TELEGRAM_WEBHOOK_SECRET)
      return res.sendStatus(403);

    const u:any=req.body, m=u.message, cb=u.callback_query;

    if(m) {
      if(!allowed(m.from?.id)) {
        await sendMessage(m.chat.id,"⛔️ دسترسی فقط برای مدیر کانال فعال است.");
        return res.sendStatus(200);
      }
      const source = m.text || m.caption;
      const photo = m.photo?.at(-1)?.file_id;
      if(!source) {
        await sendMessage(m.chat.id,"متن پست را همراه با عکس یا بدون عکس بفرست.");
        return res.sendStatus(200);
      }
      await sendMessage(m.chat.id,"⏳ دارم پست را آماده می‌کنم...");
      const g=await generate(source);
      const id=`${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
      const d:Draft={title:g.title,body:g.body,hashtags:g.hashtags||[],buttons:g.buttons||[],photo,ownerId:m.from.id};
      drafts.set(id,d);
      await sendMessage(m.chat.id,render(d),markup(id,d));
    }

    if(cb) {
      if(!allowed(cb.from?.id)) return res.sendStatus(200);
      await answerCallbackQuery(cb.id);
      const [action,id]=String(cb.data||"").split(":");
      const d=drafts.get(id);
      if(!d) return res.sendStatus(200);

      if(action==="cancel") {
        drafts.delete(id);
        await editMessageText(cb.message.chat.id,cb.message.message_id,"❌ Чернетку скасовано.");
      } else if(action==="publish") {
        const channel=process.env.CHANNEL_ID;
        if(!channel) throw new Error("CHANNEL_ID is not configured");
        const buttons=d.buttons.length ? {inline_keyboard:[d.buttons.map(b=>({text:b.text,url:b.url}))]} : undefined;
        if(d.photo) await sendPhoto(channel,d.photo,render(d),buttons);
        else await sendMessage(channel,render(d),buttons);
        drafts.delete(id);
        await editMessageText(cb.message.chat.id,cb.message.message_id,"✅ Опубліковано.");
      } else if(action==="regen") {
        const g=await generate(d.body);
        d.title=g.title; d.body=g.body; d.hashtags=g.hashtags||[]; d.buttons=g.buttons||[];
        await editMessageText(cb.message.chat.id,cb.message.message_id,render(d),markup(id,d));
      }
    }
    res.sendStatus(200);
  } catch(e) {
    console.error(e);
    res.sendStatus(200);
  }
});
app.listen(Number(process.env.PORT||3000),()=>console.log("Bot listening"));
