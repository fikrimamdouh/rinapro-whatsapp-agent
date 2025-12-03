ALTER TABLE `customers` ADD `customerId` varchar(50);--> statement-breakpoint
ALTER TABLE `customers` ADD `previousBalance` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `debit` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `credit` int DEFAULT 0 NOT NULL;