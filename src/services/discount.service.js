/**
 * Discount Service
 * 1 - Generator Discount Code [Shop | Admin]
 * 2 - Get Discount amount [User]
 * 3 - Get all discount codes [User | Shop]
 * 4 - Verify discount code [User]
 * 5 - Delete discount Code [Admin | Shop]
 * 6 - Cancel Discount Code [User]
 *
 */

const { BadRequestError, NotFoundError } = require("../core/error.response");
const discount = require("../models/discount.model");
const {
  findDiscountCodesUnSelect,
  checkDiscountExists,
} = require("../models/repository/discount.repo");
const { findAllProducts } = require("../models/repository/product.repo");
const { convertToObjectIdMongodb } = require("../utils");

class DiscountService {
  static async createDiscountCode(payload) {
    const {
      code,
      start_date,
      end_date,
      is_active,
      shopId,
      min_orders_value,
      product_ids,
      applies_to,
      name,
      description,
      type,
      value,
      max_value,
      max_uses_per_user,
      max_uses,
      uses_count,
      users_used,
    } = payload;

    // if (new Date() < new Date(start_date) || new Date() > new Date(end_date)) {
    //   throw new BadRequestError("Discount code has expired");
    // }

    if (new Date(start_date) > new Date(end_date)) {
      throw new BadRequestError("Start date must be before end date");
    }

    //create index for discount code
    const foundDiscount = await discount
      .findOne({
        discount_code: code,
        discount_shopId: convertToObjectIdMongodb(shopId),
      })
      .lean();

    if (foundDiscount && foundDiscount.discount_is_active) {
      throw new BadRequestError("Discount exists");
    }

    const newDiscount = await discount.create({
      discountName: name,
      discount_description: description,
      discount_type: type,
      discount_value: value,
      discount_max_value: max_value,
      discount_code: code,
      discount_start_date: new Date(start_date),
      discount_end_date: new Date(end_date),
      discount_max_uses: max_uses,
      discount_uses_count: uses_count,
      discount_users_used: users_used,
      discount_max_uses_per_user: max_uses_per_user,
      discount_min_orders_value: min_orders_value || 0,
      discount_shopId: shopId,
      discount_is_active: is_active,
      discount_applies_to: applies_to,
      discount_product_ids: applies_to === "all" ? [] : product_ids,
    });

    return newDiscount;
  }

  static async updateDiscountCode() {
    //
  }

  /**
   * Get all discount codes available with products
   */

  static async getAllDiscountCodesWithProduct({ code, shopId, limit, page }) {
    const foundDiscount = await discount
      .findOne({
        discount_code: code,
        discount_shopId: convertToObjectIdMongodb(shopId),
      })
      .lean();

    if (!foundDiscount || !foundDiscount.discount_is_active) {
      throw new NotFoundError("Discount not exists");
    }

    const { discount_applies_to, discount_product_ids } = foundDiscount;

    let products;

    if (discount_applies_to === "all") {
      //get all product
      products = findAllProducts({
        filter: {
          product_shop: convertToObjectIdMongodb(shopId),
          isPublished: true,
        },
        limit: +limit,
        page: page,
        select: ["product_name"],
      });
    }

    if (discount_applies_to === "specific") {
      //get the product ids
      products = await findAllProducts({
        filter: {
          _id: { $in: discount_product_ids },
          isPublished: true,
        },
        limit: +limit,
        page: page,
        select: ["product_name"],
      });
    }

    return products;
  }

  /**
   * Get discount code of shop
   */

  static async getAllDiscountCodeByShop({ limit, page, shopId }) {
    const discounts = await findDiscountCodesUnSelect({
      limit: +limit,
      page: +page,
      filter: {
        discount_shopId: convertToObjectIdMongodb(shopId),
        discount_is_active: true,
      },
      unSelect: ["__v", "discount_shopId"],
      model: discount,
    });

    return discounts;
  }

  /**
   * Apply discount Code
   * products  = [ {
   *  productId,
   * ShopId,
   * quantity,
   * name,
   * price,
   * }]
   *  */
  static async getDiscountAmount({ codeId, userId, shopId, products }) {
    const foundDiscount = await checkDiscountExists({
      model: discount,
      filter: {
        discount_code: codeId,
        discount_shopId: convertToObjectIdMongodb(shopId),
      },
    });

    if (!foundDiscount) throw new NotFoundError(`Discount don't exists`);

    const {
      discount_is_active,
      discount_max_uses,
      discount_min_orders_value,
      discount_type,
      discount_users_used,
      discount_max_uses_per_user,
      discount_value,
    } = foundDiscount;
    if (!discount_is_active) throw new NotFoundError(`Discount expired!`);
    if (!discount_max_uses) throw new NotFoundError(`Discount are out!`);

    // if (
    //   new Date() < new Date(discount_start_date) ||
    //   new Date() > new Date(discount_end_date)
    // ) {
    //   throw new NotFoundError(`Discount encode has expired!`);
    // }

    let totalOrder = 0;
    if (discount_min_orders_value > 0) {
      console.log(products);
      //get total
      totalOrder = products.reduce((acc, product) => {
        return acc + product.quantity * product.price;
      }, 0);

      if (totalOrder < discount_min_orders_value) {
        throw new NotFoundError(
          `Discount requires a minium order value of ${discount_min_orders_value}!`
        );
      }
    }

    if (discount_max_uses_per_user > 0) {
      const userUserDiscount = discount_users_used.find(
        (user) => user.userId === userId
      );

      if (userUserDiscount) {
        //
      }
    }

    const amount =
      discount_type === "fixed_amount"
        ? discount_value
        : totalOrder * (discount_value / 100);

    return {
      totalOrder,
      discount: amount,
      totalPrice: totalOrder - amount,
    };
  }

  static async deleteDiscountCode({ shopId, codeId }) {
    const deleted = await discount.findOneAndDelete({
      discount_code: codeId,
      discount_shopId: convertToObjectIdMongodb(shopId),
    });

    return deleted;
  }
  /**
   * Cancel Discount code ()
   */
  static async cancelDiscountCode({ codeId, shopId, userId }) {
    const foundDiscount = await checkDiscountExists({
      model: discount,
      filter: {
        discount_code: codeId,
        discount_shopId: convertToObjectIdMongodb(shopId),
      },
    });

    if (!foundDiscount) throw new NotFoundError("Discount not exists");

    const result = await discount.findByIdAndUpdate(foundDiscount._id, {
      $pull: {
        discount_users_used: userId,
      },
      $inc: {
        discount_max_uses: 1,
        discount_uses_count: -1,
      },
    });
    return result;
  }
}

module.exports = DiscountService;
