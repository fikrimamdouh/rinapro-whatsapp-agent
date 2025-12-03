CREATE TABLE `connectionStatus` (
	`id` int AUTO_INCREMENT NOT NULL,
	`status` enum('connected','disconnected','connecting') NOT NULL DEFAULT 'disconnected',
	`lastConnected` timestamp,
	`sessionData` text,
	`qrCode` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `connectionStatus_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`phone` varchar(50),
	`email` varchar(320),
	`address` text,
	`city` varchar(100),
	`balance` int NOT NULL DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dailyTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transactionDate` timestamp NOT NULL,
	`type` enum('income','expense') NOT NULL,
	`category` varchar(100),
	`amount` int NOT NULL,
	`description` text,
	`reference` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dailyTransactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `installments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceId` int NOT NULL,
	`customerId` int NOT NULL,
	`amount` int NOT NULL,
	`dueDate` timestamp NOT NULL,
	`paidDate` timestamp,
	`status` enum('pending','paid','overdue') NOT NULL DEFAULT 'pending',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `installments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`itemName` varchar(255) NOT NULL,
	`itemCode` varchar(100),
	`quantity` int NOT NULL DEFAULT 0,
	`unit` varchar(50),
	`unitPrice` int NOT NULL DEFAULT 0,
	`totalValue` int NOT NULL DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventory_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventory_itemCode_unique` UNIQUE(`itemCode`)
);
--> statement-breakpoint
CREATE TABLE `inventoryTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inventoryId` int NOT NULL,
	`type` enum('in','out') NOT NULL,
	`quantity` int NOT NULL,
	`transactionDate` timestamp NOT NULL,
	`reference` varchar(255),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventoryTransactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceNumber` varchar(100) NOT NULL,
	`customerId` int NOT NULL,
	`invoiceDate` timestamp NOT NULL,
	`totalAmount` int NOT NULL,
	`paidAmount` int NOT NULL DEFAULT 0,
	`remainingAmount` int NOT NULL,
	`status` enum('paid','partial','unpaid') NOT NULL DEFAULT 'unpaid',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoices_invoiceNumber_unique` UNIQUE(`invoiceNumber`)
);
--> statement-breakpoint
CREATE TABLE `messageLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`messageFrom` varchar(100) NOT NULL,
	`messageTo` varchar(100),
	`messageType` enum('incoming','outgoing') NOT NULL,
	`messageContent` text,
	`command` varchar(100),
	`response` text,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messageLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `receipts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`receiptNumber` varchar(100) NOT NULL,
	`customerId` int,
	`supplierId` int,
	`type` enum('income','expense') NOT NULL,
	`amount` int NOT NULL,
	`receiptDate` timestamp NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `receipts_id` PRIMARY KEY(`id`),
	CONSTRAINT `receipts_receiptNumber_unique` UNIQUE(`receiptNumber`)
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`settingKey` varchar(100) NOT NULL,
	`settingValue` text,
	`description` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `settings_settingKey_unique` UNIQUE(`settingKey`)
);
--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`phone` varchar(50),
	`email` varchar(320),
	`address` text,
	`city` varchar(100),
	`balance` int NOT NULL DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `suppliers_id` PRIMARY KEY(`id`)
);
