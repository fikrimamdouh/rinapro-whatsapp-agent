ALTER TABLE `accountBalances` ADD `openingDebitBalance` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `accountBalances` ADD `openingCreditBalance` int DEFAULT 0 NOT NULL;