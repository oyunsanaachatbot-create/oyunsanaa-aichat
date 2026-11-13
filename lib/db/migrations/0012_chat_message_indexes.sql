CREATE INDEX IF NOT EXISTS "Chat_userId_createdAt_idx" ON "Chat" USING btree ("userId","createdAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Message_v2_chatId_createdAt_idx" ON "Message_v2" USING btree ("chatId","createdAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Message_v2_createdAt_idx" ON "Message_v2" USING btree ("createdAt");