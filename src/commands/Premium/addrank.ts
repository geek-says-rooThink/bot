import { FireMessage } from "../../../lib/extensions/message";
import { Language } from "../../../lib/util/language";
import { Command } from "../../../lib/util/command";
import { Role } from "discord.js";

export default class AddRank extends Command {
  constructor() {
    super("addrank", {
      description: (language: Language) =>
        language.get("ADDRANK_COMMAND_DESCRIPTION"),
      clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS", "MANAGE_ROLES"],
      userPermissions: ["MANAGE_ROLES"],
      restrictTo: "guild",
      args: [
        {
          id: "role",
          type: "role",
          default: null,
          required: true,
        },
      ],
      aliases: ["addselfrole", "addjoinrole", "addjoinablerole", "addselfrank"],
    });
  }

  async exec(message: FireMessage, args: { role?: Role }) {
    if (!args.role) return;
    if (
      args.role.position > (message.guild.me?.roles.highest.position || 0) ||
      args.role.managed
    )
      return await message.error("ERROR_ROLE_UNUSABLE");

    let current = message.guild.settings.get("utils.ranks", []) as string[];
    if (current.includes(args.role.id))
      return await message.error("RANKS_ALREADY_ADDED");
    else {
      current.push(args.role.id);
      message.guild.settings.set("utils.ranks", current);
      return await message.success();
    }
  }
}