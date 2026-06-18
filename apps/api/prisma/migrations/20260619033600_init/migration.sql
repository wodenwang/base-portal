-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "portal_domains" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "cover_color" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_menus" (
    "id" TEXT NOT NULL,
    "domain_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "is_leaf" BOOLEAN NOT NULL DEFAULT false,
    "resource_key" TEXT,
    "url" TEXT,
    "open_mode" TEXT,
    "confirm_on_close" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_audit_events" (
    "id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "user_id" TEXT,
    "user_name" TEXT,
    "domain_key" TEXT,
    "domain_name" TEXT,
    "menu_id" TEXT,
    "menu_title" TEXT,
    "open_mode" TEXT,
    "detail" JSONB,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "portal_domains_key_key" ON "portal_domains"("key");

-- CreateIndex
CREATE UNIQUE INDEX "portal_menus_key_key" ON "portal_menus"("key");

-- CreateIndex
CREATE INDEX "portal_menus_domain_id_idx" ON "portal_menus"("domain_id");

-- CreateIndex
CREATE INDEX "portal_menus_parent_id_idx" ON "portal_menus"("parent_id");

-- CreateIndex
CREATE INDEX "portal_menus_resource_key_idx" ON "portal_menus"("resource_key");

-- CreateIndex
CREATE INDEX "portal_audit_events_event_type_idx" ON "portal_audit_events"("event_type");

-- CreateIndex
CREATE INDEX "portal_audit_events_user_id_idx" ON "portal_audit_events"("user_id");

-- CreateIndex
CREATE INDEX "portal_audit_events_occurred_at_idx" ON "portal_audit_events"("occurred_at");

-- AddForeignKey
ALTER TABLE "portal_menus" ADD CONSTRAINT "portal_menus_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "portal_domains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

