CREATE TABLE `accountBalances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accountCode` varchar(50),
	`accountName` varchar(255),
	`debitMovement` int NOT NULL DEFAULT 0,
	`creditMovement` int NOT NULL DEFAULT 0,
	`debitBalance` int NOT NULL DEFAULT 0,
	`creditBalance` int NOT NULL DEFAULT 0,
	`importDate` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accountBalances_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customerBalances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerCode` varchar(50) NOT NULL,
	`customerName` varchar(255) NOT NULL,
	`previousBalance` int NOT NULL DEFAULT 0,
	`debit` int NOT NULL DEFAULT 0,
	`credit` int NOT NULL DEFAULT 0,
	`currentBalance` int NOT NULL DEFAULT 0,
	`phone` varchar(50),
	`importDate` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customerBalances_id` PRIMARY KEY(`id`)
);
