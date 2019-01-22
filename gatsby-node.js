const { createClient } = require('@moltin/request')

exports.sourceNodes = async ({ actions }, { client_id }) => {
  const { createNode } = actions

  const moltin = new createClient({ client_id })

  moltin
    .get('products')
    .then(console.log)
    .catch(console.error)

  return
}
