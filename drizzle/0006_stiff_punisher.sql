CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`agreement_id` text NOT NULL,
	`ledger_id` text,
	`amount` integer NOT NULL,
	`payment_method` text DEFAULT 'Cash' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`agreement_id`) REFERENCES `agreements`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ledger_id`) REFERENCES `ledgers`(`id`) ON UPDATE no action ON DELETE no action
);
