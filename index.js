const Discord = require("discord.js");
const SteamAPI = require("steamapi");
require('dotenv').config();
const { discordToken, steamToken, verificationChannel, verifiedRole } =
  process.env;
const client = new Discord.Client({
  intents: [
    Discord.GatewayIntentBits.MessageContent,
    Discord.GatewayIntentBits.GuildMessages,
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildMembers,
  ],
});
const Steam = new SteamAPI(steamToken);

client.once(Discord.Events.ClientReady, (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}!`);
});

client.on(Discord.Events.MessageCreate, (message) => {
  if (message.channel.id != verificationChannel) return;
  if (message.author.bot) return;
  message.guild.members.fetch(message.author.id).then((member) => {
    if (member.roles.cache.has(verifiedRole)) {
      message.delete();
      return;
    }
    Steam.resolve(message.content)
      .then((id) => {
        setTimeout(() => {
          if (message.embeds.length == 0) {
            message.reply(
              "Epic embed fail?? Make sure the link embeds so I can see your profile description.",
            );
            return;
          } else if (
            message.embeds[0].description != null &&
            message.embeds[0].description.includes(message.author.id)
          ) {
            message.reply(
              "You need to add your Discord user ID to your Steam profile summary and try again so I can be sure this account is yours!",
            );
            return;
          } else {
            Steam.getUserOwnedGames(id, true)
              .then((ownedGames) => {
                let appIDs = [];
                ownedGames.forEach((game) => {
                  appIDs.push(game.appID);
                });
                if (appIDs.includes(2231450)) {
                  message.guild.members
                    .fetch(message.author.id)
                    .then((member) => {
                      member.roles.add(verifiedRole);
                    });
                  message.reply("You've been verified!");
                } else {
                  message.reply(
                    "It looks like you don't own Pizza Tower on Steam... If you do, please contact an admin.",
                  );
                }
              })
              .catch(() => {
                message.reply(
                  "I can't access your Steam games list. You probably made it private, check your profile settings!",
                );
                return;
              });
          }
        }, 2000);
      })
      .catch(() => {
        message.delete();
      });
  });
});

client.login(discordToken);
