const api = () => `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

async function call(method: string, payload: Record<string, unknown>) {
  const r = await fetch(`${api()}/${method}`, {
    method: "POST",
    headers: {"content-type": "application/json"},
    body: JSON.stringify(payload)
  });
  const data: any = await r.json();
  if (!data.ok) throw new Error(data.description || method);
  return data.result;
}
export const sendMessage = (chat_id: string|number, text: string, reply_markup?: unknown) =>
  call("sendMessage", {chat_id, text, parse_mode:"HTML", reply_markup});
export const sendPhoto = (chat_id: string|number, photo: string, caption: string, reply_markup?: unknown) =>
  call("sendPhoto", {chat_id, photo, caption, parse_mode:"HTML", reply_markup});
export const editMessageText = (chat_id:string|number, message_id:number, text:string, reply_markup?:unknown) =>
  call("editMessageText", {chat_id,message_id,text,parse_mode:"HTML",reply_markup});
export const answerCallbackQuery = (callback_query_id:string) =>
  call("answerCallbackQuery", {callback_query_id});
