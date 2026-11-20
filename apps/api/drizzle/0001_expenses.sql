CREATE TABLE "expense_shares" (
	"expense_id" text NOT NULL,
	"member_id" text NOT NULL,
	"amount" bigint NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "expense_shares_expense_id_member_id_pk" PRIMARY KEY("expense_id","member_id")
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" text PRIMARY KEY NOT NULL,
	"group_id" text NOT NULL,
	"description" text NOT NULL,
	"total" bigint NOT NULL,
	"payer_id" text NOT NULL,
	"paid_at" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "expense_shares" ADD CONSTRAINT "expense_shares_expense_id_expenses_id_fk" FOREIGN KEY ("expense_id") REFERENCES "public"."expenses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "expenses_group_order_idx" ON "expenses" USING btree ("group_id","paid_at" DESC NULLS LAST,"created_at" DESC NULLS LAST,"id" DESC NULLS LAST);