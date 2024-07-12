const { EmbedBuilder } = require('@discordjs/builders')
const {SlashCommandBuilder} =require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
    .setName(`ping`)
    .setDescription(`This is a global (ping) Command!`),
    async execute(interaction, client){
        const embed = new EmbedBuilder()
        .setTitle('Ping!')
        .setDescription('Pong!')
        interaction.reply({ embeds: [embed] });
    }
}