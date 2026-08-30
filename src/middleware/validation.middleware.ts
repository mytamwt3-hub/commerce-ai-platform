import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

export function validateBody(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (result.error) {
      return res.status(400).json({ error: 'Validation failed', details: result.error.details.map(d => d.message) });
    }
    req.body = result.value;
    return next();
  };
}
