CREATE TABLE "group_members" (
	"group_id" text NOT NULL,
	"member_id" text NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "group_members_group_id_member_id_pk" PRIMARY KEY("group_id","member_id"),
	CONSTRAINT "group_members_group_id_position_unique" UNIQUE("group_id","position")
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "group_members_member_id_idx" ON "group_members" USING btree ("member_id");