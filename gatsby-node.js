const { createClient } = require('@moltin/request')
const { createRemoteFileNode } = require('gatsby-source-filesystem')

exports.sourceNodes = async (
  { actions, createNodeId, createContentDigest },
  { client_id }
) => {
  const { createNode } = actions

  const moltin = new createClient({ client_id })

  const processProduct = ({ product, main_images }) => {
    const nodeId = createNodeId(`moltin-product-${product.id}`)
    const nodeContent = JSON.stringify(product)

    let mainImageHref

    if (product.relationships.main_image) {
      const {
        link: { href }
      } = main_images.find(
        main_image => main_image.id === product.relationships.main_image.data.id
      )

      mainImageHref = href
    }

    const nodeData = {
      ...product,
      mainImageHref,
      id: nodeId,
      parent: null,
      children: [],
      internal: {
        type: `MoltinProduct`,
        content: nodeContent,
        contentDigest: createContentDigest(product)
      }
    }

    return nodeData
  }

  const {
    data: products,
    included: { main_images }
  } = await moltin.get('products?include=main_image')

  return products.forEach(async product =>
    createNode(await processProduct({ product, main_images }))
  )
}

exports.onCreateNode = async ({
  node,
  actions,
  store,
  cache,
  createNodeId
}) => {
  const { createNode } = actions

  if (node.internal.type === `MoltinProduct` && node.mainImageHref) {
    const mainImageNode = await createRemoteFileNode({
      url: node.mainImageHref,
      store,
      cache,
      createNode,
      createNodeId
    })

    if (mainImageNode) {
      node.mainImage___NODE = mainImageNode.id
    }
  }
}
