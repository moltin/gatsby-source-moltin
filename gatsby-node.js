const { MoltinClient } = require('@moltin/request')
const { createRemoteFileNode } = require('gatsby-source-filesystem')
const merge = require('deepmerge')

const { name: application } = require('./package')

exports.sourceNodes = async (
  { actions, createContentDigest },
  { client_id }
) => {
  const { createNode } = actions

  const moltin = new MoltinClient({
    client_id,
    application,
  })

  const processProduct = ({
    product,
    main_images,
    categories,
    collections,
    brands,
    files,
  }) => {
    const nodeContent = JSON.stringify(product)

    let categoriesArray
    let collectionsArray
    let brandsArray
    let filesArray
    let mainImageHref
    let parentId
    let childrenArray

    if (product.relationships) {
      if (product.relationships.main_image) {
        const image = main_images.find(
          (main_image) =>
            main_image.id === product.relationships.main_image.data.id
        )

        if (image && image.link) {
          const {
            link: { href },
          } = image

          mainImageHref = href
        }
      }

      if (product.relationships.categories) {
        categoriesArray = product.relationships.categories.data.map(
          (relationship) => {
            const category = categories.find(
              (category) => category.id === relationship.id
            )

            if (category) {
              return {
                ...category,
              }
            }
          }
        )
      }

      if (product.relationships.collections) {
        collectionsArray = product.relationships.collections.data.map(
          (relationship) => {
            const collection = collections.find(
              (collection) => collection.id === relationship.id
            )

            if (collection) {
              return {
                ...collection,
              }
            }
          }
        )
      }

      if (product.relationships.brands) {
        brandsArray = product.relationships.brands.data.map((relationship) => {
          const brand = brands.find((brand) => brand.id === relationship.id)

          if (brand) {
            return {
              ...brand,
            }
          }
        })
      }

      if (product.relationships.files) {
        filesArray = product.relationships.files.data.map((relationship) => {
          const file = files.find((file) => file.id === relationship.id)
          if (file) {
            return {
              id: file.id,
              href: file.link.href,
            }
          }
        })
      }

      if (product.relationships.parent) {
        parentId = product.relationships.parent.data.id
      }

      if (product.relationships.children) {
        childrenArray = product.relationships.children.data.map((rel) => rel.id)
      }
    }

    if (product.meta.variation_matrix) {
      const { variation_matrix } = product.meta
      product.meta.variation_matrix = JSON.stringify(variation_matrix)
    }

    const nodeData = {
      ...product,
      id: product.id,
      brands: brandsArray,
      categories: categoriesArray,
      collections: collectionsArray,
      files: filesArray,
      mainImageHref,
      parent: parentId || null,
      children: childrenArray || [],
      internal: {
        type: `MoltinProduct`,
        content: nodeContent,
        contentDigest: createContentDigest(product),
      },
    }

    return nodeData
  }

  const processCategory = ({ category }) => {
    const nodeContent = JSON.stringify(category)

    let parentId
    let childrenArray

    if (category.relationships) {
      if (category.relationships.parent) {
        parentId = category.relationships.parent.data[0].id
      }
      if (category.relationships.children) {
        childrenArray = category.relationships.children.data.map(
          (rel) => rel.id
        )
      }
    }
    const nodeData = {
      ...category,
      id: category.id,
      parent: parentId || null,
      children: childrenArray || [],
      internal: {
        type: `MoltinCategory`,
        content: nodeContent,
        contentDigest: createContentDigest(category),
      },
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
        contentDigest: createContentDigest(collection),
      },
    }

    return nodeData
  }

  const processBrand = ({ brand }) => {
    const nodeContent = JSON.stringify(brand)

    const nodeData = {
      ...brand,
      id: brand.id,
      parent: null,
      children: [],
      internal: {
        type: `MoltinBrand`,
        content: nodeContent,
        contentDigest: createContentDigest(brand),
      },
    }

    return nodeData
  }

  const getPaginatedResource = async (resource, data = {}, search = '') => {
    try {
      const response = await moltin.get(`${resource}${search}`)

      if (response.data === undefined || response.data.length === 0)
        return response

      const {
        links: { next },
      } = response

      let merged = merge(data, response)

      if (next) {
        const { search } = new URL(next)
        merged = getPaginatedResource(resource, merged, search)
      }

      return merged
    } catch (error) {
      console.error('gatsby-source-moltin: ERROR', error)
    }
  }

  const getProductsById = async (productsArray = []) => {
    let products = []
    try {
      for (const product of productsArray) {
        const response = await moltin.get(`products/${product.id}`)
        const responseProduct = response.data

        responseProduct.relationships.children = product.relationships.children
        products.push(responseProduct)
      }
    } catch (error) {
      console.error('gatsby-source-moltin: ERROR', error)
    }
    return products
  }

  const { data: brands } = await moltin.get('brands')
  const { data: categories } = await getPaginatedResource('categories')
  const { data: collections } = await getPaginatedResource('collections')
  const {
    data: productsListing,
    included: { main_images = {}, files = [] } = {},
  } = await getPaginatedResource('products', {}, `?include=main_image,files`)
  const products = await getProductsById(productsListing)

  const createCategories = async ({ categories }) => {
    categories.forEach(async (category) =>
      createNode(await processCategory({ category }))
    )
  }

  const createCollections = async ({ collections }) => {
    collections.forEach(async (collection) =>
      createNode(await processCollection({ collection }))
    )
  }

  const createBrands = async ({ brands }) => {
    brands.forEach(async (brand) => createNode(await processBrand({ brand })))
  }

  const createProducts = async ({
    products,
    main_images,
    categories,
    collections,
    brands,
    files,
  }) => {
    products.forEach(async (product) =>
      createNode(
        await processProduct({
          product,
          main_images,
          categories,
          collections,
          brands,
          files,
        })
      )
    )
  }

  await createProducts({
    products,
    main_images,
    categories,
    collections,
    brands,
    files,
  })
  await createCollections({ collections })
  await createCategories({ categories })
  await createBrands({ brands })
}

exports.onCreateNode = async ({
  node,
  actions,
  store,
  cache,
  createNodeId,
  getNode,
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
        createNodeId,
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
          (fileNode) => node.mainImageHref !== fileNode.href
        )
      }

      const imageFetchingPromises = imageNodes.map(async (fileNode) => {
        let imageNode

        try {
          imageNode = await createRemoteFileNode({
            url: fileNode.href,
            store,
            cache,
            createNode,
            createNodeId,
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
    [`MoltinBrand`, `MoltinCategory`, `MoltinCollection`].includes(
      node.internal.type
    ) &&
    node.relationships &&
    node.relationships.products
  ) {
    const getProductNodes = async () => {
      const productIds = node.relationships.products.data.map(
        (product) => product.id
      )

      let productNodes = []

      await productIds.forEach(async (productId) => {
        const productNode = await getNode(productId)

        if (productNode) productNodes.push(productNode.id)
      })

      return productNodes
    }

    node.products___NODE = await getProductNodes()
  }
}
