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
