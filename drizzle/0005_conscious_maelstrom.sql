CREATE TABLE `whatsappStats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`messagesSent` int NOT NULL DEFAULT 0,
	`messagesReceived` int NOT NULL DEFAULT 0,
	`messagesFailed` int NOT NULL DEFAULT 0,
	`successRate` int NOT NULL DEFAULT 0,
	`avgResponseTime` int NOT NULL DEFAULT 0,
	`activeGroups` int NOT NULL DEFAULT 0,
	`lastActivity` varchar(500),
	`lastActivityTime` timestamp,
	`lastActivityType` enum('sent','received','failed'),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `whatsappStats_id` PRIMARY KEY(`id`)
);
