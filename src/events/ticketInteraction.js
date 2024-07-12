const { ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle, ChannelType, EmbedBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');
const ticket = require('../models/ticket');
const { createTranscript } = require('discord-html-transcripts');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (interaction.customId === 'ticketCreateSelect') {
            const modal = new ModalBuilder()
                .setTitle('Create your ticket')
                .setCustomId('ticketModal');

            const why = new TextInputBuilder()
                .setCustomId('whyTicket')
                .setRequired(true)
                .setLabel('Please enter the reason for your ticket:')
                .setPlaceholder('Your reason')
                .setStyle(TextInputStyle.Paragraph);

            const info = new TextInputBuilder()
                .setCustomId('infoTicket')
                .setRequired(false)
                .setLabel('Provide us with any additional information!')
                .setPlaceholder('You can leave this blank')
                .setStyle(TextInputStyle.Paragraph);

            const one = new ActionRowBuilder().addComponents(why);
            const two = new ActionRowBuilder().addComponents(info);

            modal.addComponents(one, two);

            await interaction.showModal(modal);
        } else if (interaction.customId === 'ticketModal') {
            const user = interaction.user;
            const data = await ticket.findOne({ Guild: interaction.guild.id });

            if (!data) {
                return await interaction.reply({
                    content: 'Looks like the admin has disabled the ticket system! Please ask the server admins/mods about this :(',
                    ephemeral: true
                });
            }

            const why = interaction.fields.getTextInputValue('whyTicket');
            const info = interaction.fields.getTextInputValue('infoTicket');
            const category = await interaction.guild.channels.cache.get(data.Category) || 'Nothing provided.';
            
            const channel = await interaction.guild.channels.create({
                name: `ticket-${user.id}`,
                type: ChannelType.GuildText,
                topic: `Ticket for: ${user.username}; Ticket reason: ${why}`,
                parent: category,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: [PermissionsBitField.Flags.ViewChannel],
                    },
                    {
                        id: user.id,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
                    },
                ],
            });

            const embed = new EmbedBuilder()
                .setColor('Red')
                .setTitle(`Ticket from ${user.username} 🎟️`)
                .setDescription(`Opening Reason: ${why}\n\nExtra Information: ${info}\n\nTicket priority: HIGH`)
                .setTimestamp();

            const button = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('closeTicket')
                        .setLabel('⚠️ Close Ticket')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('ticketTranscript')
                        .setLabel('📜 Transcript')
                        .setStyle(ButtonStyle.Primary)
                );

            await channel.send({ embeds: [embed], components: [button] });
            await interaction.reply({ content: `Your ticket has been created! You can now send messages in the ${channel} channel.`, ephemeral: true });
        } else if (interaction.customId === 'closeTicket') {
            const closeModal = new ModalBuilder()
                .setTitle('Close Ticket')
                .setCustomId('closeTicketModal');

            const reason = new TextInputBuilder()
                .setCustomId('closeReasonTicket')
                .setRequired(true)
                .setPlaceholder('Reason for closing your ticket')
                .setLabel('Enter reason for closing')
                .setStyle(TextInputStyle.Paragraph);

            const one = new ActionRowBuilder().addComponents(reason);
            closeModal.addComponents(one);
            await interaction.showModal(closeModal);
        } else if (interaction.customId === 'closeTicketModal') {
            const channel = interaction.channel;
            const name = channel.name.replace('ticket-', '');
            const member = await interaction.guild.members.cache.get(name);

            const reason = interaction.fields.getTextInputValue('closeReasonTicket');

            await interaction.reply({ content: 'Closing this ticket...' });
            setTimeout(async () => {
                await channel.delete().catch(err => {});
                member.send(`🎟️ Your ticket in ${interaction.guild.name} has been closed. Reason: ${reason}`).catch(err => {});
            }, 5000);
        } else if (interaction.customId === 'ticketTranscript') {
            const file = await createTranscript(interaction.channel, {
                limit: -1,
                returnBuffer: false,
                filename: `${interaction.channel.name}.html`
            });

            const msg = await interaction.channel.send({ content: 'Your transcript cache:', files: [file] }).catch(err => {});
            const message = `📜 **Here is your transcript [ticket transcript](https://mahto.id/chat-exporter?url=${msg.attachments.first()?.url}) from ${interaction.guild.name}!**`;
            
            await msg.delete();
            await interaction.reply({ content: message, ephemeral: true });
        }
    }
};
