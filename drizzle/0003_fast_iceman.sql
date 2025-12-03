CREATE TABLE `eventLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventName` varchar(255) NOT NULL,
	`eventPayload` text NOT NULL,
	`status` enum('pending','success','failed','retrying') NOT NULL DEFAULT 'pending',
	`error` text,
	`retryCount` int NOT NULL DEFAULT 0,
	`maxRetries` int NOT NULL DEFAULT 3,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastAttemptAt` timestamp,
	CONSTRAINT `eventLogs_id` PRIMARY KEY(`id`)
);
