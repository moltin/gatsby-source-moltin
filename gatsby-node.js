const { createClient } = require('@moltin/request')
const { createRemoteFileNode } = require('gatsby-source-filesystem')

exports.sourceNodes = async (
  { actions, createContentDigest },
  { client_id }
) => {
  const { createNode } = actions

  const moltin = new createClient({ client_id })

  const processProduct = ({ product, main_images, categories }) => {
    const nodeContent = JSON.stringify(product)

    let categoriesArray
    let mainImage

    if (product.relationships.main_image) {
      const {
        id,
        links,
        type,
        link: { href },
        ...rest
      } = main_images.find(
        main_image => main_image.id === product.relationships.main_image.data.id
      )

      mainImage = { href, ...rest }
    }

    if (product.relationships.categories) {
      categoriesArray = product.relationships.categories.data.map(
        relationship => {
          const category = categories.find(
            category => category.id === relationship.id
          )

          if (category) {
            return {
              ...category
            }
          }
        }
      )
    }

    const nodeData = {
      ...product,
      id: product.id,
      categories: categoriesArray,
      mainImage,
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

  const processCategory = ({ category }) => {
    const nodeContent = JSON.stringify(category)

    const nodeData = {
      ...category,
      id: category.id,
      parent: null,
      children: [],
      internal: {
        type: `MoltinCategory`,
        content: nodeContent,
        contentDigest: createContentDigest(category)
      }
    }

    return nodeData
  }

  const { data: categories } = await moltin.get('categories')
  const {
    data: products,
    included: { main_images }
  } = await moltin.get('products?include=main_image')

  categories.forEach(async category =>
    createNode(await processCategory({ category }))
  )
  products.forEach(async product =>
    createNode(await processProduct({ product, main_images, categories }))
  )
}

exports.onCreateNode = async ({
  node,
  actions,
  store,
  cache,
  createNodeId
}) => {
  const { createNodeField, createNode } = actions

  if (node.internal.type === `MoltinProduct` && node.mainImage) {
    const mainImageNode = await createRemoteFileNode({
      url: node.mainImage.href,
      store,
      cache,
      createNode,
      createNodeId
    })

    if (mainImageNode) {
      createNodeField({
        node,
        name: `linkToMainImage___NODE`,
        value: mainImageNode.id
      })
    }
  }
}
