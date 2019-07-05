require(`dotenv`).config()

module.exports = {
  plugins: [
    {
      resolve: `@moltin/gatsby-source-moltin`,
      options: {
        client_id: process.env.MOLTIN_CLIENT_ID
      }
    }
  ]
}
