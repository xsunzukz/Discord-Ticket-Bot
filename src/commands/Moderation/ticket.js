const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ActionRowBuilder, StringSelectMenuBuilder, ChannelType } = require('discord.js');
const ticket = require('../../models/ticket');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Create a ticket for support')
        .addSubcommand(subcommand => 
            subcommand
                .setName('send')
                .setDescription('Send the ticket message')
                .addStringOption(option => 
                    option.setName('name')
                          .setDescription('The name for the open select menu content')
                          .setRequired(true))
                .addStringOption(option => 
                    option.setName('message')
                          .setDescription('A custom message to add to the embed!')
                          .setRequired(false))
        )
        .addSubcommand(subcommand => 
            subcommand
                .setName('setup')
                .setDescription('Setup the ticket category')
                .addChannelOption(option => 
                    option.setName('category')
                          .setDescription('The category to send the tickets into')
                          .setRequired(true)
                          .addChannelTypes(ChannelType.GuildCategory))
        )
        .addSubcommand(subcommand => 
            subcommand
                .setName('remove')
                .setDescription('Remove ticket system')
        )
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
    async execute (interaction) {
        const { options } = interaction;
        const sub = options.getSubcommand();
        const data = await ticket.findOne({
            Guild: interaction.guild.id
        })
        switch (sub) {
            case 'send':
                if (!data) return await interaction.reply({
                    content: `⚠️ Ticket system is not enabled please run /ticket setup to enable it!`, ephemeral: true
                });
                const name = options.getString('name');
                var message = options.getString('message') || `👋 Hello there if there is a problem and you wanna talk to a staff please create a ticket!`;
                
                const select = new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('ticketCreateSelect')
                        .setPlaceholder(`🌟 ${name}`)
                        .setMinValues(1)
                        .addOptions({
                            label: `Create your ticket`,
                            description: `Click here to begin the ticket creation process`,
                            value: 'createTicket'
                        })
                )
                const embed = new EmbedBuilder()
                .setColor('Green')
                .setTitle('😎 Create a ticket!')
                .setDescription(message + ` 🎟️`)
                .setFooter({text: `${interaction.guild.name}`, iconURL: `${interaction.guild.iconURL()}`})
                await interaction.reply({content: `🤖 I have sent your ticket message below`, ephemeral: true});
                await interaction.channel.send({embeds: [embed], components: [select]});
                break;
            case 'setup':
                if (data) return await interaction.reply({content: `🕛 The ticket system is configured to <#${data.Category}>. \n Relax and have a coffee ☕`, ephemeral: true});
                else {
                    const category = options.getChannel('category');
                    await ticket.create({ 
                        Guild: interaction.guild.id,
                        Category: category.id
                    });
                    await interaction.reply({content: `✅ Ticket system has been setup!`, ephemeral: true});
                }
                break;
            case 'remove':
                if (!data) return await interaction.reply({content: `🤖 You don't have a ticket channel setup!`, ephemeral: true});
                else {
                    await ticket.deleteOne({ Guild: interaction.guild.id });
                    await interaction.reply({content: `✅ Ticket system has been removed!`, ephemeral: true});
                }
                break;
        }
    }
};
