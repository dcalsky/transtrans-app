CREATE TABLE `post_tag_mapping` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`postId` integer NOT NULL,
	`text` text NOT NULL,
	FOREIGN KEY (`postId`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`textContent` text NOT NULL,
	`audios` text DEFAULT '[]' NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL
);
