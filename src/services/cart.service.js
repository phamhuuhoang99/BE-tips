"use strict";

const { cart } = require("../models/cart.model");
const { getProductById } = require("../models/repository/product.repo");
const { NotFoundError } = require("../core/error.response");

/**
 * Key features: Cart Service
 * - add product
 * - reduce product quantity by one [User]
 * - increase product quantity by One [User]
 * - get cart [User]'
 * - Delete cart [User]
 * - Delete cart item [User]
 */
class CartService {
  /**Start Repo Cart */
  static async createUserCart({ userId, product }) {
    const query = { cart_userId: userId, cart_state: "active" },
      updateOrInsert = {
        $addToSet: {
          cart_products: product,
        },
      },
      options = { upsert: true, new: true };

    return await cart.findOneAndUpdate(query, updateOrInsert, options);
  }
  static async updateUserCart({ userId, product }) {
    const query = {
        cart_userId: userId,
        cart_state: "active",
      },
      updateSet = {
        $addToSet: {
          cart_products: product,
        },
      },
      options = {
        upsert: true,
        new: true,
      };
    return await cart.findOneAndUpdate(query, updateSet, options);
  }

  static async updateUserCartQuantity({ userId, product }) {
    const { productId, quantity } = product;
    const query = {
        cart_userId: userId,
        "cart_products.productId": productId,
        cart_state: "active",
      },
      updateSet = {
        $inc: {
          "cart_products.$.quantity": quantity,
        },
      },
      options = {
        upsert: true,
        new: true,
      };

    return await cart.findOneAndUpdate(query, updateSet, options);
  }
  /**End Repo Cart */

  static async addToCart({ userId, product = {} }) {
    // check cart ton tai hay ko?
    const userCart = await cart.findOne({ cart_userId: userId });

    if (!userCart) {
      //create cart for User
      return await CartService.createUserCart({ userId, product });
    }

    // neu co gio hang nhung chua co sp
    if (!userCart.cart_products.length) {
      userCart.cart_products = [product];
      return await userCart.save();
    }

    //neu gio hang ton tại và chưa có sản phẩm
    //find product in car
    const { productId } = product;

    const findProductInCart = userCart.cart_products.find(
      (product) => product.productId === productId
    );

    if (!findProductInCart) {
      return await CartService.updateUserCart({ userId, product });
    }
    //neu gio hang ton tai va co san pham nay thi update quantity
    return await CartService.updateUserCartQuantity({ userId, product });
  }

  //update cart
  /*
  shop_order_ids: [
    {
      shopId,
      item_products:[
        {
          quantity,
          price,
          shopId,
          old_quantity,
          productId
        }
      ]
    }
  ]

  */

  static async addToCartV2({ userId, shop_order_ids }) {
    const { productId, quantity, old_quantity } =
      shop_order_ids[0]?.item_products[0];

    const foundProduct = await getProductById(productId);

    if (!foundProduct) throw new NotFoundError("");

    if (foundProduct.product_shop.toString() !== shop_order_ids[0]?.shopId) {
      throw new NotFoundError("Product not belong to the shop");
    }

    if (quantity === 0) {
      //deleted
    }

    return await CartService.updateUserCartQuantity({
      userId,
      product: {
        productId,
        quantity: quantity - old_quantity,
      },
    });
  }

  static async deleteUserCart({ userId, productId }) {
    const query = { cart_userId: userId, cart_state: "active" },
      updateSet = {
        $pull: {
          cart_products: {
            productId,
          },
        },
      };

    const deleteCart = await cart.updateOne(query, updateSet);

    return deleteCart;
  }

  static async getListUserCart({ userId }) {
    return await cart
      .findOne({
        cart_userId: +userId,
      })
      .lean();
  }
}

module.exports = CartService;
