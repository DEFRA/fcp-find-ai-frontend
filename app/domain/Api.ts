interface Item {
  title: string
  scheme?: string
  url: string
  summary: string
}

interface BotAnswer {
  role: string
  answer: string
  items: Item[]
  source_urls: string[]
  is_latest: boolean
}
