PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`holderName` text NOT NULL,
	`accountNumber` text NOT NULL,
	`icon` text DEFAULT 'wallet' NOT NULL,
	`color` integer NOT NULL,
	`isDefault` integer DEFAULT false NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`balance` real DEFAULT 0 NOT NULL,
	`income` real DEFAULT 0 NOT NULL,
	`expense` real DEFAULT 0 NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_accounts`("id", "name", "holderName", "accountNumber", "icon", "color", "isDefault", "currency", "balance", "income", "expense") SELECT "id", "name", "holderName", "accountNumber", "icon", "color", "isDefault", "currency", "balance", "income", "expense" FROM `accounts`;--> statement-breakpoint
DROP TABLE `accounts`;--> statement-breakpoint
ALTER TABLE `__new_accounts` RENAME TO `accounts`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`icon` text DEFAULT 'grid' NOT NULL,
	`color` integer NOT NULL,
	`type` text DEFAULT 'DR' NOT NULL,
	`budget` real DEFAULT 0 NOT NULL,
	`expense` real DEFAULT 0 NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_categories`("id", "name", "icon", "color", "type", "budget", "expense") SELECT "id", "name", "icon", "color", "type", "budget", "expense" FROM `categories`;--> statement-breakpoint
DROP TABLE `categories`;--> statement-breakpoint
ALTER TABLE `__new_categories` RENAME TO `categories`;