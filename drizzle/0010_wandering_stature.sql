CREATE TABLE `user_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`whatsappNumber` varchar(50) NOT NULL,
	`voiceReply` boolean NOT NULL DEFAULT false,
	`language` varchar(10) NOT NULL DEFAULT 'ar',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_preferences_whatsappNumber_unique` UNIQUE(`whatsappNumber`)
);
--> statement-breakpoint
ALTER TABLE `accountBalances` ADD `openingDebitBalance` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `accountBalances` ADD `openingCreditBalance` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `customerId` varchar(50);--> statement-breakpoint
ALTER TABLE `customers` ADD `previousBalance` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `debit` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `credit` int DEFAULT 0 NOT NULL;