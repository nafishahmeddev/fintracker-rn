ALTER TABLE `accounts` ADD `currency` text DEFAULT 'USD' NOT NULL;--> statement-breakpoint
ALTER TABLE `categories` ADD `type` text DEFAULT 'DR' NOT NULL;