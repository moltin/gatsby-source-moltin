const { createClient } = require('@moltin/request')
const { createRemoteFileNode } = require('gatsby-source-filesystem')

exports.sourceNodes = async (
  { actions, createContentDigest },
  { client_id }
) => {
  const { createNode } = actions

  const moltin = new createClient({ client_id })

  const processProduct = ({
    product,
    main_images,
    categories,
    collections
  }) => {
    const nodeContent = JSON.stringify(product)

    let categoriesArray
    let collectionsArray
    let mainImageHref

    if (product.relationships) {
      if (product.relationships.main_image) {
        const {
          link: { href }
        } = main_images.find(
          main_image =>
            main_image.id === product.relationships.main_image.data.id
        )

        mainImageHref = href
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

      if (product.relationships.collections) {
        collectionsArray = product.relationships.collections.data.map(
          relationship => {
            const collection = collections.find(
              collection => collection.id === relationship.id
            )

            if (collection) {
              return {
                ...collection
              }
            }
          }
        )
      }
    }

    const nodeData = {
      ...product,
      id: product.id,
      categories: categoriesArray,
      collections: collectionsArray,
      mainImageHref,
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

  const processCollection = ({ collection }) => {
    const nodeContent = JSON.stringify(collection)

    const nodeData = {
      ...collection,
      id: collection.id,
      parent: null,
      children: [],
      internal: {
        type: `MoltinCollection`,
        content: nodeContent,
        contentDigest: createContentDigest(collection)
      }
    }

    return nodeData
  }

  const { data: categories } = await moltin.get('categories')
  const { data: collections } = await moltin.get('collections')
  const {
    data: products,
    included: { main_images }
  } = await moltin.get('products?include=main_image')

  const createCategories = async ({ categories }) => {
    categories.forEach(async category =>
      createNode(await processCategory({ category }))
    )
  }

  const createCollections = async ({ collections }) => {
    collections.forEach(async collection =>
      createNode(await processCollection({ collection }))
    )
  }

  const createProducts = async ({
    products,
    main_images,
    categories,
    collections
  }) => {
    products.forEach(async product =>
      createNode(
        await processProduct({ product, main_images, categories, collections })
      )
    )
  }

  await createProducts({ products, main_images, categories, collections })
  await createCollections({ collections })
  await createCategories({ categories })
}

exports.onCreateNode = async ({
  node,
  actions,
  store,
  cache,
  createNodeId,
  getNode
}) => {
  const { createNode } = actions

  if (node.internal.type === `MoltinProduct` && node.mainImageHref) {
    let mainImageNode

    try {
      mainImageNode = await createRemoteFileNode({
        url: node.mainImageHref,
        store,
        cache,
        createNode,
        createNodeId
      })
    } catch (e) {
      console.error('gatsby-source-moltin: ERROR', e)
    }

    if (mainImageNode) {
      node.mainImage___NODE = mainImageNode.id
    }
  }

  if (
    [`MoltinCategory`, `MoltinCollection`].includes(node.internal.type) &&
    node.relationships &&
    node.relationships.products
  ) {
    node.products___NODE = await Promise.all(
      node.relationships.products.data.map(async ({ id }) => {
        const { id: productNode } = await getNode(id)

        return productNode
      })
    )
  }
}
