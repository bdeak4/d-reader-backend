import { Injectable } from '@nestjs/common';
import { Comic, ComicIssue, Creator } from '@prisma/client';
import config from '../configs/config';
import { CREATOR_REGISTERED } from './templates/creatorRegistered';
import { CREATOR_FILES_UPDATED } from './templates/creatorFilesUpdated';
import { MessagePayload, WebhookClient } from 'discord.js';
import { CreatorFile } from './dto/types';
import { CREATOR_PROFILE_UPDATED } from './templates/creatorProfileUpdated';
import { COMIC_UPDATED } from './templates/comicUpdated';
import { COMIC_ISSUE_UPDATED } from './templates/comicIssueUpdated';

@Injectable()
export class DiscordNotificationService {
  private readonly apiUrl: string;
  private readonly websiteUrl: string;
  private readonly payload: MessagePayload;
  private readonly discord?: WebhookClient;

  constructor() {
    const clientConfig = config().client;
    this.apiUrl = clientConfig.dPublisherUrl;
    this.websiteUrl = clientConfig.dReaderUrl;

    if (!process.env.DISCORD_WEBHOOK_URL) {
      console.warn('DISCORD_WEBHOOK_URL is undefined');
      return;
    }

    this.discord = new WebhookClient({ url: process.env.DISCORD_WEBHOOK_URL });
    this.payload = new MessagePayload(
      this.discord.client,
      this.discord.options,
    );
  }

  async notifyCreatorRegistration(creator: Creator) {
    try {
      await this.discord?.send(
        CREATOR_REGISTERED(creator, this.apiUrl, this.payload),
      );
    } catch (e) {
      console.error('Error sending notification for creator registration', e);
    }
  }

  async notifyCreatorFilesUpdate(name: string, files: CreatorFile[]) {
    try {
      await this.discord?.send(
        CREATOR_FILES_UPDATED(name, this.payload, files),
      );
    } catch (e) {
      console.error('Error sending notification for creator file updates', e);
    }
  }

  async notifyCreatorEmailVerification(creator: Creator) {
    try {
      await this.discord?.send(
        `Creator ${creator.name} (${creator.email}) has verified their email address!`,
      );
    } catch (e) {
      console.error(
        "Error sending notification for creator's email verification",
        e,
      );
    }
  }

  async notifyCreatorProfileUpdate({
    oldCreator,
    updatedCreator,
  }: {
    oldCreator: Creator;
    updatedCreator: Creator;
  }) {
    try {
      await this.discord?.send(
        CREATOR_PROFILE_UPDATED({
          oldData: oldCreator,
          updatedData: updatedCreator,
          websiteUrl: this.websiteUrl,
          payload: this.payload,
        }),
      );
    } catch (e) {
      console.error(
        "Error sending notification for creator's profile update",
        e,
      );
    }
  }

  async notifyComicUpdated({
    oldComic,
    updatedComic,
  }: {
    oldComic: Comic;
    updatedComic: Comic;
  }) {
    try {
      await this.discord?.send(
        COMIC_UPDATED({
          oldData: oldComic,
          updatedData: updatedComic,
          websiteUrl: this.websiteUrl,
          payload: this.payload,
        }),
      );
    } catch (e) {
      console.error('Error sending notification for comic updated', e);
    }
  }

  async notifyComicIssueUpdated({
    oldIssue,
    updatedIssue,
  }: {
    oldIssue: ComicIssue;
    updatedIssue: ComicIssue;
  }) {
    try {
      await this.discord?.send(
        COMIC_ISSUE_UPDATED({
          oldData: oldIssue,
          updatedData: updatedIssue,
          websiteUrl: this.websiteUrl,
          payload: this.payload,
        }),
      );
    } catch (e) {
      console.error('Error sending notification for comic updated', e);
    }
  }
}
