interface Item {
  title: string
  url: string
  summary: string
}

interface BotAnswer {
  answer: string
  items: Item[]
  source_urls: string[]
}
