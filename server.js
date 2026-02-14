const { app, connectDB } = require('./server/index');

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/vkinfotech';

const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`\n🚀 VK INFOTECH Server running on port ${PORT}`);
            console.log(`   Address: http://0.0.0.0:${PORT}`);
            console.log(`   API Health: http://0.0.0.0:${PORT}/api/health`);
            // Hide password in logs if present
            const safeMongoUri = MONGO_URI.replace(/:([^:@]+)@/, ':****@');
            console.log(`   MongoDB URI: ${safeMongoUri}`);
        });
    } catch (err) {
        console.error("❌ Failed to start server:", err);
        process.exit(1);
    }
};

startServer();
