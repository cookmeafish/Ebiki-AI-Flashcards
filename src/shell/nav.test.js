// Every core sidebar screen has a label and a flyout description in every language.
import { describe, it, expect } from 'vitest'
import { CORE_NAV } from './layout'
import { I18N_LANGS, makeT } from '../i18n'

describe('core sidebar screens', () => {
  for (const n of CORE_NAV) {
    it(`${n.id} is named and described in every language`, () => {
      for (const l of I18N_LANGS) {
        const t = makeT(l)
        for (const key of ['tab_' + n.id, 'nav_desc_' + n.id]) expect(t(key), `${key} (${l})`).not.toBe(key)
      }
    })
  }
})
