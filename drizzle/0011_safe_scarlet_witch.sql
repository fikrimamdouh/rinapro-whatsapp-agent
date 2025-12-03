DROP TABLE `user_preferences`;--> statement-breakpoint
ALTER TABLE `accountBalances` DROP COLUMN `openingDebitBalance`;--> statement-breakpoint
ALTER TABLE `accountBalances` DROP COLUMN `openingCreditBalance`;--> statement-breakpoint
ALTER TABLE `customers` DROP COLUMN `customerId`;--> statement-breakpoint
ALTER TABLE `customers` DROP COLUMN `previousBalance`;--> statement-breakpoint
ALTER TABLE `customers` DROP COLUMN `debit`;--> statement-breakpoint
ALTER TABLE `customers` DROP COLUMN `credit`;