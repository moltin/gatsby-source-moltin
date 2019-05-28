const { MoltinClient } = require('@moltin/request')
const { createRemoteFileNode } = require('gatsby-source-filesystem')

exports.sourceNodes = async (
  { actions, createContentDigest },
  { client_id }
) => {
  const { createNode } = actions

  const moltin = new MoltinClient({ client_id })

  const processProduct = ({
    product,
    main_images,
    categories,
    collections,
    files
  }) => {
    const nodeContent = JSON.stringify(product)

    let categoriesArray
    let collectionsArray
    let filesArray
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

      if (product.relationships.files) {
        filesArray = product.relationships.files.data.map(relationship => {
          const file = files.find(file => file.id === relationship.id)
          if (file) {
            return {
              id: file.id,
              href: file.link.href
            }
          }
        })
      }
    }

    const nodeData = {
      ...product,
      id: product.id,
      categories: categoriesArray,
      collections: collectionsArray,
      files: filesArray,
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
    included: { main_images = {}, files = [] } = {}
  } = await moltin.get('products?include=main_image,files')

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
    collections,
    files
  }) => {
    products.forEach(async product =>
      createNode(
        await processProduct({
          product,
          main_images,
          categories,
          collections,
          files
        })
      )
    )
  }

  await createProducts({
    products,
    main_images,
    categories,
    collections,
    files
  })
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

  if (node.internal.type === `MoltinProduct` && node.files) {
    const getFileNodes = async () => {
      const fileIds = []
      let imageNodes = node.files

      if (node.mainImageHref) {
        imageNodes = imageNodes.filter(
          fileNode => node.mainImageHref !== fileNode.href
        )
      }

      const imageFetchingPromises = imageNodes.map(async fileNode => {
        let imageNode

        try {
          imageNode = await createRemoteFileNode({
            url: fileNode.href,
            store,
            cache,
            createNode,
            createNodeId
          })
        } catch (e) {
          console.error('gatsby-source-moltin: ERROR', e)
        }

        fileIds.push(imageNode.id)
      })

      await Promise.all(imageFetchingPromises)

      return fileIds
    }

    node.images___NODE = await getFileNodes()
  }

  if (
    [`MoltinCategory`, `MoltinCollection`].includes(node.internal.type) &&
    node.relationships &&
    node.relationships.products
  ) {
    const getProductNodes = async () => {
      const productIds = node.relationships.products.data.map(
        product => product.id
      )

      let productNodes = []

      await productIds.forEach(async productId => {
        const productNode = await getNode(productId)

        if (productNode) productNodes.push(productNode.id)
      })

      return productNodes
    }

    node.products___NODE = await getProductNodes()
  }
}
