import Joi from 'joi';

export const saleWebhookSchema = Joi.object({
  requestId: Joi.string().guid({ version: 'uuidv4' }).optional().allow(null),
  productId: Joi.string().optional().allow(null),
  orderId: Joi.string().required(),
  quantity: Joi.number().integer().min(1).required(),
  unitPrice: Joi.number().precision(2).min(0).required()
});

export const createDeliverySchema = Joi.object({
  orderId: Joi.string().required(),
  pickupLocation: Joi.object().required(),
  deliveryLocation: Joi.object().required(),
  shippingCost: Joi.number().precision(2).min(0).optional()
});
