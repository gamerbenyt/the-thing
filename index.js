const Discord = require("discord.js");
const client = new Discord.Client();
client.db = require("quick.db");
client.request = new (require("rss-parser"))();
client.config = require("./config.js");

client.on("ready", () => {
    console.log("I'm ready!");

    // Set custom status
    client.user.setActivity("your custom status here", { type: "WATCHING" }); // You can change "WATCHING" to "PLAYING", "LISTENING", etc.

    handleUploads();
    keepAlive(); // Call the keepAlive function
});

function handleUploads() {
    if (client.db.fetch(`postedVideos`) === null) client.db.set(`postedVideos`, []);
    setInterval(() => {
        client.request.parseURL(`https://www.youtube.com/feeds/videos.xml?channel_id=${client.config.channel_id}`)
        .then(data => {
            if (client.db.fetch(`postedVideos`).includes(data.items[0].link)) return;
            else {
                client.db.set(`videoData`, data.items[0]);
                client.db.push("postedVideos", data.items[0].link);
                let parsed = client.db.fetch(`videoData`);
                let channel = client.channels.cache.get(client.config.channel);
                if (!channel) return;
                let message = client.config.messageTemplate
                    .replace(/{author}/g, parsed.author)
                    .replace(/{title}/g, Discord.Util.escapeMarkdown(parsed.title))
                    .replace(/{url}/g, parsed.link);
                channel.send(message);
            }
        });
    }, client.config.watchInterval);
}

// Keep-alive function without sending messages
function keepAlive() {
    setInterval(() => {
        // Alternatively, you can use any other API interaction like fetching guilds or channels
        client.guilds.fetch(client.config.guild_id)
            .then(guild => {
                console.log(`Fetched guild: ${guild.name}`);
            })
            .catch(console.error);
    }, 24 * 60 * 60 * 1000); // Every 24 hours
}

client.login(process.etc.secrets.env.DISCORD_BOT_TOKEN);
