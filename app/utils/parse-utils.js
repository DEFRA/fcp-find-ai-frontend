const parseItemFromContext = (contextDocument) => {
  const split = contextDocument.split('===')
  const header = split[0]
  const textBody = split[1]

  const headerSplit = header.split('|')

  const title = headerSplit[0].substring(8, headerSplit[0].length)
  const grantSchemeName = headerSplit[1].substring(19, headerSplit[1].length)
  const sourceUrl = headerSplit[2].substring(8, headerSplit[2].length)

  const item = {
    title,
    scheme: grantSchemeName,
    url: sourceUrl,
    summary: textBody
  }

  return item
}

module.exports = {
  parseItemFromContext
}
