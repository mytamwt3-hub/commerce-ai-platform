import { saleWebhookSchema } from '../src/validation/schemas';

describe('validation schemas', () => {
  test('saleWebhookSchema accepts valid payload', () => {
    const valid = { orderId: 'ORD123', quantity: 2, unitPrice: 10.5 };
    const { error } = saleWebhookSchema.validate(valid);
    expect(error).toBeUndefined();
  });

  test('saleWebhookSchema rejects missing orderId', () => {
    const invalid = { quantity: 2, unitPrice: 10.5 };
    const { error } = saleWebhookSchema.validate(invalid);
    expect(error).toBeDefined();
  });
});
