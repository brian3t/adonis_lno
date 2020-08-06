const axios = require("axios")
const cheerio = require("cheerio")

async function fetchHTML(url) {
  const { data } = await axios.get(url)
  return cheerio.load(data)
}
async function main() {
  const $ = await fetchHTML("https://example.com")

// Print the full HTML
  console.log(`Site HTML: ${$.html()}\n\n`)

// Print some specific page content
  console.log(`First h1 tag: ${$('h1').text()}`)
}
main()
