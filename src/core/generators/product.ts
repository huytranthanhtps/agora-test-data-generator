import type { Generator } from '../types'
import { slugify } from './shared'
import { loremByLen } from '../text'
import { faker } from '../faker-seed'
import {
  SUBJECTS, PRODUCT_BASES, PRODUCT_STATUS, PRODUCT_TYPE, VARIANT_TYPE, TIME_PERIOD,
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
    { key: 'slug', label: 'Slug' },
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
        'AGR-' + Array.from({ length: 6 }, () => ALNUM[rng.int(0, ALNUM.length - 1)]).join(''))
      const name = uniq.ensure('product.name', () => {
        const base = `${rng.pick(SUBJECTS)} ${rng.pick(PRODUCT_BASES)}`
        return len === 'stress' ? `${base} ${rng.pick(TIME_PERIOD)} Edition` : base
      })
      return {
        sku,
        name,
        description: loremByLen(rng, len),
        slug: slugify(name),
        variantName: faker.commerce.productAdjective() + ' ' + faker.commerce.product(),
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
