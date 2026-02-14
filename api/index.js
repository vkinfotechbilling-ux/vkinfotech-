const { app, connectDB } = require('../server/index.js');

module.exports = async (req, res) => {
    // Ensure DB is connected before handling request
    await connectDB();

    // Vercel serverless function signature match
    return app(req, res);
};
