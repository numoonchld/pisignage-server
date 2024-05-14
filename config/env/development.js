module.exports = {
    env: 'development',
    https: false,
    port: process.env.PORT || 3000,
    mongo: {
        uri: process.env.MONGOLAB_URI ||
            'mongodb://127.0.0.1:27017/pisignage-server-dev'
    }
};