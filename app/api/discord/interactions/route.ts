import { after } from "next/server";
import { verifyKey } from "discord-interactions";
import { editDiscordMessage } from "@/lib/discord";
import { getServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

const STATUS_LABEL: Record<string, string> = {
  approved: "✅ 承認済み",
  rejected: "❌ 却下",
};

/**
 * Discordは3秒以内の応答を要求するが、サーバーレスの起動遅延で
 * 間に合わないことがある。そのため「受け取った」ことだけ即座に返し
 * （DEFERRED応答）、実際の処理はレスポンス送信後にafter()で行い、
 * 完了後にWebhook経由で元のメッセージを編集する。
 */
async function editOriginalInteractionResponse(
  interactionToken: string,
  payload: Record<string, unknown>,
) {
  const applicationId = process.env.DISCORD_APPLICATION_ID!;
  await fetch(
    `https://discord.com/api/v10/webhooks/${applicationId}/${interactionToken}/messages/@original`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
}

export async function POST(req: Request) {
  const signature = req.headers.get("x-signature-ed25519");
  const timestamp = req.headers.get("x-signature-timestamp");
  const rawBody = await req.text();

  const publicKey = process.env.DISCORD_PUBLIC_KEY!;
  const isValid =
    signature &&
    timestamp &&
    (await verifyKey(rawBody, signature, timestamp, publicKey));

  if (!isValid) {
    return new Response("invalid request signature", { status: 401 });
  }

  const body = JSON.parse(rawBody);

  // PING（Discord側の疎通確認）
  if (body.type === 1) {
    return Response.json({ type: 1 });
  }

  // ボタンクリック
  if (body.type === 3) {
    const customId: string = body.data.custom_id;
    const [action, draftId] = customId.split(":");

    if (action === "approve" || action === "reject") {
      const status = action === "approve" ? "approved" : "rejected";
      const originalContent: string = body.message?.content ?? "";
      const interactionToken: string = body.token;

      after(async () => {
        const supabase = getServiceClient();
        // pendingのときだけ更新する（二重クリックで後勝ちになるのを防ぐ）
        const { data: updated } = await supabase
          .from("content_drafts")
          .update({ status, updated_at: new Date().toISOString() })
          .eq("id", draftId)
          .eq("status", "pending")
          .select("status")
          .maybeSingle();

        if (!updated) {
          // 既に決定済みだった場合は現在の状態を取り直して表示する
          const { data: current } = await supabase
            .from("content_drafts")
            .select("status")
            .eq("id", draftId)
            .single();
          const currentStatus = current?.status;
          const label = currentStatus ? STATUS_LABEL[currentStatus] : undefined;
          if (label) {
            await editOriginalInteractionResponse(interactionToken, {
              content: `${label}（すでに決定済みです）\n\n${originalContent}`,
              components: [],
            });
          }
          return;
        }

        await editOriginalInteractionResponse(interactionToken, {
          content: `${STATUS_LABEL[status]}\n\n${originalContent}`,
          components: [],
        });
      });

      return Response.json({ type: 6 }); // DEFERRED_UPDATE_MESSAGE
    }

    if (action === "edit") {
      // モーダル表示は非同期処理なしで即座に返せるのでそのまま
      return Response.json({
        type: 9, // MODAL
        data: {
          custom_id: `edit_modal:${draftId}`,
          title: "修正内容を入力",
          components: [
            {
              type: 1,
              components: [
                {
                  type: 4,
                  custom_id: "edit_text",
                  style: 2,
                  label: "どう直してほしいか教えてください",
                  required: true,
                  max_length: 1000,
                },
              ],
            },
          ],
        },
      });
    }
  }

  // 修正モーダルの送信
  if (body.type === 5) {
    const customId: string = body.data.custom_id;
    const [, draftId] = customId.split(":");
    const editNote: string =
      body.data.components[0].components[0].value ?? "";
    const interactionToken: string = body.token;

    after(async () => {
      const supabase = getServiceClient();
      const { data: draft } = await supabase
        .from("content_drafts")
        .select("discord_channel_id, discord_message_id, content_text")
        .eq("id", draftId)
        .single();

      await supabase
        .from("content_drafts")
        .update({
          status: "editing",
          edit_note: editNote,
          updated_at: new Date().toISOString(),
        })
        .eq("id", draftId);

      if (draft?.discord_channel_id && draft?.discord_message_id) {
        await editDiscordMessage(draft.discord_channel_id, draft.discord_message_id, {
          content: `✏️ 修正依頼あり：${editNote}\n\n${draft.content_text}`,
          components: [],
        });
      }

      await editOriginalInteractionResponse(interactionToken, {
        content: "修正リクエストを受け付けました。反映して改めてお送りします。",
      });
    });

    return Response.json({
      type: 5, // DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
      data: { flags: 64 }, // ephemeral（本人にだけ見える）
    });
  }

  return new Response("unhandled interaction type", { status: 400 });
}
