interface InlineButton {
  text: string;
  url: string;
}

export async function sendTelegramMessage(
  text: string,
  inlineKeyboard?: InlineButton[][]
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.warn("[telegram] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set");
    return;
  }

  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  };

  if (inlineKeyboard) {
    body.reply_markup = {
      inline_keyboard: inlineKeyboard.map((row) =>
        row.map((btn) => ({ text: btn.text, url: btn.url }))
      ),
    };
  }

  const res = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error("[telegram] sendMessage failed:", err);
  }
}
