CREATE TABLE IF NOT EXISTS "ContentCatalogItem" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"externalKey" varchar(220) NOT NULL,
	"sourceApp" varchar NOT NULL,
	"sourceType" varchar(40) NOT NULL,
	"sourceId" varchar(220),
	"kind" varchar NOT NULL,
	"title" varchar(300) NOT NULL,
	"summary" text,
	"href" varchar(1000) NOT NULL,
	"categoryCode" varchar(10) NOT NULL,
	"subcategoryCode" varchar(10) NOT NULL,
	"taxonomyType" varchar(300) NOT NULL,
	"primaryTagKey" varchar(500) NOT NULL,
	"additionalTagKeys" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"status" varchar DEFAULT 'ACTIVE' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ContentUsage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"contentItemId" uuid NOT NULL,
	"state" varchar DEFAULT 'VIEWED' NOT NULL,
	"firstUsedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"lastUsedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"completedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "TaxonomyTagProposal" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" varchar(300) NOT NULL,
	"normalizedKey" varchar(500) NOT NULL,
	"categoryCode" varchar(10) NOT NULL,
	"subcategoryCode" varchar(10) NOT NULL,
	"taxonomyType" varchar(300) NOT NULL,
	"status" varchar DEFAULT 'PENDING' NOT NULL,
	"reviewNote" varchar(1000),
	"proposedById" uuid,
	"reviewedById" uuid,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "TaxonomyTagRecord" (
	"key" varchar(500) PRIMARY KEY NOT NULL,
	"label" varchar(300) NOT NULL,
	"categoryCode" varchar(10),
	"subcategoryCode" varchar(10),
	"taxonomyType" varchar(300),
	"origin" varchar DEFAULT 'CUSTOM' NOT NULL,
	"status" varchar DEFAULT 'ACTIVE' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Program" ADD COLUMN IF NOT EXISTS "catalogItemId" uuid;--> statement-breakpoint
ALTER TABLE IF EXISTS "ContentPost" ADD COLUMN IF NOT EXISTS "catalogItemId" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ContentUsage" ADD CONSTRAINT "ContentUsage_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ContentUsage" ADD CONSTRAINT "ContentUsage_contentItemId_ContentCatalogItem_id_fk" FOREIGN KEY ("contentItemId") REFERENCES "public"."ContentCatalogItem"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "TaxonomyTagProposal" ADD CONSTRAINT "TaxonomyTagProposal_proposedById_User_id_fk" FOREIGN KEY ("proposedById") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "TaxonomyTagProposal" ADD CONSTRAINT "TaxonomyTagProposal_reviewedById_User_id_fk" FOREIGN KEY ("reviewedById") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ContentCatalogItem_externalKey_key" ON "ContentCatalogItem" USING btree ("externalKey");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ContentCatalogItem_status_kind_created_idx" ON "ContentCatalogItem" USING btree ("status","kind","createdAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ContentCatalogItem_category_subcategory_idx" ON "ContentCatalogItem" USING btree ("categoryCode","subcategoryCode");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ContentCatalogItem_additional_tags_gin_idx" ON "ContentCatalogItem" USING gin ("additionalTagKeys");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ContentCatalogItem" ADD CONSTRAINT "ContentCatalogItem_additional_tags_check" CHECK (cardinality("additionalTagKeys") <= 4 AND NOT "primaryTagKey" = ANY("additionalTagKeys"));
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ContentUsage_user_content_unique" ON "ContentUsage" USING btree ("userId","contentItemId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ContentUsage_user_last_used_idx" ON "ContentUsage" USING btree ("userId","lastUsedAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "TaxonomyTagProposal_status_created_idx" ON "TaxonomyTagProposal" USING btree ("status","createdAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "TaxonomyTagRecord_path_idx" ON "TaxonomyTagRecord" USING btree ("status","subcategoryCode","taxonomyType");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Program" ADD CONSTRAINT "Program_catalogItemId_ContentCatalogItem_id_fk" FOREIGN KEY ("catalogItemId") REFERENCES "public"."ContentCatalogItem"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "Program_catalogItemId_key" ON "Program" USING btree ("catalogItemId");--> statement-breakpoint
INSERT INTO "ContentCatalogItem"
  ("externalKey", "sourceApp", "sourceType", kind, title, summary, href, "categoryCode", "subcategoryCode", "taxonomyType", "primaryTagKey", "additionalTagKeys", "createdAt")
VALUES
  ('static:note', 'AICHAT', 'STATIC', 'NOTE', 'Миний тэмдэглэл', 'Бодол, туршлагаа эргэцүүлэн тэмдэглэх орон зай.', '/mind/ebooks', '1', '1.10', 'Суралцах ба эргэцүүлэх', 'өөрийгөө эргэцүүлэх', ARRAY['туршлагаасаа суралцах'], '2026-08-19T00:00:01Z'),
  ('static:finance', 'AICHAT', 'STATIC', 'FINANCE', 'Санхүүгийн апп', 'Орлого, зарлага, төсөв, санхүүгийн сонголтоо ойлгох хэрэгсэл.', '/mind/life/finance-app', '6', '6.1', 'Хөгжүүлэх чадвар', 'санхүүгийн мэдээлэл уншиж ойлгох', ARRAY['мэдээлэлд тулгуурлан шийдвэр гаргах'], '2026-08-19T00:00:02Z'),
  ('static:health', 'AICHAT', 'STATIC', 'HEALTH', 'Эрүүл мэндийн апп', 'Өдөр тутмын биеийн байдал, хооллолт, хөдөлгөөнөө ажиглах хэрэгсэл.', '/mind/self-care/health/intro', '4', '4.1', 'Хөгжүүлэх чадвар', 'эрүүл мэндийн мэдээлэлтэй шийдвэр гаргах', ARRAY['биеийн дохиогоо таних'], '2026-08-19T00:00:03Z'),
  ('static:specialist', 'AICHAT', 'STATIC', 'SPECIALIST', 'Онлайн сэтгэл зүйч', 'Тохирох мэргэжилтэнтэй аюулгүй холбогдох хэсэг.', '/mind/online-psychologist', '7', '7.10', 'Тусламж эрэлхийлэх', 'мэргэжлийн үйлчилгээтэй холбогдох', ARRAY['тусламж хэрэгтэйгээ таних'], '2026-08-19T00:00:04Z'),
  ('static:test:communication-style', 'AICHAT', 'RELATION_TEST', 'TEST', 'Харилцааны хэв маяг', NULL, '/mind/relations/tests/communication-style', '3', '3.2', 'Хөгжүүлэх чадвар', 'ассертив харилцаа', ARRAY['харилцааны нөхцөлд тохируулан харилцах'], '2026-08-19T00:00:05Z'),
  ('static:test:personality-basic', 'AICHAT', 'RELATION_TEST', 'TEST', 'Хувь хүний онцлог', NULL, '/mind/relations/tests/personality-basic', '1', '1.1', 'Өөрийгөө танин мэдэх', 'зан төлөв ба хувь хүний онцлог', ARRAY['өөрийн зан үйлийг таних'], '2026-08-19T00:00:06Z'),
  ('static:test:listening', 'AICHAT', 'RELATION_TEST', 'TEST', 'Сонсох чадвар', NULL, '/mind/relations/tests/listening', '3', '3.2', 'Сонсох ба ойлголцох', 'идэвхтэй сонсох', ARRAY['ойлгож сонсох'], '2026-08-19T00:00:07Z'),
  ('static:test:empathy', 'AICHAT', 'RELATION_TEST', 'TEST', 'Эмпати', NULL, '/mind/relations/tests/empathy', '3', '3.1', 'Харилцан ойлголцол', 'эмпати ба бусдын өнцгөөс харах', ARRAY['бусдын өнцгөөс харах'], '2026-08-19T00:00:08Z'),
  ('static:test:boundaries', 'AICHAT', 'RELATION_TEST', 'TEST', 'Хил хязгаар', NULL, '/mind/relations/tests/boundaries', '3', '3.8', 'Хөгжүүлэх чадвар', 'хил хязгаараа таних', ARRAY['хил хязгаараа илэрхийлэх'], '2026-08-19T00:00:09Z'),
  ('static:test:conflict', 'AICHAT', 'RELATION_TEST', 'TEST', 'Зөрчил зохицуулалт', NULL, '/mind/relations/tests/conflict', '3', '3.9', 'Хөгжүүлэх чадвар', 'зөрчлийн шалтгааныг таних', ARRAY['асуудлыг хамтран шийдвэрлэх'], '2026-08-19T00:00:10Z'),
  ('static:test:trust', 'AICHAT', 'RELATION_TEST', 'TEST', 'Итгэлцэл', NULL, '/mind/relations/tests/trust', '3', '3.7', 'Итгэл', 'харилцан итгэлцэл', ARRAY['найдвартай байдал'], '2026-08-19T00:00:11Z'),
  ('static:test:toxic-behavior', 'AICHAT', 'RELATION_TEST', 'TEST', 'Эрүүл бус харилцааны шинж', NULL, '/mind/relations/tests/toxic-behavior', '3', '3.8', 'Хөгжүүлэх чадвар', 'эрүүл ба эрүүл бус харилцааг ялгах', ARRAY['хяналт ба шахалт'], '2026-08-19T00:00:12Z')
ON CONFLICT ("externalKey") DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  href = EXCLUDED.href,
  "categoryCode" = EXCLUDED."categoryCode",
  "subcategoryCode" = EXCLUDED."subcategoryCode",
  "taxonomyType" = EXCLUDED."taxonomyType",
  "primaryTagKey" = EXCLUDED."primaryTagKey",
  "additionalTagKeys" = EXCLUDED."additionalTagKeys",
  status = 'ACTIVE',
  "updatedAt" = now();
