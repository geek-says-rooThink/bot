import { FireMember } from "../../../lib/extensions/guildmember";
import { FireMessage } from "../../../lib/extensions/message";
import { Language } from "../../../lib/util/language";
import { Command } from "../../../lib/util/command";
import { TextChannel, Role } from "discord.js";

export default class Block extends Command {
  constructor() {
    super("block", {
      description: (language: Language) =>
        language.get("BLOCK_COMMAND_DESCRIPTION"),
      enableSlashCommand: true,
      args: [
        {
          id: "toblock",
          type: "member|role",
          required: true,
          default: null,
        },
        {
          id: "reason",
          type: "string",
          required: false,
          default: null,
          match: "rest",
        },
      ],
      restrictTo: "guild",
      moderatorOnly: true,
    });
  }

  async exec(
    message: FireMessage,
    args: { toblock: FireMember | Role; reason?: string }
  ) {
    if (!args.toblock) return await message.error("BLOCK_ARG_REQUIRED");
    else if (
      args.toblock instanceof FireMember &&
      args.toblock.isModerator(message.channel)
    )
      return await message.error("MODERATOR_ACTION_DISALLOWED");
    await message.delete().catch(() => {});
    const blocked = await message.guild.block(
      args.toblock,
      args.reason?.trim() ||
        (message.guild.language.get(
          "MODERATOR_ACTION_DEFAULT_REASON"
        ) as string),
      message.member,
      message.channel as TextChannel
    );
    if (blocked == "forbidden")
      return await message.error("COMMAND_MODERATOR_ONLY");
    else if (typeof blocked == "string")
      return await message.error(`BLOCK_FAILED_${blocked.toUpperCase()}`);
  }
}
