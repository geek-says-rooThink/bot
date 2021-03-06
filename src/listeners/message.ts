import { FireMember } from "../../lib/extensions/guildmember";
import { FireMessage } from "../../lib/extensions/message";
import { Listener } from "../../lib/util/listener";
import { PrefixSupplier } from "discord-akairo";
import Filters from "../modules/filters";
import MCLogs from "../modules/mclogs";
import Sk1er from "../modules/sk1er";
import * as centra from "centra";

const zwsRegex = /[\u200B-\u200D\uFEFF]/gim;
const symbolRegex = /<|>|\`|\*|~|#|!|"|\(|\)|\[|]|\{|\}|;|\'|/gim;
const protocolRegex = /\w{1,10}:\/\//gim;
export default class Message extends Listener {
  tokenRegex: RegExp;

  constructor() {
    super("message", {
      emitter: "client",
      event: "message",
    });
    this.tokenRegex = /[MN][A-Za-z\d]{23}\.[\w-]{6}\.[\w-]{27}/gim;
  }

  async tokenGist(message: FireMessage, foundIn: string) {
    let tokens: string[] = [];
    let exec: RegExpExecArray;
    while ((exec = this.tokenRegex.exec(foundIn)))
      if (exec) tokens.push(exec[0]);
    this.tokenRegex.lastIndex = 0;
    let files: { [key: string]: { content: string } } = {};
    for (const token of tokens)
      files[`token_leak_${+new Date()}`] = {
        // the account the gists get uploaded to is hidden from the public
        // so the content doesn't matter, it just needs the token ;)
        content: `some fuckin loser leaked their token LUL anyways here it is ${token}`,
      };
    const body = {
      description: `Tokens found in ${message.guild} sent by ${message.author}`,
      public: true, // not really since account hidden but sure
      files,
    };
    try {
      const gist = await (
        await centra("https://api.github.com/gists", "POST")
          .header("User-Agent", "Fire Discord Bot")
          .header("Authorization", `token ${process.env.GITHUB_TOKENS_TOKEN}`)
          .body(body, "json")
          .send()
      ).json();
      this.client.console.warn(
        `[Listener] Created gist with ${tokens.length} tokens for user${
          tokens.length > 1 ? "s" : ""
        } ${tokens
          .map((token) =>
            Buffer.from(token.split(".")[0], "base64").toString("ascii")
          )
          .join(", ")} found in ${message.guild.name} sent by ${
          message.author
        }. Waiting 10 seconds to delete gist...`
      );
      await this.client.util.sleep(10000);
      await centra(`https://api.github.com/gists/${gist.id}`, "DELETE")
        .header("User-Agent", "Fire Discord Bot")
        .header("Authorization", `token ${process.env.GITHUB_TOKENS_TOKEN}`)
        .send();
    } catch (e) {
      this.client.console.error(
        `[Listener] Failed to create/delete tokens gist\n${e.stack}`
      );
    }
  }

  async exec(message: FireMessage) {
    if (this.client.manager.id != 0 && !message.guild) return;

    if (message.type == "PINS_ADD")
      this.client.emit("channelPinsAdd", message.reference, message.member);

    const sk1erModule = this.client.getModule("sk1er") as Sk1er;
    const mcLogsModule = this.client.getModule("mclogs") as MCLogs;
    // These won't run if the modules aren't loaded
    await mcLogsModule?.checkLogs(message).catch(() => {});
    await sk1erModule?.checkBotStatus(message).catch(() => {});

    // Ensures people get dehoisted/decancered even if
    // Fire missed them joining/changing name
    if (message.member) {
      // This will check permissions & whether
      // dehoist/decancer is enabled so no need for checks here
      message.member.dehoistAndDecancer();
    }

    if (
      message.member &&
      (message.content.includes("@everyone") ||
        message.content.includes("@here")) &&
      message.guild.settings.get("mod.antieveryone", false) &&
      !message.member.hasPermission("MENTION_EVERYONE")
    )
      await message.delete().catch(() => {});

    let toSearch =
      message.content +
      message.embeds.map((embed) => JSON.stringify(embed)).join(" ");
    if (this.tokenRegex.test(toSearch) && process.env.GITHUB_TOKENS_TOKEN) {
      this.tokenRegex.lastIndex = 0;
      await this.tokenGist(message, toSearch);
    }

    if (
      message.channel.id == "600070909365059584" &&
      message.embeds[0]?.title.includes("new commit") &&
      !message.flags.has("CROSSPOSTED")
    ) {
      try {
        await message.crosspost();
      } catch {}
    }

    if (!message.member || message.author.bot) return;

    const autoroleId = message.guild.settings.get("mod.autorole", null);
    const delay = message.guild.settings.get("mod.autorole.waitformsg", false);
    if (autoroleId && delay) {
      const role = message.guild.roles.cache.get(autoroleId);
      if (role && !message.member.roles.cache.has(role.id))
        await message.member.roles.add(role).catch(() => {});
    }

    const filters = this.client.getModule("filters") as Filters;
    await filters?.runAll(message, this.cleanContent(message)).catch(() => {});

    if (
      message.content.trim() ==
      (message.guild.me as FireMember).toMention().trim()
    )
      await message
        .send(
          "HELLO_PREFIX",
          message.guild ? message.guild.settings.get("main.prefix", "$") : "$"
        )
        .catch(() => {});
  }

  cleanContent(message: FireMessage) {
    return message.content
      .replace(/\\:/gim, ":")
      .replace(/\\\./gim, ".")
      .replace(zwsRegex, "")
      .replace(/\(\.\)/gim, ".")
      .replace(/\.\//gim, "/")
      .replace(/dot/gim, ".")
      .replace(/\/\./gim, ".")
      .replace(protocolRegex, "")
      .replace(symbolRegex, "")
      .replace(/\\\/\//gim, "/")
      .replace(/\s/gim, "");
  }
}
