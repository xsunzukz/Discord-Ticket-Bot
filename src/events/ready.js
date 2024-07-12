const mongoose = require('mongoose');
module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`✅Bot is Online: ${client.user.username}`);
        try{
            mongoose.set("strictQuery", false);
                await mongoose.connect(process.env.MDB_URL);
                console.log("✅ Connected to DB.");
            }catch(err){
                console.log(`❌MongoDB connection error.`);
            }
        }
};