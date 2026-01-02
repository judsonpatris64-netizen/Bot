require('dotenv').config();
const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const cron = require('node-cron');
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bot is running!'); 
});

app.listen(port, () => {
  console.log(`Web server listening on port ${port}`);
});

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const CHANNEL_ID = '1375761892005384213'; 
const OPEN_HOUR = 7;    
const CLOSE_HOUR = 24;  

const NAME_OPEN = '🟢-ร้านเปิดเเล้ว';
const NAME_CLOSE = '🔴-ร้านปิด-เปิดตอน7โมง';

client.once('ready', () => {
    console.log(`ล็อกอินแล้วในชื่อ ${client.user.tag}!`);

    updateShopSystem();

    const cronCloseHour = CLOSE_HOUR === 24 ? 0 : CLOSE_HOUR;
    cron.schedule(`0 ${cronCloseHour} * * *`, () => updateShopSystem(), {
        scheduled: true,
        timezone: "Asia/Bangkok" 
    });
});

async function updateShopSystem() {
    let currentHour = parseInt(new Date().toLocaleString("en-US", { 
        timeZone: "Asia/Bangkok", 
        hour: "numeric", 
        hour12: false 
    }));

    if (currentHour === 24) currentHour = 0;

    const channel = client.channels.cache.get(CHANNEL_ID);
    if (!channel) {
        console.log('❌ หาห้องไม่เจอ!');
        return;
    }

    const isOpen = currentHour >= OPEN_HOUR && currentHour < CLOSE_HOUR;

    if (isOpen) {
        console.log(`[เวลาไทย ${currentHour}:00] สถานะ: 🟢-ร้านเปิดเเล้ว`);
        if (channel.name !== NAME_OPEN) await channel.setName(NAME_OPEN).catch(console.error);
        
        client.user.setPresence({
            activities: [{ name: 'ร้านเปิดแล้วครับ ☀️', type: ActivityType.Playing }],
            status: 'online',
        });
    } else {
        console.log(`[เวลาไทย ${currentHour}:00] สถานะ: 🔴-ร้านปิด-เปิดตอน7โมง`);
        if (channel.name !== NAME_CLOSE) await channel.setName(NAME_CLOSE).catch(console.error);
        
        client.user.setPresence({
            activities: [{ name: 'ร้านปิดแล้ว 💤', type: ActivityType.Listening }],
            status: 'dnd',
        });
    }
}

client.on('channelCreate', async (channel) => {
    if (!channel.guild || !channel.name.toLowerCase().includes('ticket')) return;

    const stickerName = 'Hi'; 

    const sticker = channel.guild.stickers.cache.find(s => s.name === stickerName);

    if (sticker) {

        setTimeout(() => {
            if (channel.isTextBased()) { 
                channel.send({ 
                    stickers: [sticker] 
                }).catch(err => console.error('ส่งสติ๊กเกอร์ไม่ผ่าน:', err));
            }
        }, 2000);
    } else {
        console.log(`❌ หาสติ๊กเกอร์ชื่อ "${stickerName}" ไม่เจอ ตรวจสอบชื่อให้เป๊ะนะครับ`);
    }
});

client.login(process.env.DISCORD_TOKEN);