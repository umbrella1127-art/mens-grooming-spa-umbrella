// Discord Bot（承認/修正/却下フロー）用のヘルパー。
// Botトークンを使ってメッセージを送信・編集する。

const DISCORD_API = "https://discord.com/api/v10";

export const DISCORD_CHANNELS = {
  threads: process.env.DISCORD_CHANNEL_THREADS!,
  blog: process.env.DISCORD_CHANNEL_BLOG!,
  gbp: process.env.DISCORD_CHANNEL_GBP!,
  gbpAnalysis: process.env.DISCORD_CHANNEL_GBP_ANALYSIS!,
  notice: process.env.DISCORD_CHANNEL_NOTICE!,
} as const;

function authHeaders() {
  return {
    Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
    "Content-Type": "application/json",
  };
}

/** 承認・修正・却下の3ボタンを付けたActionRowを作る */
export function approvalButtons(draftId: string) {
  return [
    {
      type: 1,
      components: [
        {
          type: 2,
          style: 3,
          label: "承認",
          custom_id: `approve:${draftId}`,
        },
        {
          type: 2,
          style: 1,
          label: "修正",
          custom_id: `edit:${draftId}`,
        },
        {
          type: 2,
          style: 4,
          label: "却下",
          custom_id: `reject:${draftId}`,
        },
      ],
    },
  ];
}

export async function sendDiscordMessage(
  channelId: string,
  payload: { content?: string; components?: unknown[] },
) {
  const res = await fetch(`${DISCORD_API}/channels/${channelId}/messages`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Discord message送信に失敗: ${res.status} ${await res.text()}`);
  }
  return res.json() as Promise<{ id: string; channel_id: string }>;
}

export async function editDiscordMessage(
  channelId: string,
  messageId: string,
  payload: { content?: string; components?: unknown[] },
) {
  const res = await fetch(
    `${DISCORD_API}/channels/${channelId}/messages/${messageId}`,
    {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    },
  );
  if (!res.ok) {
    throw new Error(`Discord message編集に失敗: ${res.status} ${await res.text()}`);
  }
  return res.json();
}
