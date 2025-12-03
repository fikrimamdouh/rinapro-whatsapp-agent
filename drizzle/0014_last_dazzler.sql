ALTER TABLE `customers` ADD `openingDebitBalance` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `openingCreditBalance` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `debitMovement` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `creditMovement` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `closingDebitBalance` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `closingCreditBalance` int DEFAULT 0 NOT NULL;