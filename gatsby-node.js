const { createClient } = require('@moltin/request')

exports.sourceNodes = async (
  { actions, createNodeId, createContentDigest },
  { client_id }
) => {
  const { createNode } = actions

  const moltin = new createClient({ client_id })

  const processProduct = product => {
    const nodeId = createNodeId(`moltin-product-${product.id}`)
    const nodeContent = JSON.stringify(product)
    const nodeData = Object.assign({}, product, {
      id: nodeId,
      parent: null,
      children: [],
      internal: {
        type: `MoltinProduct`,
        content: nodeContent,
        contentDigest: createContentDigest(product)
      }
    })

    return nodeData
  }

  const { data: products } = await moltin.get('products')

  return products.forEach(product => createNode(processProduct(product)))
}
