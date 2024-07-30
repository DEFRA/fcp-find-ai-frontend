const { parseItemFromContext } = require('../../../app/utils/parse-utils')

describe('parse utils', () => {
  test('parseItemFromContext', () => {
    const context = '(Title: WBD1: Manage ponds | Grant Scheme Name: Sustainable Farming Incentive (SFI) | Source: https://www.gov.uk/find-funding-for-land-or-farms/wbd1-manage-ponds | Chunk Number: 1)===The Sustainable Farming Incentive (SFI) scheme is offering an expanded opportunity for farmers in 2024. The scheme aims to enhance biodiversity, improve water quality, and provide habitats for aquatic species through the creation of ponds. Farmers will be paid £257 per pond per year for a maximum of 3 ponds per hectare. To be eligible, the ponds must meet certain criteria, such as size and location. Farmers must manage the ponds by controlling scrub, preventing livestock damage, and avoiding artificial interventions. Evidence of pond management must be kept, and other actions can be taken on the same land parcel.'

    const item = parseItemFromContext(context)

    expect(item).toStrictEqual({
      title: 'WBD1: Manage ponds ',
      scheme: ' Sustainable Farming Incentive (SFI) ',
      url: ' https://www.gov.uk/find-funding-for-land-or-farms/wbd1-manage-ponds ',
      summary: 'The Sustainable Farming Incentive (SFI) scheme is offering an expanded opportunity for farmers in 2024. The scheme aims to enhance biodiversity, improve water quality, and provide habitats for aquatic species through the creation of ponds. Farmers will be paid £257 per pond per year for a maximum of 3 ponds per hectare. To be eligible, the ponds must meet certain criteria, such as size and location. Farmers must manage the ponds by controlling scrub, preventing livestock damage, and avoiding artificial interventions. Evidence of pond management must be kept, and other actions can be taken on the same land parcel.'
    })
  })
})
