const {
  findCartById,
  checkProductByServer,
} = require("../models/repository/cart.repo");

const { BadRequestError } = require("../core/error.response");

const DiscountService = require("../services/discount.service");
const { acquireLock, releaseLock } = require("./redis.service");
const { order } = require("../models/order.model");

class CheckoutService {
  // login and without login
  /*
    cartId,
    userId,
    shop_order_ids: [
      {
        shopId,
        shop_discounts: [
          {
            "shopId",
            "discountId",
            "codeId"
          }
        ],
        item_products:[
          {
            price,
            quantity,
            productId
          }
        ]
      }
    ]
  */
  static async checkoutReview({ cartId, userId, shop_order_ids = [] }) {
    console.log("cartId", cartId);
    //check CardId tồn tại hay ko?
    const foundCart = await findCartById(cartId);

    if (!foundCart) {
      throw new BadRequestError("Cart does not exists");
    }

    const checkout_order = {
        totalPrice: 0, //tong tien hang
        freeShip: 0, //phi van chuyen
        totalDiscount: 0, //tong tien discount giam gia
        totalCheckout: 0, //tong thanh toan
      },
      shop_order_ids_new = [];

    //tinh tong tien bill
    for (let i = 0; i < shop_order_ids.length; i++) {
      const {
        shopId,
        shop_discounts = [],
        item_products = [],
      } = shop_order_ids[i];

      const checkProductServer = await checkProductByServer(item_products);

      if (!checkProductServer[0]) throw new BadRequestError("Order wrong!!!");

      //tong tien don hang
      const checkoutPrice = checkProductServer.reduce((acc, product) => {
        return acc + product.quantity * product.price;
      }, 0);
      // tong tien truoc khi xu ly
      checkout_order.totalPrice += checkoutPrice;

      const itemCheckout = {
        shopId,
        shop_discounts,
        priceRaw: checkoutPrice, // tien truoc khi giam gia
        priceApplyDiscount: checkoutPrice,
        item_products: checkProductServer,
      };

      //neu shop_discounts ton tai > 0, check xem co hop le hay k?
      if (shop_discounts.length > 0) {
        // gia su co 1 discount
        // get amount discount

        const { totalPrice = 0, discount = 0 } =
          await DiscountService.getDiscountAmount({
            codeId: shop_discounts[0].codeId,
            userId,
            shopId,
            products: checkProductServer,
          });

        //tong cong discount giam gia
        checkout_order.totalDiscount += discount;

        if (discount > 0) {
          itemCheckout.priceApplyDiscount = checkoutPrice - discount;
        }
      }
      //tong thanh toan cuoi cung
      checkout_order.totalCheckout += itemCheckout.priceApplyDiscount;

      shop_order_ids_new.push(itemCheckout);
    }

    return {
      shop_order_ids,
      shop_order_ids_new,
      checkout_order,
    };
  }

  static async orderByUser({
    shop_order_ids,
    cartId,
    userId,
    user_address = {},
    user_payment = {},
  }) {
    const { shop_order_ids_new, checkout_order } =
      await CheckoutService.checkoutReview({
        cartId,
        userId,
        shop_order_ids,
      });
    //check has over inventory?
    //get array products
    const products = shop_order_ids_new.flatMap((order) => order.item_products);
    console.log(`[1]`, products);
    const acquireProducts = [];
    for (let i = 0; i < products.length; i++) {
      const { productId, quantity } = products[i];

      const keyLock = await acquireLock(productId, quantity, cartId);
      acquireProducts.push(keyLock ? true : false);

      if (keyLock) {
        await releaseLock(keyLock);
      }

      //check co 1 sp het hang
      if (acquireProducts.includes(false)) {
        throw new BadRequestError(
          "Mot so sp da dc cap nhat, voi long quay lai gio hang"
        );
      }
      const newOrder = await order.create({
        order_userId: userId,
        order_checkout: checkout_order,
        order_shopping: user_address,
        order_payment: user_payment,
        order_products: shop_order_ids_new,
      });

      //truong hop: new insert thanh cong remove product trong cart
      if (newOrder) {
        //remove product in my cart
      }

      return newOrder;
    }
  }

  /*
    1> Query Orders [Users]
  */
  static async getOrderByUser() {}
  /*
    1> Query Orders Using Id[Users]
  */
  static async getOneOrderByUser() {}
  /*
    1> Cancel Orders [Users]
  */
  static async cancelOrderByUser() {}
  /*
    1> Update Orders Status [Shop|Admin]
  */
  static async updateOrderStatusByShop() {}
}

module.exports = CheckoutService;
