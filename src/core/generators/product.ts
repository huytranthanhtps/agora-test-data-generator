import type { Generator } from '../types'
import { productDescription, iconicName } from '../text'
import {
  SUBJECTS,
  GRADES,
  PRODUCT_BASES,
  PRODUCT_EDITIONS,
  PRODUCT_STATUS,
  PRODUCT_TYPE,
  VARIANT_TYPE,
  TIME_PERIOD,
} from '../data'

const ALNUM = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

export const productGenerator: Generator = {
  key: 'product',
  label: 'Product',
  shortcut: 6,
  fields: [
    { key: 'sku', label: 'SKU' },
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'variantName', label: 'Variant name' },
    { key: 'status', label: 'Status' },
    { key: 'productType', label: 'Product type' },
    { key: 'variantType', label: 'Variant type' },
    { key: 'timePeriod', label: 'Time period' },
    { key: 'price', label: 'Price (SGD)' },
    { key: 'currency', label: 'Currency' },
    { key: 'requireStudent', label: 'Require student' },
    { key: 'isDeposit', label: 'Is deposit' },
  ],
  generate({ count, len }, { rng, uniq }) {
    return Array.from({ length: count }, () => {
      const sku = uniq.ensure('product.sku', () =>
        'AGR-' + Array.from({ length: 6 }, () => ALNUM[rng.int(0, ALNUM.length - 1)]).join(''),
      )
      // Name/variant are faker + lorem + icons; subject/grade/base/edition
      // still drive the (education-flavoured) description.
      const subject = rng.pick(SUBJECTS)
      const grade = rng.pick(GRADES)
      const base = rng.pick(PRODUCT_BASES)
      const edition = rng.pick(PRODUCT_EDITIONS)
      const name = uniq.ensure('product.name', () => iconicName(rng, len))
      return {
        sku,
        name,
        description: productDescription(rng, { subject, grade, base, edition }, len),
        variantName: iconicName(rng, len),
        status: rng.pick(PRODUCT_STATUS),
        productType: rng.pick(PRODUCT_TYPE),
        variantType: rng.pick(VARIANT_TYPE),
        timePeriod: rng.pick(TIME_PERIOD),
        price: String(rng.int(50, 1200)),
        currency: 'SGD',
        requireStudent: String(rng.bool()),
        isDeposit: String(rng.bool(0.3)),
      }
    })
  },
}
