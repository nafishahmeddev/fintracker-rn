CREATE TABLE `accounts` (
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
CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`icon` text DEFAULT 'grid' NOT NULL,
	`color` integer NOT NULL,
	`type` text DEFAULT 'DR' NOT NULL,
	`budget` real DEFAULT 0 NOT NULL,
	`expense` real DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`account_id` integer NOT NULL,
	`category_id` integer NOT NULL,
	`amount` real NOT NULL,
	`type` text NOT NULL,
	`datetime` text NOT NULL,
	`note` text NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
