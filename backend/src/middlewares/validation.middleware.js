const { error } = require('../utils/apiResponse');

/**
 * Generic Zod validation middleware factory
 * @param {ZodSchema} schema - Zod schema to validate against
 * @param {string} source - 'body' | 'query' | 'params'
 */
const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    return error(res, 'Validation failed', 422, errors);
  }
  req[source] = result.data;
  next();
};

module.exports = { validate };
